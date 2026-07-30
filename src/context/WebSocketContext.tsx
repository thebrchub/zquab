import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import protobuf from 'protobufjs';
import chatProtoSrc from '../proto/chat.proto?raw';

// 🛠️ Parse the protobufs directly from the raw string (same as chatClient.ts)
const root = new protobuf.Root();
protobuf.parse(chatProtoSrc, root);
const Envelope = root.lookupType('chatpb.Envelope');
const ChatMessageProto = root.lookupType('chatpb.ChatMessage');

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: string, payload?: any, roomId?: string, to?: string) => void;
  lastMessage: any | null; 
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = () => {
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
        
        // 🛠️ Decode the outer envelope
        const bytes = new Uint8Array(event.data);
        const envelope = Envelope.decode(bytes) as any;
        
        let decodedPayload = null;
        
        // 🛠️ If there is text content, decode the inner ChatMessage payload
        if (envelope.payload && envelope.payload.length > 0) {
          try {
            decodedPayload = ChatMessageProto.decode(envelope.payload);
          } catch (e) {
            console.warn("Could not decode inner payload", e);
          }
        }
        
        // Pass it to state so ChatRoom.tsx can read lastMessage.payload.text
        setLastMessage({
          ...envelope,
          payload: decodedPayload || envelope.payload
        });
        
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

  const sendMessage = (type: string, payload?: any, roomId?: string, to?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket is not open');
      return;
    }

    try {
      let payloadBytes: any = new Uint8Array();
      
      // 🛠️ Encode the inner payload if we are sending text
      if (type === 'send_message' && payload?.text) {
        const chatMsg = ChatMessageProto.create({ text: payload.text });
        payloadBytes = ChatMessageProto.encode(chatMsg).finish();
      }

      // 🛠️ Create and encode the outer envelope
      const envelope = Envelope.create({
        type,
        room_id: roomId,
        to,
        payload: payloadBytes,
        ts: Date.now(),
        id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`
      });
      
      const bytes = Envelope.encode(envelope).finish();
      const buffer = bytes.buffer instanceof ArrayBuffer
        ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        : new Uint8Array(bytes).slice().buffer;
        
      wsRef.current.send(buffer);
    } catch (err) {
      console.error('Failed to encode/send message:', err);
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within a WebSocketProvider');
  return context;
};