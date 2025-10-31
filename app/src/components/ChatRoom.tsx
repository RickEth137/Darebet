'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/contexts/SocketContext';

interface ChatMessage {
  id: string;
  content: string;
  userWallet: string;
  username?: string;
  createdAt: string;
  messageType: 'TEXT' | 'SYSTEM' | 'ANNOUNCEMENT';
  user?: {
    id: string;
    username?: string;
    avatar?: string;
    walletAddress: string;
  };
  replyTo?: {
    id: string;
    content: string;
    username?: string;
  };
  reactions: Array<{
    emoji: string;
    userWallet: string;
    user?: {
      id: string;
      username?: string;
    };
  }>;
}

interface OnlineUser {
  userWallet: string;
  username?: string;
  isOnline: boolean;
  lastSeen: string;
}

interface ChatRoomProps {
  dareId: string;
  dareTitle: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ dareId, dareTitle }) => {
  const { publicKey } = useWallet();
  const { socket, isConnected, joinDare, leaveDare, sendMessage: sendSocketMessage } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch user data
  useEffect(() => {
    if (!publicKey) return;

    fetch(`/api/users/${publicKey.toBase58()}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setUserId(data.id);
          setUsername(data.username || `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`);
        }
      })
      .catch(console.error);
  }, [publicKey]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join dare room and set up WebSocket listeners
  useEffect(() => {
    if (!socket || !userId || !publicKey) return;

    // Load initial messages
    loadMessages();

    // Join the dare's chat room
    joinDare(dareId);

    // Listen for new messages
    socket.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for user joined
    socket.on('user-joined', ({ userId: joinedUserId, username: joinedUsername, onlineCount: count }) => {
      setOnlineCount(count);
      if (joinedUserId !== userId) {
        // Optional: Show "X joined" system message
        console.log(`${joinedUsername} joined the chat`);
      }
    });

    // Listen for user left
    socket.on('user-left', ({ userId: leftUserId, onlineCount: count }) => {
      setOnlineCount(count);
    });

    // Listen for typing indicators
    socket.on('user-typing', ({ userId: typingUserId, username: typingUsername }) => {
      if (typingUserId !== userId) {
        setTypingUsers(prev => [...prev, typingUsername]);
      }
    });

    socket.on('user-stop-typing', ({ userId: typingUserId }) => {
      setTypingUsers(prev => prev.filter((_, idx) => idx !== 0)); // Remove first typing user
    });

    // Cleanup
    return () => {
      socket.off('new-message');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      leaveDare(dareId);
    };
  }, [socket, dareId, userId, publicKey]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${dareId}/messages?limit=50`);
      const data = await response.json();
      
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !publicKey || sending || !userId) return;

    setSending(true);
    try {
      // Save to database first
      const response = await fetch(`/api/chat/${dareId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userWallet: publicKey.toString(),
          username,
          content: newMessage.trim()
        })
      });

      const data = await response.json();
      if (data.message) {
        // Broadcast via WebSocket (will be received by all clients including sender)
        sendSocketMessage(dareId, data.message);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (!socket || !userId) return;

    socket.emit('typing', {
      dareId,
      userId,
      username,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { dareId, userId });
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getUserDisplayName = (wallet: string) => {
    if (wallet === publicKey?.toString()) return 'You';
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!publicKey) {
    return (
      <div className="bg-anarchist-charcoal border-2 border-anarchist-red h-[600px] flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-anarchist-red text-4xl mb-2">🔒</div>
          <p className="text-anarchist-offwhite font-brutal text-sm">
            CONNECT WALLET TO JOIN CHAT
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-anarchist-charcoal border-2 border-anarchist-red h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-anarchist-red flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider flex items-center">
            💬 LIVE CHAT
            <span className={`ml-2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-anarchist-gray'}`}></span>
          </h3>
          <p className="text-xs text-anarchist-gray font-brutal">
            {onlineCount} online {isConnected ? '• WebSocket' : '• Connecting...'}
          </p>
        </div>
        <div className="text-xs text-anarchist-gray font-brutal">
          {dareTitle.slice(0, 20)}...
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-anarchist-red animate-pulse">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-anarchist-red text-2xl mb-2">💬</div>
            <p className="text-anarchist-offwhite font-brutal text-sm">
              BE THE FIRST TO SEND A MESSAGE
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col space-y-1">
              <div className="flex items-start space-x-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-brutal font-bold text-anarchist-red">
                      {message.user?.username || getUserDisplayName(message.userWallet)}
                    </span>
                    <span className="text-xs text-anarchist-gray">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-anarchist-offwhite font-brutal break-words">
                    {message.content}
                  </p>
                  {message.reactions.length > 0 && (
                    <div className="flex space-x-1 mt-1">
                      {message.reactions.map((reaction, idx) => (
                        <span key={idx} className="text-xs bg-anarchist-black px-1 rounded">
                          {reaction.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-anarchist-red flex-shrink-0">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-anarchist-black border border-anarchist-gray text-anarchist-white font-brutal text-sm p-2 focus:outline-none focus:border-anarchist-red"
            maxLength={500}
            disabled={sending || !isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending || !isConnected}
            className="bg-anarchist-red hover:bg-red-700 disabled:bg-anarchist-gray disabled:opacity-50 text-anarchist-black font-brutal font-bold px-4 py-2 text-sm uppercase tracking-wider transition-colors"
          >
            {sending ? '...' : '📤'}
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-anarchist-gray">
            {typingUsers.length > 0 ? `${typingUsers[0]} is typing...` : `${newMessage.length}/500`}
          </span>
          <span className="text-xs text-green-500 font-bold">
            ⚡ Real-time WebSocket
          </span>
        </div>
      </div>
    </div>
  );
};