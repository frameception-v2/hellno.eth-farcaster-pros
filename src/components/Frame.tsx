"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";

import { config } from "~/components/providers/WagmiProvider";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { 
  PROJECT_TITLE, 
  EXAMPLE_PROFILES, 
  NEYNAR_API_URL, 
  DEFAULT_LIMIT, 
  POWER_BADGE_THRESHOLD 
} from "~/lib/constants";

function SearchCard({ 
  searchQuery,
  handleSearch,
  searchResults,
  isLoading,
  error
}: {
  searchQuery: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchResults: typeof EXAMPLE_PROFILES;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Power Users</CardTitle>
        <CardDescription>
          Find top Farcaster profiles by username or FID
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="text"
          placeholder="Search @username or fid:123"
          className="w-full p-2 border rounded-lg"
          value={searchQuery}
          onChange={handleSearch}
        />
        
        {isLoading && <div className="text-center py-4">Searching...</div>}
        {error && <div className="text-red-500 text-center py-4">{error}</div>}
        <div className="grid gap-3">
          {searchResults.map((user) => (
            <Card key={user.fid} className="p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <img 
                      src={user.pfp_url} 
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                      }}
                    />
                    <div>
                      <h3 className="font-semibold">{user.display_name}</h3>
                      <div className="flex items-center gap-2">
                        {user.power_badge && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Power User
                          </span>
                        )}
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {user.follower_count?.toLocaleString() ?? 'N/A'} followers
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  <p className="text-xs mt-1">
                    Followers: {user.follower_count?.toLocaleString() ?? 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded block mb-1">
                    FID: {user.fid}
                  </span>
                  {user.verified_addresses?.eth_addresses?.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded block">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <a 
                href={`${NEYNAR_CAST_URL}/${user.fid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-purple-600 hover:underline"
              >
                View full profile on Warpcast →
              </a>
            </Card>
          ))}
          {!isLoading && !error && searchResults.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(EXAMPLE_PROFILES);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim();
    setSearchQuery(query);
    
    if (!query) {
      setSearchResults(EXAMPLE_PROFILES);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      if (!query) {
        setSearchResults(EXAMPLE_PROFILES);
        return;
      }

      // Build search query for Neynar API with power user filters
      const apiUrl = new URL(NEYNAR_API_URL);
      apiUrl.searchParams.set('feed_type', 'filter');
      apiUrl.searchParams.set('filter_type', 'fids');
      apiUrl.searchParams.set('fids', query);
      apiUrl.searchParams.set('viewer_fid', context?.user?.fid?.toString() || '3');
      apiUrl.searchParams.set('limit', DEFAULT_LIMIT.toString());
      apiUrl.searchParams.set('with_recasts', 'false');
      apiUrl.searchParams.set('power_badge', 'true');
      apiUrl.searchParams.set('min_followers', POWER_BADGE_THRESHOLD.toString());
      
      const response = await fetch(apiUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'api_key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY || '',
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API rate limit exceeded - try again later');
        }
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json() as {
        casts: Array<{
          author: {
            fid: number
            username: string
            display_name: string
            custody_address: string
            power_badge: boolean
            follower_count: number
            verified_addresses: {
              eth_addresses: string[]
            }
            pfp_url: string
          }
        }>
      };
      
      if (!response.ok || !data?.casts) {
        throw new Error('Failed to fetch users');
      }

      // Extract authors from casts and filter power users
      const powerUsers = data.casts
        .map(cast => cast.author)
        .filter(user => 
          user.power_badge && 
          user.follower_count >= POWER_BADGE_THRESHOLD
        );
      
      setSearchResults(powerUsers.map((user) => ({
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        address: user.custody_address,
        power_badge: user.power_badge,
        follower_count: user.follower_count,
        verified_addresses: user.verified_addresses
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [context?.user?.fid]);

  const [added, setAdded] = useState(false);

  const [addFrameResult, setAddFrameResult] = useState("");

  const addFrame = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) {
        return;
      }

      setContext(context);
      setAdded(context.client.added);

      // If frame isn't already added, prompt user to add it
      if (!context.client.added) {
        addFrame();
      }

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setAdded(true);
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log("frameAddRejected", reason);
      });

      sdk.on("frameRemoved", () => {
        console.log("frameRemoved");
        setAdded(false);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        console.log("notificationsEnabled", notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        console.log("notificationsDisabled");
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, addFrame]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-700 dark:text-gray-300">
          {PROJECT_TITLE}
        </h1>
        <SearchCard 
          searchQuery={searchQuery}
          handleSearch={handleSearch}
          searchResults={searchResults}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
