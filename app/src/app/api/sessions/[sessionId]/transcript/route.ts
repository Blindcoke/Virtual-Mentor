// app/api/sessions/[sessionId]/transcript/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/firebase/firestore';
import { verifySessionExists } from '@/lib/api/session-utils';

/**
 * API endpoint to save a complete transcript to a session
 *
 * POST /api/sessions/[sessionId]/transcript
 * Body: {
 *   transcript: string
 * }
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Verify session exists using shared utility
    const validation = await verifySessionExists(sessionId);
    if (!validation.valid) {
      return validation.error!;
    }

    // Update session with transcript
    await updateSession(sessionId, {
      transcript,
    });

    console.log(`✅ Transcript saved for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Transcript saved successfully',
    });
  } catch (error) {
    console.error('❌ Error saving transcript:', error);
    return NextResponse.json(
      {
        error: 'Failed to save transcript',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[sessionId]/transcript
 * Retrieve the transcript for a session
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

    const sessionData = validation.sessionData!;

    return NextResponse.json({
      success: true,
      sessionId,
      transcript: sessionData.transcript || null,
      hasTranscript: !!sessionData.transcript,
    });
  } catch (error) {
    console.error('❌ Error fetching transcript:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch transcript',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
