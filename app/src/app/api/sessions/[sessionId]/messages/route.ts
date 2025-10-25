// app/api/sessions/[sessionId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { verifySessionExists } from '@/lib/api/session-utils';

/**
 * API endpoint to add messages to a session
 *
 * POST /api/sessions/[sessionId]/messages
 * Body: {
 *   text: string,
 *   sender: 'ai' | 'user',
 *   isTranscribing?: boolean
 * }
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { text, sender, isTranscribing } = await request.json();

    if (!text || !sender) {
      return NextResponse.json(
        { error: 'Text and sender are required' },
        { status: 400 }
      );
    }

    if (sender !== 'ai' && sender !== 'user') {
      return NextResponse.json(
        { error: 'Sender must be either "ai" or "user"' },
        { status: 400 }
      );
    }

    // Verify session exists using shared utility
    const validation = await verifySessionExists(sessionId);
    if (!validation.valid) {
      return validation.error!;
    }

    // Add message to the session's messages subcollection
    const messagesRef = collection(db, 'sessions', sessionId, 'messages');
    const messageDoc = await addDoc(messagesRef, {
      text,
      sender,
      timestamp: Timestamp.now(),
      isTranscribing: isTranscribing || false,
    });

    console.log(`✅ Message added to session ${sessionId}:`, messageDoc.id);

    return NextResponse.json({
      success: true,
      messageId: messageDoc.id,
      sessionId,
    });
  } catch (error) {
    console.error('❌ Error adding message:', error);
    return NextResponse.json(
      {
        error: 'Failed to add message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[sessionId]/messages
 * Retrieve all messages for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Verify session exists using shared utility
    const validation = await verifySessionExists(sessionId);
    if (!validation.valid) {
      return validation.error!;
    }

    // Get all messages from the subcollection
    const messagesRef = collection(db, 'sessions', sessionId, 'messages');
    const { getDocs, query, orderBy } = await import('firebase/firestore');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const messagesSnap = await getDocs(q);

    const messages = messagesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.().toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      sessionId,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
