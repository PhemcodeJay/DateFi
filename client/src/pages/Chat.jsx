import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { messagesAPI, matchesAPI, SOCKET_URL } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import EmojiPicker from 'emoji-picker-react';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/avi', 'video/x-matroska'];

const Chat = () => {
  const { matchId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [matchInfo, setMatchInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [readBy, setReadBy] = useState({});
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const setupSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });
    socketRef.current.on('connect', () => {
      setSocketConnected(true);
      reconnectAttempts.current = 0;
      socketRef.current.emit('join_match', matchId);
    });
    socketRef.current.on('disconnect', () => setSocketConnected(false));
    socketRef.current.on('connect_error', () => {
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= 5) toast.error('Connection lost. Please refresh.');
    });
    socketRef.current.on('new_message', (message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.sender_id !== user?._id) messagesAPI.markAsRead(matchId).catch(() => {});
    });
    socketRef.current.on('user_typing', ({ userId, isTyping: isUserTyping }) => {
      if (userId !== user?._id) {
        setTyping(isUserTyping);
        if (isUserTyping) setTimeout(() => setTyping(false), 3000);
      }
    });
    socketRef.current.on('messages_read', ({ userId, matchId: readMatchId }) => {
      if (readMatchId === parseInt(matchId) && userId !== user?._id) {
        setReadBy(prev => ({ ...prev, [userId]: true }));
      }
    });
  }, [matchId, user?._id]);

  const loadMessages = async () => {
    try {
      const res = await messagesAPI.getMessages(matchId);
      setMessages(res.data);
      messagesAPI.markAsRead(matchId).catch(() => {});
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchInfo = async () => {
    try {
      const res = await matchesAPI.getMatchInfo(matchId);
      setMatchInfo(res.data);
    } catch (error) {
      console.error('Failed to load match info');
    }
  };

  useEffect(() => {
    loadMessages();
    loadMatchInfo();
    setupSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_match', matchId);
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId, setupSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setShowEmojiPicker(false);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = { id: tempId, sender_id: user._id, content: messageContent, message_type: 'text', created_at: new Date().toISOString(), pending: true };
    setMessages(prev => [...prev, optimisticMessage]);
    try {
      const res = await messagesAPI.sendMessage(matchId, messageContent);
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      if (error.response?.data?.requiresUpgrade) {
        toast.error('Daily limit reached. Upgrade to Premium!', { duration: 5000 });
        setTimeout(() => navigate('/subscription'), 2000);
      } else {
        toast.error('Failed to send message');
        setNewMessage(messageContent);
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="flex flex-col items-center gap-4"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div><p className="text-gray-600">Loading chat...</p></div></div>);
  }

  const handleTyping = () => {
    if (socketRef.current && socketConnected) {
      socketRef.current.emit('typing', { matchId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { matchId, isTyping: false });
      }, 2000);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { toast.error('File too large. Max 100MB.'); return; }
    const isValidImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isValidVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    if (!isValidImage && !isValidVideo) { toast.error('Invalid file type.'); return; }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('media', file);
    try {
      const res = await messagesAPI.sendMediaMessage(matchId, formData);
      setMessages(prev => [...prev, res.data]);
      toast.success('Media sent! 📸');
    } catch (error) {
      if (error.response?.data?.requiresUpgrade) {
        toast.error('Daily limit reached.', { duration: 5000 });
        setTimeout(() => navigate('/subscription'), 2000);
      } else {
        toast.error(error.response?.data?.message || 'Failed to upload');
      }
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const renderMessageContent = (message) => {
    const isOwn = message.sender_id === user?._id;
    if (message.message_type === 'image') {
      return (<div className="space-y-2"><img src={`${SOCKET_URL}${message.media_url}`} alt="Shared" className="max-w-full rounded-lg cursor-pointer hover:opacity-90" style={{ maxHeight: '300px' }} onClick={() => window.open(`${SOCKET_URL}${message.media_url}`, '_blank')} />{message.content && <p className={`text-sm ${isOwn ? 'text-white/90' : 'text-gray-700'}`}>{message.content}</p>}</div>);
    }
    if (message.message_type === 'video') {
      return (<div className="space-y-2"><video src={`${SOCKET_URL}${message.media_url}`} controls className="max-w-full rounded-lg" style={{ maxHeight: '300px' }} preload="metadata" />{message.content && <p className={`text-sm ${isOwn ? 'text-white/90' : 'text-gray-700'}`}>{message.content}</p>}</div>);
    }
    return <p>{message.content}</p>;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 relative">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/matches')} className="text-gray-600 hover:text-pink-500">← Back</button>
          {matchInfo && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden">
                {matchInfo.user.photos && matchInfo.user.photos.length > 0 ? (<img src={`${SOCKET_URL}${matchInfo.user.photos[0]}`} alt={matchInfo.user.name} className="w-full h-full object-cover" />) : (<div className="flex items-center justify-center h-full text-white text-xl">👤</div>)}
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">{matchInfo.user.name}, {matchInfo.user.age}</h2>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <span className="text-xs text-gray-500">{socketConnected ? 'Online' : 'Connecting...'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === user?._id;
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isOwn ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' : 'bg-white text-gray-800 shadow-md'} ${message.pending ? 'opacity-70' : ''}`}>
                  {renderMessageContent(message)}
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                    <span className="text-xs">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isOwn && !message.pending && <span className="text-xs">{readBy[matchInfo?.user?._id] ? '✓✓' : '✓'}</span>}
                    {message.pending && <span className="text-xs">Sending...</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
        </div>
      )}
      <div className="bg-white border-t sticky bottom-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-500 hover:text-pink-500" title="Emoji">😊</button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-pink-500" title="Image">📷</button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMediaUpload} className="hidden" />
            <button type="button" onClick={() => videoInputRef.current?.click()} className="p-2 text-gray-500 hover:text-pink-500" title="Video">🎬</button>
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleMediaUpload} className="hidden" />
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleTyping} placeholder="Type a message..." className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent" disabled={sending || isUploading} />
            <button type="submit" disabled={sending || isUploading || !newMessage.trim()} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full disabled:opacity-50">Send</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;