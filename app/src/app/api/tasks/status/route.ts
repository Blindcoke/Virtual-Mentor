import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('tasks_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ connected: false });
  }

  try {
    const response = await fetch(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
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
    console.error('Tasks status check error:', error);
    return NextResponse.json({ connected: false });
  }
}
