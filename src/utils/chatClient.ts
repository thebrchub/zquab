import protobuf from 'protobufjs'; // You can usually drop the /dist/ part in Vite

type Status = 'searching' | 'connected' | 'disconnected';

type ChatCallbackOptions = {
  onStatusChange: (status: Status) => void;
  onIncomingMessage: (message: ChatMessage) => void;
  onSystemMessage: (text: string) => void;
  onMatchFound: (roomId: string, partnerId: string, partnerLocation?: string) => void;
  onDisconnected: (reason: string) => void;
  onSocketOpen?: () => void;
  onSocketClose?: (code: number, reason: string) => void;
  onError?: (error: string) => void;
  onPhotoRequest?: (roomId: string, from: string) => void;
  onPhotoResponse?: (roomId: string, from: string, accepted: boolean) => void;
  onPhotoReady?: (roomId: string, from: string, url: string, expiresAt: number) => void;
  /** Fired once the local IP-geolocation lookup resolves (or fails). */
  onLocationDetected?: (country: { name: string; code: string } | null) => void;
};

interface IpApiResponse {
  country: string;      // alpha-2 code, e.g. "IN" (despite the name, this is the code — ipapi.co's full name field is `country_name`)
  country_name: string; // full country name, e.g. "India"
}

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
  private isShuttingDown = false;
  private knownMessageIds = new Set<string>();
  private callbacks: ChatCallbackOptions;

  // Protobuf Types (Loaded asynchronously)
  private Envelope: protobuf.Type | null = null;
  private ChatMessageProto: protobuf.Type | null = null;
  private MatchFound: protobuf.Type | null = null;
  private StrangerDisconnected: protobuf.Type | null = null;
  private SystemEvent: protobuf.Type | null = null;
  private PhotoRequestProto: protobuf.Type | null = null;
  private PhotoResponseProto: protobuf.Type | null = null;
  private PhotoReadyProto: protobuf.Type | null = null;

  // Detected once at startup and sent along with /match/enter so the server
  // can pass a `partner_location` through to the other side of a match.
  private locationCode: string | null = null;

  constructor(callbacks: ChatCallbackOptions) {
    this.callbacks = callbacks;
  }

  async start() {
    try {
      // Location detection runs in parallel — enterMatch() (fired from the
      // socket's onopen) reads whatever locationCode has resolved to by
      // then; a slow/failed lookup just means no location is sent, it
      // never blocks connecting.
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
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('Unable to determine location');
      const data: IpApiResponse = await res.json();
      this.locationCode = data.country || null;
      this.callbacks.onLocationDetected?.({
        name: data.country_name || 'Unknown country',
        code: data.country || '',
      });
    } catch {
      this.locationCode = null;
      this.callbacks.onLocationDetected?.({ name: 'Location unavailable', code: '' });
    }
  }

 private async loadProtos() {
    // 1. Fetch the files manually using browser fetch
    const [chatRes, eventsRes] = await Promise.all([
      fetch('/chat.proto'),
      fetch('/events.proto')
    ]);

    if (!chatRes.ok || !eventsRes.ok) {
      throw new Error('Failed to fetch .proto files from the public folder');
    }

    const chatText = await chatRes.text();
    const eventsText = await eventsRes.text();

    // 2. Parse the strings directly in memory to bypass the 'fs' dependency
    const root = new protobuf.Root();
    protobuf.parse(chatText, root);
    protobuf.parse(eventsText, root);
    
    this.Envelope = root.lookupType('chatpb.Envelope');
    this.ChatMessageProto = root.lookupType('chatpb.ChatMessage');
    this.SystemEvent = root.lookupType('chatpb.SystemEvent');
    this.MatchFound = root.lookupType('eventspb.MatchFound');
    this.StrangerDisconnected = root.lookupType('eventspb.StrangerDisconnected');
    this.PhotoRequestProto = root.lookupType('eventspb.PhotoRequest');
    this.PhotoResponseProto = root.lookupType('eventspb.PhotoResponse');
    this.PhotoReadyProto = root.lookupType('eventspb.PhotoReady');
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
      this.callbacks.onSystemMessage('Unable to initialize chat session.');
      throw error;
    }
  }

  private connect() {
    if (!this.Envelope) return; // Guard clause to ensure protos are loaded

    this.clearReconnectTimer();
    this.callbacks.onSystemMessage('Connecting to chat server...');
    this.socket = new WebSocket(`${WS_BASE}/ws`);
    this.socket.binaryType = 'arraybuffer';

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.callbacks.onSocketOpen?.();
      this.callbacks.onSystemMessage('Connected. Entering queue...');
      this.enterMatch().catch((error) => {
        this.callbacks.onError?.(String(error));
        this.callbacks.onSystemMessage('Unable to join queue.');
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
            const partnerLocation = match.partnerLocation as string | undefined;
            this.currentRoomId = roomId;
            this.callbacks.onMatchFound(roomId, partnerId, partnerLocation);
            this.callbacks.onStatusChange('connected');
            this.callbacks.onSystemMessage('Match found! Say hello.');
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

            // Ignore stale events for a room we've already left (e.g. after "Next").
            if (roomId !== this.currentRoomId) break;

            this.currentRoomId = null;
            this.callbacks.onStatusChange('disconnected');
            this.callbacks.onSystemMessage('The stranger disconnected.');
            this.callbacks.onDisconnected('Stranger disconnected');
            break;
          }
          case 'room_closed': {
            const closedRoomId = envelope.roomId as string;

            // Ignore stale events for a room we've already left (e.g. after "Next").
            if (closedRoomId && closedRoomId !== this.currentRoomId) break;

            this.currentRoomId = null;
            this.callbacks.onStatusChange('disconnected');
            this.callbacks.onSystemMessage('Chat room closed.');
            this.callbacks.onDisconnected('Room closed');
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
      this.callbacks.onSystemMessage('Disconnected from chat server. Retrying...');
      this.callbacks.onStatusChange('searching');
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.callbacks.onError?.('WebSocket error occurred.');
    };
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
    await this.restPost('/api/v1/match/enter', this.locationCode ? { location: this.locationCode } : {});

    // A match_found event may have already arrived over the WebSocket while
    // this request was in flight. Don't clobber the resulting 'connected'
    // status back to 'searching'.
    if (this.currentRoomId) {
      return;
    }

    this.callbacks.onSystemMessage('Searching for a stranger...');
    this.callbacks.onStatusChange('searching');
  }

  async leaveQueue() {
    await this.restPost('/api/v1/match/leave', {});
    this.callbacks.onSystemMessage('Left the queue.');
    this.callbacks.onStatusChange('searching');
  }

  /**
   * Best-effort queue cleanup with no state/callback side effects — for use
   * on unmount/page-unload where updating React state is pointless (or
   * impossible) and we just want the server to drop the stale queue entry.
   * `keepalive` lets the request outlive a page unload (e.g. tab close).
   */
  leaveQueueSilently(keepalive = false) {
    fetch(`${API_BASE}/api/v1/match/leave`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      keepalive,
    }).catch(() => {});
  }

  async sendMatchAction(roomId: string, action: 'skip' | 'block' | 'friend') {
    await this.restPost('/api/v1/match/action', { room_id: roomId, action });
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

  async nextStranger() {
    if (!this.currentRoomId) {
      await this.enterMatch();
      return;
    }
    await this.skipAndRequeue(this.currentRoomId);
  }

  async skipAndRequeue(currentRoomId: string) {
    await this.sendMatchAction(currentRoomId, 'skip');
    this.currentRoomId = null;
    await this.enterMatch();
  }

  async blockCurrentPartner() {
    if (!this.currentRoomId) {
      return;
    }
    await this.sendMatchAction(this.currentRoomId, 'block');
    this.currentRoomId = null;
    this.callbacks.onStatusChange('disconnected');
  }

  // ---------------------------------------------------------------------
  // Stranger photo sharing — request/approve, then a direct client<->R2
  // upload via presigned URL. The backend never sees the photo bytes.
  // ---------------------------------------------------------------------

  async requestPhoto() {
    if (!this.currentRoomId) throw new Error('No active room');
    await this.restPost('/api/v1/match/photo/request', { room_id: this.currentRoomId });
  }

  async declinePhotoRequest() {
    if (!this.currentRoomId) return;
    await this.restPost('/api/v1/match/photo/respond', { room_id: this.currentRoomId, accept: false });
  }

  /** Accepts a pending photo request, uploads the file directly to storage, and confirms delivery. */
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
      // Backend errors are JSON: {"error": "message"} — surface just the
      // message when present instead of the raw status+body blob.
      let message = text;
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        // not JSON — fall back to the raw text
      }
      throw new Error(message);
    }

    return response.json().catch(() => null);
  }
}

export type { Status, ChatMessage };