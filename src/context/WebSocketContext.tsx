import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import protobuf from 'protobufjs';
import chatProtoSrc from '../proto/chat.proto?raw';
import eventsProtoSrc from '../proto/events.proto?raw';

const root = new protobuf.Root();
protobuf.parse(chatProtoSrc, root);
protobuf.parse(eventsProtoSrc, root);

// 🛠️ FIX: Safe lookups to prevent fatal crashes if the namespace differs
const safeLookup = (name: string, fallbackName: string) => {
  try { return root.lookupType(name); } 
  catch { 
    try { return root.lookupType(fallbackName); } 
    catch { return null; }
  }
};

const Envelope = root.lookupType('chatpb.Envelope');
const ChatMessageProto = root.lookupType('chatpb.ChatMessage');
const ReceiptProto = safeLookup('chatpb.Receipt', 'Receipt');
const SystemEventProto = safeLookup('chatpb.SystemEvent', 'SystemEvent');
const PhotoRequestProto = safeLookup('eventspb.PhotoRequest', 'PhotoRequest');
const PhotoResponseProto = safeLookup('eventspb.PhotoResponse', 'PhotoResponse');
const PhotoReadyProto = safeLookup('eventspb.PhotoReady', 'PhotoReady');
// 🛠️ NEW: Added Unfriended Proto Lookup
const UnfriendedProto = safeLookup('eventspb.Unfriended', 'Unfriended');

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: string, payload?: any, roomId?: string, to?: string, id?: string) => string | undefined;
  lastMessage: any | null; 
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isProviderMountedRef = useRef(false);

  const connect = () => {
    if (import.meta.env.DEV || window.location.hostname === 'localhost') {
      console.info('🛠️ DEV MODE: Connecting to WebSocket for local testing.');
    }
    
    const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'wss://api.zquab.com';
    const wsUrl = `${WS_BASE}/ws`;
    
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer'; 

    ws.onopen = () => {
      if (!isProviderMountedRef.current || wsRef.current !== ws) {
        ws.close();
        return;
      }
      console.log('WebSocket connected');
      setIsConnected(true);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        if (!(event.data instanceof ArrayBuffer)) return;

        const bytes = new Uint8Array(event.data);
        const envelope = Envelope.decode(bytes) as any;

        let decodedPayload: any = envelope.payload;

        if (envelope.payload && envelope.payload.length > 0) {
          try {
            const t: string = envelope.type || '';

            if (t === 'message_delivered' || t === 'message_sent_confirm' || t === 'chat_message') {
              decodedPayload = ChatMessageProto.decode(envelope.payload);
              
              if (decodedPayload.mediaUrl) decodedPayload.media_url = decodedPayload.mediaUrl;
              if (decodedPayload.mediaType) decodedPayload.media_type = decodedPayload.mediaType;
              if (decodedPayload.replyTo) decodedPayload.reply_to = decodedPayload.replyTo;
              
            } else if (t === 'photo_request' && PhotoRequestProto) {
              decodedPayload = PhotoRequestProto.decode(envelope.payload);
            } else if (t === 'photo_response' && PhotoResponseProto) {
              decodedPayload = PhotoResponseProto.decode(envelope.payload);
            } else if (t === 'photo_ready' && PhotoReadyProto) {
              decodedPayload = PhotoReadyProto.decode(envelope.payload);
            } else if (t === 'unfriend' && UnfriendedProto) {
              // 🛠️ NEW: Decode the Unfriend event payload
              decodedPayload = UnfriendedProto.decode(envelope.payload);
            } else if (t === 'error' && SystemEventProto) {
              // Server-side rejection (e.g. SERVER_BUSY, NOT_A_MEMBER) — code+message only.
              decodedPayload = SystemEventProto.decode(envelope.payload);
            } else if (t === 'message_read' || t === 'message_delivered_receipt' || t === 'message_receipt' || t === 'receipt') {
              if (ReceiptProto) {
                try {
                  decodedPayload = ReceiptProto.decode(envelope.payload);
                } catch (e) {
                  decodedPayload = envelope.payload;
                }
              }
            } else {
              try {
                decodedPayload = ChatMessageProto.decode(envelope.payload);
              } catch (e) {
                decodedPayload = envelope.payload;
              }
            }
          } catch (e) {
            console.warn('Could not decode inner payload', e);
            decodedPayload = envelope.payload;
          }
        }

        setLastMessage({
          ...envelope,
          payload: decodedPayload,
        });

        if (envelope.type === 'chat_message') {
          window.dispatchEvent(new CustomEvent('zquab_notification', { 
            detail: { message: 'New Message! 💬' } 
          }));
        }

      } catch (err) {
        console.error('Failed to decode WS message:', err);
      }
    };

    ws.onclose = () => {
      if (!isProviderMountedRef.current || wsRef.current !== ws) return;
      console.log('WebSocket disconnected. Reconnecting in 3s...');
      setIsConnected(false);
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close(); 
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    isProviderMountedRef.current = true;
    connect();
    return () => {
      isProviderMountedRef.current = false;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  const sendMessage = useCallback((type: string, payload?: any, roomId?: string, to?: string, id?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket is not open');
      return undefined;
    }

    try {
      let payloadBytes: any = new Uint8Array();
      
      if (type === 'chat_message' && payload) {
        const chatMsg = ChatMessageProto.create({ 
          text: payload.text || '',
          mediaUrl: payload.media_url || payload.mediaUrl || '',
          mediaType: payload.media_type || payload.mediaType || '',
          replyTo: payload.reply_to || payload.replyTo || ''
        });
        payloadBytes = ChatMessageProto.encode(chatMsg).finish();
      }

      const msgId = id || globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
      const envelope = Envelope.create({
        type,
        roomId, 
        to,
        payload: payloadBytes,
        ts: Date.now(),
        id: msgId
      });
      
      const bytes = Envelope.encode(envelope).finish();
      const buffer = bytes.buffer instanceof ArrayBuffer
        ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        : new Uint8Array(bytes).slice().buffer;
        
      wsRef.current.send(buffer);
      return msgId;
    } catch (err) {
      console.error('Failed to encode/send message:', err);
      return undefined;
    }
  }, []);

  const value = useMemo(
    () => ({ isConnected, sendMessage, lastMessage }),
    [isConnected, sendMessage, lastMessage]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within a WebSocketProvider');
  return context;
};