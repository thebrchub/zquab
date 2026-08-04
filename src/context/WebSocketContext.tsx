import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import protobuf from 'protobufjs';
import chatProtoSrc from '../proto/chat.proto?raw';

// 🛠️ Parse the protobufs directly from the raw string (same as chatClient.ts)
const root = new protobuf.Root();
protobuf.parse(chatProtoSrc, root);
const Envelope = root.lookupType('chatpb.Envelope');
const ChatMessageProto = root.lookupType('chatpb.ChatMessage');
const ReceiptProto = root.lookupType ? root.lookupType('chatpb.Receipt') : null;

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

  const connect = () => {
    if (import.meta.env.DEV || window.location.hostname === 'localhost') {
      console.warn('🛠️ DEV MODE: WebSocket connection disabled to prevent backend spam.');
      return; 
    }
    const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'wss://api.zquab.com';
    const wsUrl = `${WS_BASE}/ws`;
    
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer'; // Crucial for protobuf!

    ws.onopen = () => {
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

        // Decode the outer envelope
        const bytes = new Uint8Array(event.data);
        const envelope = Envelope.decode(bytes) as any;

        let decodedPayload: any = envelope.payload;

        // If there's an inner payload, try to decode according to the envelope type
        if (envelope.payload && envelope.payload.length > 0) {
          try {
            const t: string = envelope.type || '';

            // Common server->client chat message variants contain a ChatMessage
            if (t === 'message_delivered' || t === 'message_sent_confirm' || t === 'chat_message') {
              decodedPayload = ChatMessageProto.decode(envelope.payload);
            }
            // Receipt-like events use the Receipt proto
            else if (t === 'message_read' || t === 'message_delivered_receipt' || t === 'message_receipt' || t === 'receipt') {
              if (ReceiptProto) {
                try {
                  decodedPayload = ReceiptProto.decode(envelope.payload);
                } catch (e) {
                  decodedPayload = envelope.payload;
                }
              }
            }
            // Fallback: try ChatMessage decode, otherwise leave raw bytes
            else {
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

        // Expose both the decoded payload and the raw envelope for consumers
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
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // useCallback (stable reference) — an unstable sendMessage here caused the
  // WebSocketContext value to change on every render, which made consumer
  // effects that depend on it re-fire for messages they'd already processed.
  const sendMessage = useCallback((type: string, payload?: any, roomId?: string, to?: string, id?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket is not open');
      return undefined;
    }

    try {
      let payloadBytes: any = new Uint8Array();
      
      // 🛠️ Encode the inner payload if we are sending text
      if (type === 'chat_message' && payload?.text) {
        const chatMsg = ChatMessageProto.create({ text: payload.text });
        payloadBytes = ChatMessageProto.encode(chatMsg).finish();
      }

      // 🛠️ Create and encode the outer envelope
      // NOTE: protobufjs parses chat.proto without `keepCase`, so fields are
      // exposed camelCase (`roomId`, not `room_id`) — passing `room_id` here
      // was silently dropped, meaning outgoing friend messages never carried
      // a room id at all.
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

  // Memoize the context value — a fresh object every render caused every
  // consumer to re-render (and re-fire effects) on unrelated WS traffic.
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