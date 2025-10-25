// app/api/call/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient, SipClient } from 'livekit-server-sdk';
import { createSessionAdmin, updateSessionAdmin, Timestamp } from '@/lib/firebase/firestore-admin';


export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userId, userName } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    const sipTrunkId = process.env.LIVEKIT_SIP_TRUNK_ID;

    if (!apiKey || !apiSecret || !livekitUrl || !sipTrunkId) {
      console.error('Missing environment variables:', {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasUrl: !!livekitUrl,
        hasSipTrunkId: !!sipTrunkId,
      });
      return NextResponse.json(
        { error: 'LiveKit configuration is incomplete' },
        { status: 500 }
      );
    }

    // Initialize LiveKit clients
    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
    const sipClient = new SipClient(livekitUrl, apiKey, apiSecret);

    // Generate a unique room name for this call
    const roomName = `mentor-call-${userId}-${Date.now()}`;

    // Create the room
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 60 * 10, // 10 minutes - room closes if empty
      maxParticipants: 10,
    });

    console.log(`✅ Created room: ${roomName}`);

    // Create a Firestore session to track the call
    const sessionId = await createSessionAdmin({
      userId,
      status: 'in-progress',
      callStatus: 'initiating',
      timestamp: Timestamp.now(),
      roomName,
      phoneNumber,
      notes: `Outbound call to ${phoneNumber}`,
    });

    console.log(`✅ Created session: ${sessionId}`);

    try {
      // Create SIP participant using the correct API
      const sipParticipant = await sipClient.createSipParticipant(
        sipTrunkId,      // SIP trunk ID
        phoneNumber,     // Phone number in E.164 format (+1234567890)
        roomName,        // Room to join
        {
          participantIdentity: `phone-${userId}`,
          participantName: userName || 'User',
          dtmf: '',      // Optional: DTMF tones to send
          playDialtone: true,  // Play dial tone while connecting
        }
      );

      console.log(`✅ SIP participant created:`, sipParticipant);
      console.log(`📞 Calling ${phoneNumber}...`);

      // Update session status to ringing
      await updateSessionAdmin(sessionId, {
        callStatus: 'ringing',
        notes: `Call initiated to ${phoneNumber}, waiting for answer...`,
      });

      // Create an access token for the agent (if you have an agent service)
      const token = new AccessToken(apiKey, apiSecret, {
        identity: `agent-${roomName}`,
        name: 'Virtual Mentor Agent',
      });

      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const agentToken = await token.toJwt();

      // Return call information
      return NextResponse.json({
        success: true,
        sessionId,
        roomName,
        roomUrl: `${livekitUrl}/${roomName}`,
        sipParticipant: {
          participantId: sipParticipant.participantId,
          participantIdentity: sipParticipant.participantIdentity,
          roomName: sipParticipant.roomName,
        },
        agentToken,
        message: `Calling ${phoneNumber}...`,
      });
    } catch (sipError) {
      console.error('❌ SIP Error:', sipError);

      // Update session to failed status
      await updateSessionAdmin(sessionId, {
        status: 'missed',
        callStatus: 'failed',
        endedAt: Timestamp.now(),
        notes: `Failed to initiate call: ${sipError instanceof Error ? sipError.message : 'Unknown error'}`,
      });

      throw sipError;
    }
  } catch (error) {
    console.error('❌ Error initiating call:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate call',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
