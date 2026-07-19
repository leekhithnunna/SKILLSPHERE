import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import chatService from '../services/chatService';
import { getSocket } from '../services/socket';
import resolveFileUrl from '../utils/resolveFileUrl';

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(true);

  const activeConversation = conversations.find((c) => c._id === conversationId);
  const otherParticipant = activeConversation?.participants.find((p) => p._id !== user._id);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await chatService.getConversations();
      setConversations(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Join the active conversation's room, load history, mark read
  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('conversation:join', conversationId);

    chatService.getMessages(conversationId).then(({ data }) => setMessages(data.data));
    socket.emit('message:read', { conversationId });

    return () => socket.emit('conversation:leave', conversationId);
  }, [conversationId]);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = (message) => {
      if (message.conversation === conversationId) {
        setMessages((prev) => [...prev, message]);
        socket.emit('message:read', { conversationId });
      }
    };

    const onNotify = () => loadConversations();

    const onTypingStart = ({ userId, conversationId: cid }) => {
      if (cid !== conversationId) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: true }));
    };
    const onTypingStop = ({ userId, conversationId: cid }) => {
      if (cid !== conversationId) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: false }));
    };

    const onRead = ({ conversationId: cid, userId }) => {
      if (cid !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.readBy.includes(userId) ? m : { ...m, readBy: [...m.readBy, userId] }))
      );
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:notify', onNotify);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('message:read', onRead);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:notify', onNotify);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('message:read', onRead);
    };
  }, [conversationId, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !conversationId) return;
    socket.emit('typing:start', conversationId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit('typing:stop', conversationId), 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;
    const socket = getSocket();
    if (!socket) return;

    let attachments = [];
    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await chatService.uploadAttachment(conversationId, formData);
        attachments = [data.data];
      } finally {
        setUploading(false);
      }
    }

    socket.emit('message:send', { conversationId, text: text.trim(), attachments }, (res) => {
      if (res?.success) {
        setText('');
        setFile(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversation list */}
      <div className="w-72 shrink-0 card !p-0 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-gray-400 text-sm italic p-4">No conversations yet.</p>
        ) : (
          conversations.map((c) => {
            const other = c.participants.find((p) => p._id !== user._id);
            const unread = c.lastMessage && !c.lastMessage.readBy?.includes(user._id) && c.lastMessage.sender !== user._id;
            return (
              <button
                key={c._id}
                onClick={() => navigate(`/messages/${c._id}`)}
                className={`w-full text-left p-3 flex items-center gap-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  c._id === conversationId ? 'bg-primary-50' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <span className="text-primary-700 font-semibold text-xs">
                    {other?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {other?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {c.lastMessage?.text || (c.lastMessage ? 'Attachment' : 'No messages yet')}
                  </p>
                </div>
                {unread && <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />}
              </button>
            );
          })
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 card !p-0 flex flex-col overflow-hidden">
        {!conversationId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-gray-100 flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">{otherParticipant?.name}</span>
              {typingUsers[otherParticipant?._id] && (
                <span className="text-xs text-primary-500 italic">typing…</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isMine = (m.sender?._id || m.sender) === user._id;
                return (
                  <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                        isMine ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {m.text && <p>{m.text}</p>}
                      {m.attachments?.map((a, idx) => (
                        <a
                          key={idx}
                          href={resolveFileUrl(a.url)}
                          target="_blank"
                          rel="noreferrer"
                          className={`block text-xs underline mt-1 ${isMine ? 'text-white' : 'text-primary-600'}`}
                        >
                          📎 {a.name}
                        </a>
                      ))}
                      {isMine && (
                        <p className="text-[10px] mt-1 opacity-70">
                          {m.readBy?.includes(otherParticipant?._id) ? 'Read' : 'Sent'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex items-center gap-2">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="chat-file-input"
              />
              <label htmlFor="chat-file-input" className="cursor-pointer text-gray-400 hover:text-primary-600 shrink-0 text-lg px-1">
                📎
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  handleTyping();
                }}
                placeholder={file ? file.name : 'Type a message...'}
                className="form-input flex-1"
              />
              <button type="submit" disabled={uploading} className="btn-primary shrink-0">
                {uploading ? '...' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
