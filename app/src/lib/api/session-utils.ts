import { db } from '@/lib/firebase/config';
import { Session } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

/**
 * Shared session validation utilities for API routes
 */

export interface SessionValidationResult {
  valid: boolean;
  error?: NextResponse;
  sessionData?: Session;
}

/**
 * Verify that a session exists in Firestore
 * Returns error response if session not found
 */
export async function verifySessionExists(sessionId: string): Promise<SessionValidationResult> {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        ),
      };
    }

    return {
      valid: true,
      sessionData: sessionSnap.data() as Session,
    };
  } catch (error) {
    console.error('Error verifying session:', error);
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: 'Failed to verify session',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      ),
    };
  }
}
