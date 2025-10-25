import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Google Calendar OAuth 2.0 configuration
  const clientId = process.env.GOOGLE_CLIENT_ID;

  // Auto-detect the domain from the request
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/calendar/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google Calendar OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables.' },
      { status: 500 }
    );
  }

  const scope = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
  ].join(' ');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  return NextResponse.redirect(authUrl.toString());
}
