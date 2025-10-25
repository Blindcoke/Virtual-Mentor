import { Timestamp as FirestoreTimestamp } from 'firebase/firestore';

/**
 * Shared type definitions for the Virtual Mentor app
 */

// Unified Session Status
export type SessionStatus =
  | 'scheduled'
  | 'in-progress'
  | 'ringing'
  | 'connected'
  | 'completed'
  | 'missed'
  | 'ended';

export type CallStatus =
  | 'initiating'
  | 'ringing'
  | 'connected'
  | 'disconnected'
  | 'failed';

// Client-side Session (uses client Timestamp)
export interface Session {
  id: string;
  userId: string;
  status: SessionStatus;
  timestamp: FirestoreTimestamp;
  duration?: number;
  transcript?: string;
  notes?: string;
  roomName?: string;
  phoneNumber?: string;
  callStatus?: CallStatus;
  connectedAt?: FirestoreTimestamp;
  endedAt?: FirestoreTimestamp;
}

// Server-side Session (uses admin Timestamp)
// Note: Uses FirebaseFirestore.Timestamp type instead of importing firebase-admin
export interface SessionAdmin {
  id: string;
  userId: string;
  status: SessionStatus;
  timestamp: FirebaseFirestore.Timestamp;
  duration?: number;
  transcript?: string;
  notes?: string;
  roomName?: string;
  phoneNumber?: string;
  callStatus?: CallStatus;
  connectedAt?: FirebaseFirestore.Timestamp;
  endedAt?: FirebaseFirestore.Timestamp;
}

// Message
export interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
  isTranscribing?: boolean;
}

// Conversation
export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Profile
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  timezone: string;
  scheduleTime: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// User with status (for admin dashboard)
export type UserWithStatus = UserProfile & {
  status: 'active' | 'inactive' | 'in-call';
};

// Calendar Connection
export interface CalendarConnection {
  userId: string;
  provider: 'google';
  connected: boolean;
  lastSync?: FirestoreTimestamp;
}
