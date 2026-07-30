import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
// TODO: Import your actual generated protobuf bindings here!
// import { chatpb } from '../proto/chatpb'; 

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: string, payload?: any, roomId?: string, to?: string) => void;
  lastMessage: any | null; // Replace 'any' with chatpb.Envelope once imported
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

 const connect = () => {
    // 🛠️ Grab the proper backend URL from env, fallback to api.zquab.com
    const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'wss://api.zquab.com';
    const wsUrl = `${WS_BASE}/ws`;
    
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer'; // Crucial for protobuf!

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Clear any pending reconnects
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        // TODO: Decode the arraybuffer using your protobuf bindings
        // const buffer = new Uint8Array(event.data);
        // const envelope = chatpb.Envelope.decode(buffer);
        
        // TEMPORARY FIX: Passing the raw event data to satisfy TypeScript.
        // Once you plug in protobufs, change this to: setLastMessage(envelope);
        setLastMessage(event.data);
        
        console.log('Received raw WS message', event.data);
      } catch (err) {
        console.error('Failed to decode WS message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected. Reconnecting in 3s...');
      setIsConnected(false);
      // Simple auto-reconnect logic
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close(); // Force close to trigger the onclose reconnect
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

  // Helper to construct and send a protobuf Envelope
  const sendMessage = (type: string, payload?: any, roomId?: string, to?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket is not open');
      return;
    }

    try {
      // TODO: Create and encode the envelope using your protobuf bindings
      /*
      const message = chatpb.Envelope.create({
        type,
        room_id: roomId,
        to,
        payload, // Ensure payload is encoded as bytes if required by your proto
        ts: Date.now(),
        id: crypto.randomUUID()
      });
      const buffer = chatpb.Envelope.encode(message).finish();
      wsRef.current.send(buffer);
      */
     console.log('Sending message:', { type, roomId, to, payload });
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