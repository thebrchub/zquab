import protobuf from 'protobufjs'; 
import chatProtoSrc from '../proto/chat.proto?raw';
import eventsProtoSrc from '../proto/events.proto?raw';

type Status = 'searching' | 'connected' | 'disconnected';

type ChatCallbackOptions = {
  onStatusChange: (status: Status) => void;
  onIncomingMessage: (message: ChatMessage) => void;
  onSystemMessage: (text: string) => void;
  onMatchFound: (roomId: string, partnerId: string, partnerLocation?: string, partnerUsername?: string, isFriend?: boolean) => void;
  onDisconnected: (reason: string) => void;
  onSocketOpen?: () => void;
  onSocketClose?: (code: number, reason: string) => void;
  onError?: (error: string) => void;
  onPhotoRequest?: (roomId: string, from: string) => void;
  onPhotoResponse?: (roomId: string, from: string, accepted: boolean) => void;
  onPhotoReady?: (roomId: string, from: string, url: string, expiresAt: number) => void;
  onFriendAccepted?: (dmRoomId: string) => void;
  onLocationDetected?: (country: { name: string; code: string } | null) => void;
  onPartnerTyping?: (isTyping: boolean) => void; 
};

type ChatMessage = {
  id: string;
  text: string;
  isOwn: boolean;
  isSystem?: boolean;
  imageUrl?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://api.zquab.com';
const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'wss://api.zquab.com';

export class ChatClient {
  private socket: WebSocket | null = null;
  private currentRoomId: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private friendPresenceTimer: number | null = null; // 🛠️ NEW: Timer for friend disconnect tracking
  private isShuttingDown = false;
  private knownMessageIds = new Set<string>();
  private callbacks: ChatCallbackOptions;

  // Protobuf Types 
  private Envelope: protobuf.Type | null = null;
  private ChatMessageProto: protobuf.Type | null = null;
  private MatchFound: protobuf.Type | null = null;
  private StrangerDisconnected: protobuf.Type | null = null;
  private SystemEvent: protobuf.Type | null = null;
  private PhotoRequestProto: protobuf.Type | null = null;
  private PhotoResponseProto: protobuf.Type | null = null;
  private PhotoReadyProto: protobuf.Type | null = null;
  private FriendAcceptedProto: protobuf.Type | null = null;
  private FriendRequestProto: protobuf.Type | null = null;

  // We no longer need to rely on this heavily, but keeping it for compatibility
  private locationCode: string | null = null;

  constructor(callbacks: ChatCallbackOptions) {
    this.callbacks = callbacks;
  }

  async start() {
    try {
      this.detectLocation();
      await this.loadProtos();
      await this.ensureGuest();
      this.connect();
    } catch (error) {
      this.callbacks.onError?.('Failed to initialize chat client.');
      console.error(error);
    }
  }

  private async detectLocation() {
    // 🛠️ FIXED: Removed 3rd-party IP lookup. We now rely strictly on DB profile data.
    this.locationCode = null;
    this.callbacks.onLocationDetected?.(null);
  }

  private async loadProtos() {
    const root = new protobuf.Root();
    protobuf.parse(chatProtoSrc, root);
    protobuf.parse(eventsProtoSrc, root);

    this.Envelope = root.lookupType('chatpb.Envelope');
    this.ChatMessageProto = root.lookupType('chatpb.ChatMessage');
    this.SystemEvent = root.lookupType('chatpb.SystemEvent');
    this.MatchFound = root.lookupType('eventspb.MatchFound');
    this.StrangerDisconnected = root.lookupType('eventspb.StrangerDisconnected');
    this.PhotoRequestProto = root.lookupType('eventspb.PhotoRequest');
    this.PhotoResponseProto = root.lookupType('eventspb.PhotoResponse');
    this.PhotoReadyProto = root.lookupType('eventspb.PhotoReady');
    this.FriendAcceptedProto = root.lookupType('eventspb.FriendAccepted');
    this.FriendRequestProto = root.lookupType('eventspb.FriendRequest');
  }

  async ensureGuest() {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/guest`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Guest login failed');
      }

      const data = await response.json();
      if (typeof data.user_id === 'string') {
        this.userId = data.user_id;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Guest login error';
      this.callbacks.onError?.(message);
      throw error;
    }
  }

  private connect() {
    if (!this.Envelope) return; 

    this.clearReconnectTimer();
    this.socket = new WebSocket(`${WS_BASE}/ws`);
    this.socket.binaryType = 'arraybuffer';

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.callbacks.onSocketOpen?.();
      this.enterMatch().catch((error) => {
        this.callbacks.onError?.(String(error));
      });
    };

    this.socket.onmessage = (event) => {
      const data = event.data;
      if (!(data instanceof ArrayBuffer) || !this.Envelope) {
        return;
      }

      try {
        const bytes = new Uint8Array(data);
        const envelope = this.Envelope.decode(bytes) as any;
        const payload = envelope.payload as Uint8Array;
        const type = envelope.type as string;

        switch (type) {
          case 'match_found': {
            if (!this.MatchFound) break;
            const match = this.MatchFound.decode(payload) as any;
            const roomId = match.roomId as string;
            const partnerId = match.partnerId as string;
            const partnerUsername = match.partnerUsername as string | undefined;
            const isFriend = Boolean((match as any).isFriend ?? (match as any).is_friend ?? false);
            this.currentRoomId = roomId;

            // 🛠️ ASYNC HANDLER: Fetch true country from database and handle friend presence
            (async () => {
              let partnerLocation = match.partnerLocation as string | undefined;

              // 1. Resolve Country from Profile if missing
              if ((!partnerLocation || partnerLocation === 'Unknown location' || partnerLocation.trim() === '') && partnerUsername) {
                try {
                  // Ensure this endpoint matches your backend profile route
                  const res = await fetch(`${API_BASE}/api/v1/users/${partnerUsername}`, { credentials: 'include' });
                  if (res.ok) {
                    const profile = await res.json();
                    if (profile?.country) partnerLocation = profile.country;
                  }
                } catch (e) {
                  console.error('Failed to fetch partner profile for location', e);
                }
              }

              // 2. Race condition check: Ensure the user didn't hit "Next" while we were fetching
              if (this.currentRoomId !== roomId) return;

              this.callbacks.onMatchFound(roomId, partnerId, partnerLocation, partnerUsername, isFriend);
              this.callbacks.onStatusChange('connected');

              // 3. Friend Phantom Connection Fix: Start the heartbeat tracker!
              if (isFriend && partnerUsername) {
                this.startFriendPresenceCheck(partnerUsername, roomId);
              }
            })();
            break;
          }
          case 'chat_message': {
            if (!this.ChatMessageProto) break;
            const msg = this.ChatMessageProto.decode(payload) as any;
            const messageId = (envelope.id as string) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            
            if (this.knownMessageIds.has(messageId)) {
              break;
            }
            
            this.knownMessageIds.add(messageId);
            const text = msg.text as string;
            const from = envelope.from as string;
            
            this.callbacks.onPartnerTyping?.(false);

            this.callbacks.onIncomingMessage({
              id: messageId,
              text,
              isOwn: from !== undefined && this.userId !== null && from === this.userId,
            });
            break;
          }
          case 'stranger_disconnected': {
            if (!this.StrangerDisconnected) break;
            const disconnected = this.StrangerDisconnected.decode(payload) as any;
            const roomId = disconnected.roomId as string;

            if (roomId !== this.currentRoomId) break;

            this.currentRoomId = null;
            this.stopFriendPresenceCheck(); // 🛠️ Clear heartbeat
            this.callbacks.onStatusChange('disconnected');
            this.callbacks.onSystemMessage('The stranger disconnected.');
            this.callbacks.onDisconnected('Stranger disconnected');
            break;
          }
          case 'room_closed': {
            const closedRoomId = envelope.roomId as string;

            if (closedRoomId && closedRoomId !== this.currentRoomId) break;

            this.currentRoomId = null;
            this.stopFriendPresenceCheck(); // 🛠️ Clear heartbeat
            this.callbacks.onStatusChange('disconnected');
            this.callbacks.onSystemMessage('Chat room closed.');
            this.callbacks.onDisconnected('Room closed');
            break;
          }
          case 'friend_accepted': {
            if (!this.FriendAcceptedProto) break;
            const accepted = this.FriendAcceptedProto.decode(payload) as any;
            this.callbacks.onFriendAccepted?.(accepted.dmRoomId as string);
            this.callbacks.onSystemMessage("You're now friends!");
            break;
          }
          case 'friend_request': {
            if (!this.FriendRequestProto) break;
            const req = this.FriendRequestProto.decode(payload) as any;
            if ((req.roomId as string) !== this.currentRoomId) break;
            this.callbacks.onSystemMessage('Stranger wants to be friends! Click Add Friend to accept.');
            break;
          }
          case 'error': {
            if (!this.SystemEvent) break;
            const err = this.SystemEvent.decode(payload) as any;
            const message = (err.message as string) || 'Chat error received';
            this.callbacks.onError?.(message);
            this.callbacks.onSystemMessage(message);
            break;
          }
          case 'photo_request': {
            if (!this.PhotoRequestProto) break;
            const req = this.PhotoRequestProto.decode(payload) as any;
            this.callbacks.onPhotoRequest?.(req.roomId as string, req.from as string);
            break;
          }
          case 'photo_response': {
            if (!this.PhotoResponseProto) break;
            const res = this.PhotoResponseProto.decode(payload) as any;
            this.callbacks.onPhotoResponse?.(res.roomId as string, res.from as string, Boolean(res.accepted));
            break;
          }
          case 'photo_ready': {
            if (!this.PhotoReadyProto) break;
            const ready = this.PhotoReadyProto.decode(payload) as any;
            this.callbacks.onPhotoReady?.(ready.roomId as string, ready.from as string, ready.url as string, Number(ready.expiresAt));
            break;
          }
          case 'typing_start':
          case 'typing_status': {
            this.callbacks.onPartnerTyping?.(true);
            break;
          }
          case 'typing_end': {
            this.callbacks.onPartnerTyping?.(false);
            break;
          }
        }
      } catch (error) {
        this.callbacks.onError?.(String(error));
      }
    };

    this.socket.onclose = (event) => {
      this.callbacks.onSocketClose?.(event.code, event.reason);
      if (this.isShuttingDown) {
        return;
      }
      this.callbacks.onStatusChange('searching');
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.callbacks.onError?.('WebSocket error occurred.');
    };
  }

  // 🛠️ NEW: Heartbeat to catch when a friend disconnects/goes offline
  private startFriendPresenceCheck(username: string, roomId: string) {
    this.stopFriendPresenceCheck();
    this.friendPresenceTimer = window.setInterval(async () => {
      if (this.currentRoomId !== roomId) {
        this.stopFriendPresenceCheck();
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/api/v1/users/${username}`, { credentials: 'include' });
        if (response.ok) {
          const profile = await response.json();
          // If backend marks them offline, they closed the app! Disconnect!
          if (profile && profile.is_online === false) {
            if (this.currentRoomId === roomId) {
              this.currentRoomId = null;
              this.callbacks.onStatusChange('disconnected');
              this.callbacks.onSystemMessage('Your friend left the chat.');
              this.callbacks.onDisconnected('Friend left');
              this.stopFriendPresenceCheck();
            }
          }
        }
      } catch (e) { /* Ignore temporary network glitches */ }
    }, 10000); // Check every 10 seconds
  }

  private stopFriendPresenceCheck() {
    if (this.friendPresenceTimer !== null) {
      window.clearInterval(this.friendPresenceTimer);
      this.friendPresenceTimer = null;
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts += 1;
    const delay = Math.min(3000, 500 + this.reconnectAttempts * 500);
    this.clearReconnectTimer();
    this.reconnectTimer = window.setTimeout(() => {
      if (!this.isShuttingDown) {
        this.connect();
      }
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  async enterMatch() {
    const response = await this.restPost('/api/v1/match/enter', this.locationCode ? { location: this.locationCode } : {});
    const matchedRoomId = typeof (response as any)?.room_id === 'string' ? (response as any).room_id : null;
    const matchedPartnerUsername = typeof (response as any)?.partner_username === 'string' ? (response as any).partner_username : undefined;
    const matchedPartnerLocation = typeof (response as any)?.partner_location === 'string' ? (response as any).partner_location : undefined;
    const matchedIsFriend = Boolean((response as any)?.is_friend ?? (response as any)?.isFriend ?? false);

    if (matchedRoomId) {
      this.currentRoomId = matchedRoomId;
      this.callbacks.onMatchFound(matchedRoomId, '', matchedPartnerLocation, matchedPartnerUsername, matchedIsFriend);
      this.callbacks.onStatusChange('connected');
      return;
    }

    if (this.currentRoomId) {
      return;
    }

    this.callbacks.onStatusChange('searching');
  }

  async leaveQueue() {
    await this.restPost('/api/v1/match/leave', {});
    this.callbacks.onStatusChange('searching');
  }

  leaveQueueSilently(keepalive = false) {
    this.stopFriendPresenceCheck(); // Clean up heartbeat
    fetch(`${API_BASE}/api/v1/match/leave`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      keepalive,
    }).catch(() => {});
  }

  async sendMatchAction(roomId: string, action: 'skip' | 'block' | 'friend') {
    return this.restPost('/api/v1/match/action', { room_id: roomId, action });
  }

  sendChatMessage(text: string): string | null {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.currentRoomId || !this.Envelope || !this.ChatMessageProto) {
      return null;
    }

    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const chatMessage = this.ChatMessageProto.create({ text });
    const payload = this.ChatMessageProto.encode(chatMessage).finish();
    const envelope = this.Envelope.create({
      type: 'chat_message',
      roomId: this.currentRoomId,
      payload,
      id,
    });
    const bytes = this.Envelope.encode(envelope).finish();
    const payloadBuffer = bytes.buffer instanceof ArrayBuffer
      ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      : new Uint8Array(bytes).slice().buffer;

    this.socket.send(payloadBuffer);
    this.knownMessageIds.add(id);
    return id;
  }
  
  sendTypingStart() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.currentRoomId || !this.Envelope) {
      return;
    }
    try {
      const envelope = this.Envelope.create({ type: 'typing_start', roomId: this.currentRoomId });
      const bytes = this.Envelope.encode(envelope).finish();
      const payloadBuffer = bytes.buffer instanceof ArrayBuffer
        ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        : new Uint8Array(bytes).slice().buffer;
      this.socket.send(payloadBuffer);
    } catch (e) { 
      console.error('Failed to send typing_start:', e); 
    }
  }

  sendTypingEnd() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.currentRoomId || !this.Envelope) {
      return;
    }
    try {
      const envelope = this.Envelope.create({ type: 'typing_end', roomId: this.currentRoomId });
      const bytes = this.Envelope.encode(envelope).finish();
      const payloadBuffer = bytes.buffer instanceof ArrayBuffer
        ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        : new Uint8Array(bytes).slice().buffer;
      this.socket.send(payloadBuffer);
    } catch (e) { 
      console.error('Failed to send typing_end:', e); 
    }
  }

  async nextStranger() {
    if (!this.currentRoomId) {
      await this.enterMatch();
      return;
    }
    await this.skipAndRequeue(this.currentRoomId);
  }

  async skipAndRequeue(currentRoomId: string) {
    this.stopFriendPresenceCheck(); // Clean up heartbeat
    await this.sendMatchAction(currentRoomId, 'skip');
    this.currentRoomId = null;
    await this.enterMatch();
  }

  async blockCurrentPartner() {
    if (!this.currentRoomId) {
      return;
    }
    this.stopFriendPresenceCheck(); // Clean up heartbeat
    await this.sendMatchAction(this.currentRoomId, 'block');
    this.currentRoomId = null;
    this.callbacks.onStatusChange('disconnected');
  }

  async addCurrentPartnerAsFriend() {
    if (!this.currentRoomId) {
      throw new Error('No active room');
    }
    return this.sendMatchAction(this.currentRoomId, 'friend');
  }

  async requestPhoto() {
    if (!this.currentRoomId) throw new Error('No active room');
    await this.restPost('/api/v1/match/photo/request', { room_id: this.currentRoomId });
  }

  async declinePhotoRequest() {
    if (!this.currentRoomId) return;
    await this.restPost('/api/v1/match/photo/respond', { room_id: this.currentRoomId, accept: false });
  }

  async sharePhoto(file: File) {
    if (!this.currentRoomId) throw new Error('No active room');

    const respondBody = { room_id: this.currentRoomId, accept: true, content_type: file.type };
    const respondResult = (await this.restPost('/api/v1/match/photo/respond', respondBody)) as {
      status?: string;
      url?: string;
      object_key?: string;
    } | null;

    if (!respondResult?.url || !respondResult.object_key) {
      throw new Error('No upload URL received');
    }

    const uploadResponse = await fetch(respondResult.url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error(`Photo upload failed: ${uploadResponse.status}`);
    }

    await this.restPost('/api/v1/match/photo/uploaded', {
      room_id: this.currentRoomId,
      object_key: respondResult.object_key,
    });
  }

  shutdown() {
    this.isShuttingDown = true;
    this.stopFriendPresenceCheck(); // Clean up heartbeat
    this.clearReconnectTimer();
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }

  private async restPost(endpoint: string, body: unknown) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      let message = text;
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        // not JSON
      }
      throw new Error(message);
    }

    return response.json().catch(() => null);
  }
}

export type { Status, ChatMessage };