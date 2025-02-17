import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const viewerFid = searchParams.get("viewerFid");
  const limit = searchParams.get("limit") || "20";
  
  if (!process.env.NEYNAR_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured - missing Neynar API key" },
      { status: 500 }
    );
  }

  try {
    // Build Neynar API URL based on query type
    const apiUrl = new URL("https://api.neynar.com/v2/farcaster/user/search");
    apiUrl.searchParams.set("q", query);
    apiUrl.searchParams.set("limit", limit);
    
    if (viewerFid) {
      apiUrl.searchParams.set("viewer_fid", viewerFid);
    }

    const response = await fetch(apiUrl.toString(), {
      headers: {
        "api_key": process.env.NEYNAR_API_KEY,
        "accept": "application/json"
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || "API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.result?.users || []);

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || "API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.result?.users || []);
    
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
