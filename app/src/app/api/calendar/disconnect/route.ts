import { NextResponse } from 'next/server';

export async function POST() {
  // Clear calendar tokens
  const response = NextResponse.json({ success: true });

  response.cookies.delete('calendar_access_token');
  response.cookies.delete('calendar_refresh_token');

  return response;
}
