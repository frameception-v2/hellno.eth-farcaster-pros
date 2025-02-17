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
import { PROJECT_TITLE, EXAMPLE_PROFILES } from "~/lib/constants";

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
                    <h3 className="font-semibold">{user.displayName}</h3>
                    {user.power_badge && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Power User
                      </span>
                    )}
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
              <p className="mt-2 text-xs font-mono text-gray-600 break-all">
                {truncateAddress(user.address)}
              </p>
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
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      
      const data = await response.json();
      setSearchResults(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
