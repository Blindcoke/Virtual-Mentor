// app/api/webhooks/livekit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { updateSessionAdmin, Timestamp } from '@/lib/firebase/firestore-admin';
import { adminDb } from '@/lib/firebase/admin';

/**
 * LiveKit Webhook Handler
 *
 * Handles webhook events from LiveKit for:
 * - Room lifecycle (room_started, room_finished)
 * - Participant events (participant_joined, participant_left)
 * - Track events (track_published, track_unpublished)
 *
 * Events are verified using JWT signature from LiveKit
 */

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('❌ Missing LiveKit credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get the raw body and authorization header
    const body = await request.text();
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return NextResponse.json(
        { error: 'Missing authorization' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const receiver = new WebhookReceiver(apiKey, apiSecret);
    const event = await receiver.receive(body, authHeader);

    console.log('📨 Webhook event received:', event.event);
    console.log('📊 Event data:', JSON.stringify(event, null, 2));

    // Handle different event types
    switch (event.event) {
      case 'room_started':
        await handleRoomStarted(event);
        break;

      case 'room_finished':
        await handleRoomFinished(event);
        break;

      case 'participant_joined':
        await handleParticipantJoined(event);
        break;

      case 'participant_left':
        await handleParticipantLeft(event);
        break;

      case 'track_published':
        console.log('🎤 Track published:', event.track);
        break;

      case 'track_unpublished':
        console.log('🔇 Track unpublished:', event.track);
        break;

      default:
        console.log('ℹ️ Unhandled event type:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle room_started event
 */
async function handleRoomStarted(event: any) {
  console.log('🚀 Room started:', event.room?.name);

  const roomName = event.room?.name;
  if (!roomName) return;

  // Find the session by room name
  const session = await findSessionByRoomName(roomName);
  if (session) {
    console.log('✅ Found session for room:', session.id);
    // Session is already in 'in-progress' state from creation
  }
}

/**
 * Handle room_finished event
 * Updates the session status to 'completed' when the room ends
 */
async function handleRoomFinished(event: any) {
  console.log('🏁 Room finished:', event.room?.name);

  const roomName = event.room?.name;
  if (!roomName) return;

  // Find the session by room name
  const session = await findSessionByRoomName(roomName);
  if (!session) {
    console.warn('⚠️ No session found for room:', roomName);
    return;
  }

  // Only update if not already ended
  if (session.status !== 'ended' && session.status !== 'missed') {
    // Calculate duration if timestamps are available
    const duration = event.room?.duration; // Duration in seconds

    await updateSessionAdmin(session.id, {
      status: 'completed',
      callStatus: 'disconnected',
      endedAt: Timestamp.now(),
      duration: duration || undefined,
      notes: session.notes
        ? `${session.notes}\n\nRoom closed at ${new Date().toISOString()}`
        : `Room closed at ${new Date().toISOString()}`,
    });

    console.log('✅ Session marked as completed:', session.id);
  }
}

/**
 * Handle participant_joined event
 * Update session when user answers the call
 */
async function handleParticipantJoined(event: any) {
  console.log('👋 Participant joined:', {
    identity: event.participant?.identity,
    room: event.room?.name,
  });

  const roomName = event.room?.name;
  const participantIdentity = event.participant?.identity;

  // Check if this is the phone participant joining (user answered)
  if (roomName && participantIdentity?.startsWith('phone-')) {
    const session = await findSessionByRoomName(roomName);
    if (session) {
      await updateSessionAdmin(session.id, {
        status: 'connected',
        callStatus: 'connected',
        connectedAt: Timestamp.now(),
        notes: session.notes
          ? `${session.notes}\n\nUser answered the call at ${new Date().toLocaleTimeString()}`
          : `User answered the call at ${new Date().toLocaleTimeString()}`,
      });
      console.log('✅ Session updated to connected:', session.id);
    }
  }
}

/**
 * Handle participant_left event
 * Update session when user hangs up
 */
async function handleParticipantLeft(event: any) {
  console.log('👋 Participant left:', {
    identity: event.participant?.identity,
    room: event.room?.name,
  });

  const roomName = event.room?.name;
  const participantIdentity = event.participant?.identity;

  // Check if this is the phone participant leaving (user hung up)
  if (roomName && participantIdentity?.startsWith('phone-')) {
    const session = await findSessionByRoomName(roomName);
    if (session) {
      // Calculate duration if call was connected
      let duration;
      if (session.connectedAt) {
        const connectedTime = session.connectedAt.toMillis();
        duration = Math.floor((Date.now() - connectedTime) / 1000); // in seconds
      }

      await updateSessionAdmin(session.id, {
        status: 'ended',
        callStatus: 'disconnected',
        endedAt: Timestamp.now(),
        duration,
        notes: duration
          ? `Call ended - Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`
          : 'Call ended without connection',
      });
      console.log('✅ Session updated to ended:', session.id);
    }
  }
}

/**
 * Find a session document by room name
 */
async function findSessionByRoomName(roomName: string) {
  const sessionsRef = adminDb.collection('sessions');
  const querySnapshot = await sessionsRef.where('roomName', '==', roomName).limit(1).get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}
