import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import type {
  UserProfile,
  CalendarConnection,
  CallSession,
  Conversation,
  ConversationMessage,
} from '@/types';

// Re-export types for backward compatibility
export type { UserProfile, CalendarConnection, CallSession, Conversation, ConversationMessage };

// User Profile Operations
export const createUserProfile = async (
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...data,
    uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

// Call Session Operations (Read-only - created by external system)
export const getCallSessionsByPhone = async (
  phoneNumber: string,
  limitCount: number = 10
): Promise<CallSession[]> => {
  const callSessionsRef = collection(db, 'call_sessions');
  const q = query(
    callSessionsRef,
    where('phone_number', '==', phoneNumber),
    orderBy('started_at', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as CallSession));
};

// Conversation Operations (Read-only - created by external system)
export const getConversationsByPhone = async (
  phoneNumber: string,
  limitCount: number = 10
): Promise<Conversation[]> => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('phone_number', '==', phoneNumber),
    orderBy('started_at', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Conversation));
};

export const getConversation = async (
  conversationId: string
): Promise<Conversation | null> => {
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);

  if (conversationSnap.exists()) {
    return {
      id: conversationSnap.id,
      ...conversationSnap.data(),
    } as Conversation;
  }
  return null;
};

export const getConversationMessages = async (
  conversationId: string,
  limitCount?: number
): Promise<ConversationMessage[]> => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const constraints: QueryConstraint[] = [orderBy('timestamp', 'asc')];

  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  const q = query(messagesRef, ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as ConversationMessage));
};

// Calendar Connection Operations
export const saveCalendarConnection = async (
  userId: string,
  provider: 'google',
  connected: boolean
): Promise<void> => {
  const connectionRef = doc(db, 'calendarConnections', userId);
  await setDoc(connectionRef, {
    userId,
    provider,
    connected,
    lastSync: Timestamp.now(),
  });
};

export const getCalendarConnection = async (
  userId: string
): Promise<CalendarConnection | null> => {
  const connectionRef = doc(db, 'calendarConnections', userId);
  const connectionSnap = await getDoc(connectionRef);

  if (connectionSnap.exists()) {
    return connectionSnap.data() as CalendarConnection;
  }
  return null;
};

// Generic collection operations
export const getCollection = async <T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...constraints);

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as T);
};
