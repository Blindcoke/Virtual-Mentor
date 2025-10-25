import { adminDb } from './admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { SessionAdmin } from '@/types';

/**
 * Server-side Firestore operations using Admin SDK
 * These bypass security rules and should only be used in API routes
 */

// Re-export types
export type { SessionAdmin };

export const createSessionAdmin = async (
  sessionData: Omit<SessionAdmin, 'id'>
): Promise<string> => {
  const sessionsRef = adminDb.collection('sessions');
  const newSessionRef = sessionsRef.doc();

  await newSessionRef.set({
    ...sessionData,
    id: newSessionRef.id,
  });

  return newSessionRef.id;
};

export const updateSessionAdmin = async (
  sessionId: string,
  data: Partial<SessionAdmin>
): Promise<void> => {
  const sessionRef = adminDb.collection('sessions').doc(sessionId);
  await sessionRef.update(data);
};

export const getSessionAdmin = async (sessionId: string): Promise<SessionAdmin | null> => {
  const sessionRef = adminDb.collection('sessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (sessionSnap.exists) {
    return sessionSnap.data() as SessionAdmin;
  }
  return null;
};

// Export Timestamp from Admin SDK for use in API routes
export { Timestamp };
