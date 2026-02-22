import type { IncomingMessage, ServerResponse } from 'node:http';
import { Server } from 'socket.io';
interface NotificationPayload {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
}
interface ServerToClientEvents {
    notification: (data: NotificationPayload) => void;
    'interview:question': (data: {
        questionIndex: number;
        content: string;
    }) => void;
    'interview:evaluation': (data: {
        answerId: string;
        score: number;
        feedback: string;
    }) => void;
    'usage:updated': (data: {
        feature: string;
        remaining: number;
    }) => void;
    error: (data: {
        message: string;
        code: string;
    }) => void;
}
interface ClientToServerEvents {
    'interview:join': (sessionId: string) => void;
    'interview:leave': (sessionId: string) => void;
    ping: () => void;
}
interface SocketData {
    userId: string | null;
}
export declare const io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void>;
export {};
