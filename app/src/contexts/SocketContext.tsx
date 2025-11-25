'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWallet } from '@solana/wallet-adapter-react';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinDare: (dareId: string) => void;
  leaveDare: (dareId: string) => void;
  sendMessage: (dareId: string, message: any) => void;
  startTyping: (dareId: string) => void;
  stopTyping: (dareId: string) => void;
  notifyDareUpdate: (dareId: string, updateType: string) => void;
  joinDaresList: () => void;
  leaveDaresList: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinDare: () => {},
  leaveDare: () => {},
  sendMessage: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  notifyDareUpdate: () => {},
  joinDaresList: () => {},
  leaveDaresList: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { publicKey } = useWallet();
  const [currentDare, setCurrentDare] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch user data if wallet connected
    if (publicKey) {
      fetch(`/api/users/${publicKey.toBase58()}`)
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(console.error);
    }
  }, [publicKey]);

  useEffect(() => {
    // Initialize Socket.io connection
    // Use window.location.origin to ensure we connect to the same host/port
    const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    const socketInstance = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Socket.io connected:', socketInstance.id);
      setIsConnected(true);

      // Rejoin dare room if we were in one
      if (currentDare && user) {
        socketInstance.emit('join-dare', {
          dareId: currentDare,
          userId: user.id,
          username: user.username || 'Anonymous',
        });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (currentDare && user) {
        socketInstance.emit('leave-dare', {
          dareId: currentDare,
          userId: user.id,
        });
      }
      socketInstance.close();
    };
  }, []); // Only run once on mount

  const joinDare = useCallback((dareId: string) => {
    if (!socket || !user) return;

    // Leave current dare if in one
    if (currentDare) {
      socket.emit('leave-dare', {
        dareId: currentDare,
        userId: user.id,
      });
    }

    // Join new dare
    socket.emit('join-dare', {
      dareId,
      userId: user.id,
      username: user.username || 'Anonymous',
    });

    setCurrentDare(dareId);

    // Update presence in database
    fetch('/api/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        userWallet: user.walletAddress,
        username: user.username,
        dareId,
        isOnline: true,
      }),
    }).catch(console.error);
  }, [socket, user, currentDare]);

  const leaveDare = useCallback((dareId: string) => {
    if (!socket || !user) return;

    socket.emit('leave-dare', {
      dareId,
      userId: user.id,
    });

    setCurrentDare(null);

    // Update presence in database
    fetch('/api/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        userWallet: user.walletAddress,
        isOnline: false,
      }),
    }).catch(console.error);
  }, [socket, user]);

  const sendMessage = useCallback((dareId: string, message: any) => {
    if (!socket) return;

    socket.emit('send-message', {
      dareId,
      message,
    });
  }, [socket]);

  const startTyping = useCallback((dareId: string) => {
    if (!socket || !user) return;

    socket.emit('typing', {
      dareId,
      userId: user.id,
      username: user.username || 'Anonymous',
    });
  }, [socket, user]);

  const stopTyping = useCallback((dareId: string) => {
    if (!socket || !user) return;

    socket.emit('stop-typing', {
      dareId,
      userId: user.id,
    });
  }, [socket, user]);

  const notifyDareUpdate = useCallback((dareId: string, updateType: string) => {
    if (!socket) return;

    console.log(`[Socket] Notifying dare update: ${dareId} - ${updateType}`);
    socket.emit('dare-updated', {
      dareId,
      updateType,
    });
  }, [socket]);

  const joinDaresList = useCallback(() => {
    if (!socket) return;

    console.log('[Socket] Joining dares-list room');
    socket.emit('join-dares-list');
  }, [socket]);

  const leaveDaresList = useCallback(() => {
    if (!socket) return;

    console.log('[Socket] Leaving dares-list room');
    socket.emit('leave-dares-list');
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinDare,
        leaveDare,
        sendMessage,
        startTyping,
        stopTyping,
        notifyDareUpdate,
        joinDaresList,
        leaveDaresList,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
