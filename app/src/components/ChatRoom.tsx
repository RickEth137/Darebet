'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  id: string;
  content: string;
  userWallet: string;
  username?: string;
  createdAt: string;
  messageType: 'TEXT' | 'SYSTEM' | 'ANNOUNCEMENT';
  replyTo?: {
    id: string;
    content: string;
    username?: string;
    createdAt: string;
  };
  reactions: Array<{
    emoji: string;
    userWallet: string;
  }>;
  _count: {
    replies: number;
  };
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages and set up polling
  useEffect(() => {
    loadMessages();
    loadOnlineUsers();
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      loadMessages();
      loadOnlineUsers();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [dareId]);

  // Update user presence
  useEffect(() => {
    if (!publicKey) return;

    updatePresence(true);

    const interval = setInterval(() => {
      updatePresence(true);
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(interval);
      updatePresence(false);
    };
  }, [publicKey, dareId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages?dareId=${dareId}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const response = await fetch(`/api/chat/presence?dareId=${dareId}`);
      const data = await response.json();
      
      if (data.success) {
        setOnlineUsers(data.data.onlineUsers);
      }
    } catch (error) {
      console.error('Error loading online users:', error);
    }
  };

  const updatePresence = async (isOnline: boolean) => {
    if (!publicKey) return;

    try {
      await fetch('/api/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: publicKey.toString(),
          dareId,
          isOnline
        })
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !publicKey || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dareId,
          content: newMessage.trim(),
          userWallet: publicKey.toString()
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        // Add the new message immediately for better UX
        setMessages(prev => [...prev, data.data]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
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
      sendMessage();
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
            <span className="ml-2 w-2 h-2 rounded-full bg-green-500"></span>
          </h3>
          <p className="text-xs text-anarchist-gray font-brutal">
            {onlineUsers.length} online
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
                      {getUserDisplayName(message.userWallet)}
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
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-anarchist-black border border-anarchist-gray text-anarchist-white font-brutal text-sm p-2 focus:outline-none focus:border-anarchist-red"
            maxLength={500}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-anarchist-red hover:bg-red-700 disabled:bg-anarchist-gray disabled:opacity-50 text-anarchist-black font-brutal font-bold px-4 py-2 text-sm uppercase tracking-wider transition-colors"
          >
            {sending ? 'SENDING...' : 'SEND'}
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-anarchist-gray">
            {newMessage.length}/500
          </span>
          <span className="text-xs text-anarchist-gray">
            DB Polling Mode
          </span>
        </div>
      </div>
    </div>
  );
};