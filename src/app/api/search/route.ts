import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) throw new Error('API key not configured');

    const searchUrl = new URL('https://api.neynar.com/v2/farcaster/user/search');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('limit', '10');
    searchUrl.searchParams.set('viewer_fid', '3'); // Example FID, replace with your own if needed

    const response = await fetch(searchUrl.toString(), {
      headers: { 
        'Content-Type': 'application/json',
        'api_key': apiKey 
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ users: data.result.users });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
