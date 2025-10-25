import { NextRequest, NextResponse } from 'next/server';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('drive_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not connected to Google Drive' },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    // Fetch Google Docs files
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
        new URLSearchParams({
          q: "mimeType='application/vnd.google-apps.document'",
          fields: 'files(id,name,modifiedTime,webViewLink)',
          orderBy: 'modifiedTime desc',
          pageSize: '20',
        }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Token expired', connected: false },
          { status: 401, headers: corsHeaders }
        );
      }
      throw new Error('Failed to fetch documents');
    }

    const data = await response.json();

    interface GoogleDriveFile {
      id: string;
      name: string;
      modifiedTime: string;
      webViewLink?: string;
    }

    const documents = data.files?.map((file: GoogleDriveFile) => ({
      id: file.id,
      name: file.name,
      modifiedTime: file.modifiedTime,
      link: file.webViewLink,
    }));

    return NextResponse.json({ documents }, { headers: corsHeaders });
  } catch (error) {
    console.error('Drive documents fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500, headers: corsHeaders }
    );
  }
}
