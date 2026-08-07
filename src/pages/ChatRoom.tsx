import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import { useWebSocket } from '../context/WebSocketContext';
import { LAST_ROOM_STORAGE_KEY, useRooms } from '../context/RoomsContext';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { Loader2, ArrowLeft, MoreVertical, User, X, Image as ImageIcon, Check } from 'lucide-react';
import TypingIndicator from '../components/chat/TypingIndicator';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ChatDetailsSidebar from '../components/chat/ChatDetailsSidebar';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://api.zquab.com';
const STORAGE_CDN_BASE_URL = import.meta.env.VITE_STORAGE_CDN_BASE_URL ?? 'https://lyglmrkcyybfqegeprlu.supabase.co/storage/v1/object/public/zquab-bucket/';

// 🛠️ FIX (Bug 7): Safely trust both the raw Supabase URL and the custom CDN domain to prevent image rendering conflicts.
const isTrustedStorageImage = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  return value.startsWith('https://lyglmrkcyybfqegeprlu.supabase.co/') || 
         value.startsWith('https://cdn.zquab.com/') ||
         (STORAGE_CDN_BASE_URL.length > 0 && value.startsWith(STORAGE_CDN_BASE_URL));
};

const compressImageToWebP = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      const MAX_SIZE = 1200;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context not supported');

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const webpFile = new File([blob], newName, { type: 'image/webp' });
            resolve(webpFile);
          } else {
            reject('Blob creation failed');
          }
        },
        'image/webp',
        0.8
      );
    };

    img.onerror = () => reject('Image load failed');
  });
};

export default function ChatRoom({ 
  inlineRoomId, 
  inlineFriendName, 
  inlineFriendAvatar,
  inlineFriendUsername,
  inlineIsOnline
}: { 
  inlineRoomId?: string, 
  inlineFriendName?: string, 
  inlineFriendAvatar?: string,
  inlineFriendUsername?: string,
  inlineIsOnline?: boolean
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const routerParams = useParams<{ roomId: string }>();
  const roomId = inlineRoomId || routerParams.roomId;
  
  const friendName = inlineFriendName || location.state?.friendName || 'Chat Room';
  const friendAvatar = inlineFriendAvatar || location.state?.friendAvatar || null;
  const friendUsername = inlineFriendUsername || location.state?.friendUsername || ''; 
  const isOnline = inlineIsOnline ?? location.state?.isOnline ?? false;
  
  const isDevMode = location.pathname === '/dev/chat';
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const topObserverRef = useRef<HTMLDivElement>(null);
  const { isConnected, sendMessage, lastMessage } = useWebSocket();
  const { user } = useAuth();
  const { bumpOwnMessage } = useRooms();

  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const [incomingPhotoRequest, setIncomingPhotoRequest] = useState(false);
  const [photoRequestBusy, setPhotoRequestBusy] = useState(false);
  const photoRequestTimeoutRef = useRef<number | null>(null);

  const [showSidebar, setShowSidebar] = useState(false); 

  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const partnerTypingTimeoutRef = useRef<number | null>(null);
  const myTypingTimeoutRef = useRef<number | null>(null);
  const isMyTypingStateRef = useRef(false);

  const sentMessageIdsRef = useRef<Set<string>>(new Set());
  const activeRoomIdRef = useRef(roomId);
  const roomGenerationRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const initialScrollComplete = useRef(false);

  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    activeRoomIdRef.current = roomId;
    roomGenerationRef.current += 1;
    sentMessageIdsRef.current.clear();
    loadingMoreRef.current = false;
    
    // 🛠️ FIX 2: Reset the lock when changing rooms!
    initialScrollComplete.current = false; 
    
    setMessages([]);
    setLoading(!isDevMode);
    setLoadingMore(false);
    setHasMore(true);
    setError('');
  }, [roomId, isDevMode]);

  const handleImageClick = useCallback((url: string) => setViewingImage(url), []);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handleNativeBack = () => {
      sessionStorage.removeItem(LAST_ROOM_STORAGE_KEY);
      navigate('/home', { replace: true });
    };

    window.addEventListener('popstate', handleNativeBack);
    return () => {
      window.removeEventListener('popstate', handleNativeBack);
    };
  }, [navigate]);

  const clearPhotoRequestTimeout = useCallback(() => {
    if (photoRequestTimeoutRef.current !== null) {
      window.clearTimeout(photoRequestTimeoutRef.current);
      photoRequestTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearPhotoRequestTimeout();
    if (partnerTypingTimeoutRef.current) window.clearTimeout(partnerTypingTimeoutRef.current);
    if (myTypingTimeoutRef.current) window.clearTimeout(myTypingTimeoutRef.current);
  }, [clearPhotoRequestTimeout]);

  const sharePhoto = useCallback(async (file: File) => {
    if (!roomId) throw new Error('No room selected');

    const respondResponse = await fetch(`${API_BASE}/api/v1/match/photo/respond`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, accept: true, content_type: file.type }),
    });

    if (!respondResponse.ok) {
      const text = await respondResponse.text();
      throw new Error(text || 'Unable to accept photo request');
    }

    const respondData = await respondResponse.json().catch(() => null) as { url?: string; object_key?: string } | null;
    if (!respondData?.url || !respondData.object_key) {
      throw new Error('No upload URL received');
    }

    const uploadResponse = await fetch(respondData.url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Photo upload failed');
    }

    const uploadedResponse = await fetch(`${API_BASE}/api/v1/match/photo/uploaded`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, object_key: respondData.object_key }),
    });

    if (!uploadedResponse.ok) {
      const text = await uploadedResponse.text();
      throw new Error(text || 'Photo confirmation failed');
    }

    return uploadedResponse.json().catch(() => null) as Promise<{
      message_id?: string | number;
      url?: string;
      created_at?: string;
    } | null>;
  }, [roomId]);

  useEffect(() => {
    if (isDevMode) {
      setMessages([
        { id: '1', content: 'Hey there!', created_at: new Date(Date.now() - 3600000).toISOString(), isOwn: false, status: 'delivered' },
        { id: '2', content: 'Hi! How are you doing?', created_at: new Date(Date.now() - 3500000).toISOString(), isOwn: true, status: 'read' },
      ]);
      setLoading(false);
      return;
    }

    if (!roomId) return;
    
    const generation = roomGenerationRef.current;
    let cancelled = false;

    const fetchHistory = async () => {
      try {
        const history = await roomsApi.getMessages(roomId);
        if (cancelled || generation !== roomGenerationRef.current || activeRoomIdRef.current !== roomId) return;
        const myId = (user as any)?.user_id || (user as any)?.id;

        const formattedHistory = history.map((msg: any) => {
          const msgSender = msg.sender_id; 
          const content = msg.content || msg.text || '';
          const imageUrl = isTrustedStorageImage(content) ? content : undefined;
          return {
            id: msg.id,
            content: imageUrl ? '' : content,
            created_at: msg.created_at || msg.ts || new Date().toISOString(),
            isOwn: Boolean(msgSender && myId && msgSender === myId),
            status: msg.status || 'delivered',
            imageUrl
          };
        });

        const storedOpts = JSON.parse(sessionStorage.getItem(`opts_${roomId}`) || '[]');

        const pendingOpts = storedOpts.filter((opt: any) => {
          const age = Date.now() - new Date(opt.created_at).getTime();
          if (age >= 10000) return false;
          const optTime = new Date(opt.created_at).getTime();
          const alreadyLanded = formattedHistory.some((m: any) =>
            m.isOwn &&
            m.content === opt.content &&
            Math.abs(new Date(m.created_at).getTime() - optTime) < 15000
          );
          return !alreadyLanded;
        });
        
        sessionStorage.setItem(`opts_${roomId}`, JSON.stringify(pendingOpts));

        setMessages(previousMessages => {
          const historyAndPending = [...formattedHistory.reverse(), ...pendingOpts];
          const knownIds = new Set(historyAndPending.map(message => message.id));
          return [...historyAndPending, ...previousMessages.filter(message => !knownIds.has(message.id))];
        });
        setHasMore(history.length >= 50);
        
        // 🛠️ FIX 3a: Scroll to bottom, THEN unlock the observer
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
          // Give the browser 50ms to process the scroll before unlocking pagination
          setTimeout(() => {
            initialScrollComplete.current = true;
          }, 50);
        }, 100);
      } catch (err: any) {
        if (!cancelled && generation === roomGenerationRef.current && activeRoomIdRef.current === roomId) {
          setError(err.message || 'Failed to load chat');
        }
      } finally {
        if (!cancelled && generation === roomGenerationRef.current && activeRoomIdRef.current === roomId) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => { cancelled = true; };
  }, [roomId, isDevMode, user]);

  useEffect(() => {
    if (!isDevMode && roomId && isConnected) {
      sendMessage('join_room', undefined, roomId);
    }
  }, [roomId, isConnected, isDevMode, sendMessage]);

  useEffect(() => {
    if (isDevMode || !lastMessage) return;

    if (lastMessage.type === 'send_confirm' || lastMessage.type === 'message_sent_confirm') {
      const confirmedId = lastMessage.id || lastMessage.payload?.messageId || lastMessage.payload?.message_id;
      if (confirmedId) {
        sentMessageIdsRef.current.delete(String(confirmedId));
        setMessages(prev => prev.map(message => message.id === String(confirmedId) ? { ...message, status: 'delivered' } : message));
      }
      return;
    }

    if (lastMessage.type === 'error') {
      // Server rejected the last action (e.g. SERVER_BUSY, NOT_A_MEMBER). No
      // message id is included, so we can't target the specific bubble —
      // surface it as a system message instead of failing silently.
      setMessages(prev => [...prev, {
        id: `sys-err-${Date.now()}`,
        content: lastMessage.payload?.message || 'Something went wrong. Please try again.',
        isSystem: true,
        isOwn: false,
      }]);
      return;
    }

    if (!roomId) return;

    const eventRoomId = lastMessage.payload?.roomId || lastMessage.payload?.room_id;
    const belongsToRoom = lastMessage.room_id === roomId || lastMessage.roomId === roomId || eventRoomId === roomId;

    if (belongsToRoom) {
      if (lastMessage.type === 'photo_request') {
        setIncomingPhotoRequest(true);
        return;
      }

      if (lastMessage.type === 'photo_response') {
        clearPhotoRequestTimeout();
        setPhotoRequestBusy(false);
        const accepted = typeof lastMessage.accepted === 'boolean' ? lastMessage.accepted : Boolean(lastMessage.payload?.accepted);
        
        setMessages(prev => [...prev, { 
          id: `sys-prr-${Date.now()}`, 
          content: accepted ? `${friendName.toUpperCase()} ACCEPTED — WAITING FOR THE PHOTO...` : `${friendName.toUpperCase()} DECLINED THE PHOTO REQUEST.`, 
          isSystem: true, 
          isOwn: false 
        }]);
        return;
      }

      if (lastMessage.type === 'photo_ready') {
        const photoUrl = lastMessage.payload?.url || lastMessage.url || '';
        if (photoUrl) {
          const expiresAt = Number(lastMessage.payload?.expiresAt ?? lastMessage.payload?.expires_at);
          const photoId = `msg-photo-${Date.now()}`;
          setMessages(prev => [...prev, { id: photoId, content: '', isOwn: false, imageUrl: photoUrl }]);
          if (Number.isFinite(expiresAt)) {
            const delay = expiresAt - Date.now();
            if (delay <= 0) {
              setMessages(prev => prev.filter(message => message.id !== photoId));
            } else {
              window.setTimeout(() => {
                setMessages(prev => prev.filter(message => message.id !== photoId));
              }, delay);
            }
          }
        }
        return;
      }

      if (lastMessage.type === 'chat_message' || lastMessage.type === 'delivered' || lastMessage.type === 'message_delivered') {
        if (lastMessage.id && sentMessageIdsRef.current.has(lastMessage.id)) {
          sentMessageIdsRef.current.delete(lastMessage.id);
          setMessages(prev => prev.map(message => message.id === lastMessage.id ? { ...message, status: 'delivered' } : message));
          return;
        }

        const parsedTs = Number(lastMessage.ts);
        const tsMs = Number.isFinite(parsedTs) ? parsedTs : Date.now();
        const myId = (user as any)?.user_id || (user as any)?.id;
        const msgSender = lastMessage.sender_id || lastMessage.from; 
        const isOwn = Boolean(msgSender && myId && msgSender === myId);
        
        const messageText = lastMessage.payload?.text || '';
        const mediaUrl = lastMessage.payload?.mediaUrl || lastMessage.payload?.media_url;
        
        const imageUrl = isTrustedStorageImage(mediaUrl)
          ? mediaUrl
          : isTrustedStorageImage(messageText)
            ? messageText
            : undefined;
            
        const newMsg = {
          id: lastMessage.id,
          content: imageUrl ? '' : messageText,
          created_at: new Date(tsMs).toISOString(),
          isOwn,
          status: 'delivered',
          imageUrl,
        };
        
        setMessages(prev => {
          if (prev.some(message => message.id === newMsg.id)) return prev;

          const pendingPhoto = isOwn && newMsg.imageUrl
            ? prev.find(message => message.isUploading)
            : undefined;
          if (pendingPhoto) {
            return prev.map(message => message.id === pendingPhoto.id ? newMsg : message);
          }
          return [...prev, newMsg];
        });
        setIsPartnerTyping(false);
        
        if (!isOwn && isConnected) {
          sendMessage('read', undefined, roomId);
        }

        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 100);
      }
      else if (lastMessage.type === 'typing_start' || lastMessage.type === 'typing_status') {
        setIsPartnerTyping(true);
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 50);

        if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
        partnerTypingTimeoutRef.current = window.setTimeout(() => setIsPartnerTyping(false), 4000);
      } 
      else if (lastMessage.type === 'typing_end') {
        setIsPartnerTyping(false);
        if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
      }
      else if (lastMessage.type === 'read' || lastMessage.type === 'message_read') {
        const myId = (user as any)?.user_id || (user as any)?.id;
        const readerId = lastMessage.sender_id || lastMessage.from || lastMessage.payload?.userId || lastMessage.payload?.user_id;
        if (readerId && myId && readerId !== myId) {
          const readMessageId = lastMessage.payload?.messageId || lastMessage.payload?.message_id;
          setMessages(prev => prev.map(m => (m.isOwn && m.status !== 'read' && (!readMessageId || m.id === readMessageId)) ? { ...m, status: 'read' } : m));
        }
      }
    }
  }, [lastMessage, roomId, isDevMode, user, isConnected, sendMessage, clearPhotoRequestTimeout, friendName]);

  useEffect(() => {
    if (isDevMode) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const currentMessages = messagesRef.current;
        
        // 🛠️ FIX 3b: Add `initialScrollComplete.current` to the end of this if-statement!
        if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current && !loading && currentMessages.length > 0 && roomId && initialScrollComplete.current) {
          
          loadingMoreRef.current = true;
          setLoadingMore(true);
          try {
            const oldestId = currentMessages[0].id;
            const previousScrollHeight = scrollRef.current?.scrollHeight ?? 0;
            const previousScrollTop = scrollRef.current?.scrollTop ?? 0;
            const generation = roomGenerationRef.current;
            const olderMessages = await roomsApi.getMessages(roomId!, oldestId);
            if (generation !== roomGenerationRef.current || activeRoomIdRef.current !== roomId) return;
            if (olderMessages.length < 50) setHasMore(false);
            
            const myId = (user as any)?.user_id || (user as any)?.id;
            const formattedOlder = olderMessages.map((msg: any) => {
              const msgSender = msg.sender_id; 
              const content = msg.content || msg.text || '';
              const imageUrl = isTrustedStorageImage(content) ? content : undefined;
              return {
                id: msg.id,
                content: imageUrl ? '' : content,
                created_at: msg.created_at || msg.ts || new Date().toISOString(),
                isOwn: Boolean(msgSender && myId && msgSender === myId),
                status: msg.status || 'delivered',
                imageUrl
              };
            });

            setMessages(prev => {
              const existingIds = new Set(prev.map(message => message.id));
              const uniqueOlder = formattedOlder.reverse().filter((message: any) => !existingIds.has(message.id));
              return [...uniqueOlder, ...prev];
            });
            window.requestAnimationFrame(() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTop = previousScrollTop + (scrollRef.current.scrollHeight - previousScrollHeight);
              }
            });
          } catch (err) {
            console.error('Failed to load older messages');
          } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (topObserverRef.current) observer.observe(topObserverRef.current);
    return () => {
      if (topObserverRef.current) observer.unobserve(topObserverRef.current);
    };
  }, [hasMore, loadingMore, loading, roomId, isDevMode, user]);

  const handleTyping = () => {
    if (isDevMode || !isConnected) return;
    
    if (!isMyTypingStateRef.current) {
      isMyTypingStateRef.current = true;
      sendMessage('typing_start', undefined, roomId);
    }

    if (myTypingTimeoutRef.current) window.clearTimeout(myTypingTimeoutRef.current);
    
    myTypingTimeoutRef.current = window.setTimeout(() => {
      isMyTypingStateRef.current = false;
      sendMessage('typing_end', undefined, roomId);
    }, 2000);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    if (!isDevMode && !isConnected) return;

    const localId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;

    if (!isDevMode) {
      sendMessage('chat_message', { text }, roomId, undefined, localId);
      sentMessageIdsRef.current.add(localId);

      if (myTypingTimeoutRef.current) window.clearTimeout(myTypingTimeoutRef.current);
      isMyTypingStateRef.current = false;
      sendMessage('typing_end', undefined, roomId);
    }
    
    const optimisticMsg = {
      id: localId,
      content: text,
      created_at: new Date().toISOString(),
      isOwn: true,
      status: 'sent' as const
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    
    const existingOpts = JSON.parse(sessionStorage.getItem(`opts_${roomId}`) || '[]');
    sessionStorage.setItem(`opts_${roomId}`, JSON.stringify([...existingOpts, optimisticMsg]));

    if (roomId) bumpOwnMessage(roomId, text);
    
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  const handleRequestPhoto = async () => {
    if (!roomId || isDevMode) return;

    setPhotoRequestBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/match/photo/request`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Unable to request photo');
      }

      clearPhotoRequestTimeout();
      photoRequestTimeoutRef.current = window.setTimeout(() => {
        clearPhotoRequestTimeout();
        setPhotoRequestBusy(false);
        setMessages(prev => [...prev, { id: `sys-pr-timeout-${Date.now()}`, content: `${friendName.toUpperCase()} DIDN'T RESPOND.`, isSystem: true, isOwn: false }]);
      }, 30_000);
    } catch (error) {
      setPhotoRequestBusy(false);
      setMessages(prev => [...prev, { id: `sys-pr-error-${Date.now()}`, content: error instanceof Error ? error.message : 'Unable to request photo.', isSystem: true, isOwn: false }]);
    }
  };

  const handleDeclinePhotoRequest = async () => {
    if (!roomId) return;
    try {
      const response = await fetch(`${API_BASE}/api/v1/match/photo/respond`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, accept: false }),
      });
      if (!response.ok) throw new Error('Unable to decline photo request');
      setIncomingPhotoRequest(false);
    } catch (error) {
      setMessages(prev => [...prev, { id: `sys-pr-error-${Date.now()}`, content: error instanceof Error ? error.message : 'Unable to decline photo request.', isSystem: true, isOwn: false }]);
    }
  };

  const handleAcceptPhotoRequest = () => {
    photoFileInputRef.current?.click();
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    
    if (!file) return;
    
    setIncomingPhotoRequest(false);

    const localPreviewUrl = URL.createObjectURL(file);
    const tempId = `msg-img-${Date.now()}`;

    const optimisticMsg = {
      id: tempId,
      content: '',
      created_at: new Date().toISOString(),
      isOwn: true,
      status: 'sent',
      imageUrl: localPreviewUrl,
      isUploading: true,
    };

    setMessages((prev) => [...prev, optimisticMsg as any]);
    try {
      const webpFile = await compressImageToWebP(file);
      if (webpFile.size > 1_000_000) {
        throw new Error('Photo must be 1MB or smaller. Please choose a smaller image.');
      }
      const uploaded = await sharePhoto(webpFile);
      URL.revokeObjectURL(localPreviewUrl);

      if (uploaded?.message_id && isTrustedStorageImage(uploaded.url)) {
        const messageId = String(uploaded.message_id);
        sentMessageIdsRef.current.add(messageId);
        setMessages((prev) => prev.map((msg) => msg.id === tempId ? {
          ...msg,
          id: messageId,
          imageUrl: uploaded.url,
          isUploading: false,
          created_at: uploaded.created_at || msg.created_at,
          status: 'delivered',
        } : msg));
      } else {
        setMessages((prev) => prev.map((msg) => msg.id === tempId ? { ...msg, isUploading: false } : msg));
      }
      if (roomId) bumpOwnMessage(roomId, 'Photo');
    } catch (error) {
      URL.revokeObjectURL(localPreviewUrl);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setMessages((prev) => [...prev, { id: `sys-pr-error-${Date.now()}`, content: error instanceof Error ? error.message : 'Failed to send photo.', isSystem: true, isOwn: false }]);
    }

    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[var(--background)]">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button onClick={() => navigate('/home')} className="px-6 py-2 bg-[var(--card)] border border-[var(--border-color)] rounded-full text-[var(--text-main)] active:scale-95">
          Go Back
        </button>
      </div>
    );
  }

 return (
    <div className="flex flex-col bg-[var(--background)] fixed top-[64px] inset-x-0 bottom-0 z-30 overflow-hidden min-h-0 min-w-0 md:relative md:top-auto md:inset-auto md:z-auto md:h-full md:w-full">
      
      <ChatDetailsSidebar 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        friendName={friendName}
        friendAvatar={friendAvatar}
        friendUsername={friendUsername}
      />

      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingImage(null)}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={viewingImage}
              alt="Fullscreen view"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        className="hidden"
      />
      
      <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-4 py-2.5 sm:py-3 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border-color)] pt-safe gap-2 z-10 w-full min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => {
              sessionStorage.removeItem(LAST_ROOM_STORAGE_KEY);
              navigate('/home');
            }} 
            className="p-2 -ml-1 sm:-ml-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors flex-shrink-0 md:hidden"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0 flex items-center justify-center">
              {friendAvatar ? (
                <img src={friendAvatar} alt={friendName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)]" />
              )}
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="font-bold text-[var(--text-main)] leading-tight text-sm sm:text-lg truncate">
                {isDevMode ? 'UI Testing Room' : friendName}
              </h2>
              {isOnline ? (
                <p className="text-xs text-green-500 font-medium">Online</p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] font-medium">Offline</p>
              )}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSidebar(true)} 
          className="p-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors flex-shrink-0"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4 pb-2 custom-scrollbar bg-[var(--background)] min-h-0 min-w-0 w-full flex flex-col"
      >
        <div ref={topObserverRef} className="h-4 w-full flex justify-center py-2 mb-2 flex-shrink-0">
          {loadingMore && <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />}
        </div>
        
        {messages.length === 0 && !isPartnerTyping ? (
          <div className="text-center text-[var(--text-muted)] font-medium mt-8 sm:mt-10 bg-[var(--card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-xl mx-auto max-w-xs text-sm sm:text-base">
            No messages yet. Say hello!
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 min-w-0 w-full flex flex-col">
            {messages.map((msg, index) => (
              <MessageBubble 
                key={msg.id || index}
                content={msg.content}
                isOwn={msg.isOwn}
                status={msg.status}
                time={msg.created_at}
                imageUrl={(msg as any).imageUrl}
                onImageClick={handleImageClick}
                isUploading={msg.isUploading}
                isSystem={(msg as any).isSystem}
              />
            ))}
            
            {isPartnerTyping && (
              <TypingIndicator />
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 bg-[var(--card)] border-t border-[var(--border-color)] z-10 w-full min-w-0 relative">
        <AnimatePresence>
          {incomingPhotoRequest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--card)]/95 p-4 shadow-2xl backdrop-blur-md z-30"
            >
              <p className="text-sm font-medium text-[var(--text-main)] mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#3B82F6]" /> {friendName} requested a photo.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDeclinePhotoRequest} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] py-2.5 font-medium text-[var(--text-muted)] transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30">
                  <X className="w-4 h-4" /> Decline
                </button>
                <button onClick={handleAcceptPhotoRequest} className="flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] py-2.5 font-medium text-white transition-all hover:bg-blue-600">
                  <Check className="w-4 h-4" /> Accept
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ChatInput 
          onSend={handleSend}
          disabled={!isDevMode && !isConnected}
          onTyping={handleTyping}
          onRequestPhoto={handleRequestPhoto}
          photoRequestDisabled={photoRequestBusy}
        />
      </div>
      
    </div>
  );
}