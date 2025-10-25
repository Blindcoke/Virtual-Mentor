import { adminDb } from './admin';
import { Timestamp } from 'firebase-admin/firestore';
import type {
  CallSessionAdmin,
  ConversationAdmin,
  ConversationMessageAdmin,
} from '@/types';

/**
 * Server-side Firestore operations using Admin SDK
 * These bypass security rules and should only be used in API routes
 */

// Re-export types
export type { CallSessionAdmin, ConversationAdmin, ConversationMessageAdmin };

// Call Session Operations (Read-only - created by external system)
export const getCallSessionsByPhoneAdmin = async (
  phoneNumber: string,
  limitCount: number = 10
): Promise<CallSessionAdmin[]> => {
  const callSessionsRef = adminDb.collection('call_sessions');
  const querySnapshot = await callSessionsRef
    .where('phone_number', '==', phoneNumber)
    .orderBy('started_at', 'desc')
    .limit(limitCount)
    .get();

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as CallSessionAdmin));
};

export const getCallSessionAdmin = async (
  sessionId: string
): Promise<CallSessionAdmin | null> => {
  const sessionRef = adminDb.collection('call_sessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (sessionSnap.exists) {
    return {
      id: sessionSnap.id,
      ...sessionSnap.data(),
    } as CallSessionAdmin;
  }
  return null;
};

// Conversation Operations (Read-only - created by external system)
export const getConversationsByPhoneAdmin = async (
  phoneNumber: string,
  limitCount: number = 10
): Promise<ConversationAdmin[]> => {
  const conversationsRef = adminDb.collection('conversations');
  const querySnapshot = await conversationsRef
    .where('phone_number', '==', phoneNumber)
    .orderBy('started_at', 'desc')
    .limit(limitCount)
    .get();

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as ConversationAdmin));
};

export const getConversationAdmin = async (
  conversationId: string
): Promise<ConversationAdmin | null> => {
  const conversationRef = adminDb.collection('conversations').doc(conversationId);
  const conversationSnap = await conversationRef.get();

  if (conversationSnap.exists) {
    return {
      id: conversationSnap.id,
      ...conversationSnap.data(),
    } as ConversationAdmin;
  }
  return null;
};

export const getConversationMessagesAdmin = async (
  conversationId: string,
  limitCount?: number
): Promise<ConversationMessageAdmin[]> => {
  const messagesRef = adminDb
    .collection('conversations')
    .doc(conversationId)
    .collection('messages');

  let query = messagesRef.orderBy('timestamp', 'asc');

  if (limitCount) {
    query = query.limit(limitCount);
  }

  const querySnapshot = await query.get();

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as ConversationMessageAdmin));
};

// Export Timestamp from Admin SDK for use in API routes
export { Timestamp };
