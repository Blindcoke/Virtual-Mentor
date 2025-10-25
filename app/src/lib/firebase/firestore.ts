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
import type { UserProfile, Session, CalendarConnection } from '@/types';

// Re-export types for backward compatibility
export type { UserProfile, Session, CalendarConnection };

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

// Session Operations
export const createSession = async (
  sessionData: Omit<Session, 'id'>
): Promise<string> => {
  const sessionsRef = collection(db, 'sessions');
  const newSessionRef = doc(sessionsRef);

  await setDoc(newSessionRef, {
    ...sessionData,
    id: newSessionRef.id,
  });

  return newSessionRef.id;
};

export const getUserSessions = async (
  userId: string,
  limitCount: number = 10
): Promise<Session[]> => {
  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef,
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Session);
};

export const updateSession = async (
  sessionId: string,
  data: Partial<Session>
): Promise<void> => {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, data);
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
