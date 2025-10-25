import { Timestamp as FirestoreTimestamp } from 'firebase/firestore';

/**
 * Shared type definitions for the Virtual Mentor app
 */

// ============================================================================
// Call Sessions (Read-only, created by external system)
// ============================================================================

// Client-side CallSession (uses client Timestamp)
export interface CallSession {
  id: string;
  agent_type: string;
  conversation_id: string;
  job_id: string;
  metadata: string;
  phone_number: string;
  room_name: string;
  started_at: FirestoreTimestamp;
  user_name: string | null;
}

// Server-side CallSession (uses admin Timestamp)
export interface CallSessionAdmin {
  id: string;
  agent_type: string;
  conversation_id: string;
  job_id: string;
  metadata: string;
  phone_number: string;
  room_name: string;
  started_at: FirebaseFirestore.Timestamp;
  user_name: string | null;
}

// ============================================================================
// Conversations (Read-only, created by external system)
// ============================================================================

export type ConversationStatus = 'active' | 'completed';

// Client-side Conversation (uses client Timestamp)
export interface Conversation {
  id: string;
  ended_at: FirestoreTimestamp | null;
  job_id: string;
  last_message: string;
  last_message_at: FirestoreTimestamp;
  last_message_id: string;
  last_message_role: 'assistant' | 'user';
  phone_number: string;
  room_name: string;
  started_at: FirestoreTimestamp;
  status: ConversationStatus;
  updatedAt: FirestoreTimestamp;
  user_id: string | null;
  user_name: string | null;
}

// Server-side Conversation (uses admin Timestamp)
export interface ConversationAdmin {
  id: string;
  ended_at: FirebaseFirestore.Timestamp | null;
  job_id: string;
  last_message: string;
  last_message_at: FirebaseFirestore.Timestamp;
  last_message_id: string;
  last_message_role: 'assistant' | 'user';
  phone_number: string;
  room_name: string;
  started_at: FirebaseFirestore.Timestamp;
  status: ConversationStatus;
  updatedAt: FirebaseFirestore.Timestamp;
  user_id: string | null;
  user_name: string | null;
}

// ============================================================================
// Messages (Subcollection of conversations, read-only)
// ============================================================================

// Client-side ConversationMessage (uses client Timestamp)
export interface ConversationMessage {
  id: string;
  message: string;
  role: 'assistant' | 'user';
  timestamp: FirestoreTimestamp;
  user_id: string | null;
}

// Server-side ConversationMessage (uses admin Timestamp)
export interface ConversationMessageAdmin {
  id: string;
  message: string;
  role: 'assistant' | 'user';
  timestamp: FirebaseFirestore.Timestamp;
  user_id: string | null;
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
