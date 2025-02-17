"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import Image from "next/image";
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
  BULK_USERS_URL,
  USER_BY_USERNAME_URL,
  POWER_USERS_URL,
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
  searchResults: typeof EXAMPLE_PROFILES| any[];
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
                    <Image
                      src={user.pfp_url}
                      alt={user.username}
                      width={32}
                      height={32}
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
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm text-gray-500">@{user.username}</span>
                    {user.verified_accounts?.some(a => a.platform === 'x') && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Followers: {user.follower_count?.toLocaleString() ?? 'N/A'}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Following: {user.following_count?.toLocaleString() ?? 'N/A'}
                    </span>
                  </div>
                  {user.profile?.bio && (
                    <p className="text-xs mt-2 text-gray-600">
                      {user.profile.bio}
                    </p>
                  )}
                  {user.relevant_followers?.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      Followed by:{" "}
                      {(user.relevant_followers || []).slice(0, 3).map((follower: any, index: number) => (
                        <span key={follower?.fid}>
                          @{follower?.username}
                          {index < user.relevant_followers.slice(0, 3).length - 1 ? ", " : ""}
                        </span>
                      ))}
                      {user.relevant_followers.length > 3 && " and others"}
                    </div>
                  )}
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
                href={`https://warpcast.com/${user.username}`}
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
              No users found matching &quot;{searchQuery}&quot;
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

      let apiUrl;
      // Handle different search types
      if (query.startsWith('fid:')) {
        // Search by FID using bulk endpoint
        apiUrl = new URL(BULK_USERS_URL);
        apiUrl.searchParams.set('fids', query.slice(4));
      } else if (query.includes('@')) {
        // Search by username
        apiUrl = new URL(USER_BY_USERNAME_URL);
        apiUrl.searchParams.set('username', query.replace('@', ''));
      } else {
        // Use the search endpoint for power users
        apiUrl = new URL(SEARCH_USERS_URL);
        apiUrl.searchParams.set('q', query);
        apiUrl.searchParams.set('limit', DEFAULT_LIMIT.toString());
      }
      
      // Add viewer context if available
      if (context?.user?.fid) {
        apiUrl.searchParams.set('viewer_fid', context.user.fid.toString());
      }

      const response = await fetch(apiUrl.toString(), {
        headers: {
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      // Handle different response structures
      let powerUsers: any[] = [];
      if (query.startsWith('fid:')) {
        powerUsers = data.users || [];
      } else if (query.includes('@')) {
        powerUsers = data.user ? [data.user] : [];
      } else {
        // Search endpoint returns results under result.users
        powerUsers = data.result?.users || [];
      }
      
      // Enhanced user data mapping with API response
      setSearchResults(powerUsers.map((user) => ({
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        custody_address: user.custody_address,
        pfp_url: user.pfp_url,
        power_badge: user.power_badge,
        follower_count: user.follower_count,
        following_count: user.following_count,
        verified_addresses: user.verified_addresses,
        verifications: user.verifications,
        profile: {
          bio: user.profile?.bio?.text || '',
          location: user.profile?.location?.address?.country || 'Unknown'
        },
        viewer_context: user.viewer_context || {
          following: false,
          followed_by: false,
          blocking: false,
          blocked_by: false
        },
        relevant_followers: user.relevant_followers || [],
        verified_accounts: user.verified_accounts || []
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
