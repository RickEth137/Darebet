import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';
import { Server as NetServer, Socket } from 'net';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export interface ChatMessage {
  id: string;
  dareId: string;
  userId: string;
  username: string;
  message: string;
  createdAt: Date;
}

export interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
}
