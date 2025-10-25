import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('drive_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ connected: false });
  }

  try {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.ok) {
      return NextResponse.json({ connected: true });
    } else {
      return NextResponse.json({ connected: false });
    }
  } catch (error) {
    console.error('Drive status check error:', error);
    return NextResponse.json({ connected: false });
  }
}
