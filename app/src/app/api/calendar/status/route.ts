import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('calendar_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ connected: false });
  }

  // Verify token is still valid by making a test request
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      interface GoogleCalendar {
        id: string;
        summary?: string;
        primary?: boolean;
      }

      return NextResponse.json({
        connected: true,
        calendars: data.items?.map((cal: GoogleCalendar) => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary,
        })),
      });
    } else {
      // Token expired or invalid
      return NextResponse.json({ connected: false });
    }
  } catch (error) {
    console.error('Calendar status check error:', error);
    return NextResponse.json({ connected: false });
  }
}
