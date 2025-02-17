export const PROJECT_ID = 'farcaster-frames-template';
export const PROJECT_TITLE = "Farcaster Power Users";
export const PROJECT_DESCRIPTION = "Search and discover top Farcaster profiles";
export const EXAMPLE_PROFILES = [
  { 
    fid: 3, 
    username: "dwr.eth", 
    display_name: "Dan Romero", 
    custody_address: "0x6b0bda3f2ffed5efc83fa8c024acff1dd45793f1",
    verified_addresses: { 
      eth_addresses: ["0x6b0bda3f2ffed5efc83fa8c024acff1dd45793f1"],
      sol_addresses: [] 
    },
    pfp_url: "https://i.imgur.com/5VDCQ9Z.png",
    power_badge: true,
    follower_count: 500000
  },
  { 
    fid: 5650, 
    username: "v", 
    display_name: "Vitalik", 
    custody_address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    verified_addresses: { 
      eth_addresses: ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"],
      sol_addresses: [] 
    },
    pfp_url: "https://i.imgur.com/MJ3A7qG.png",
    power_badge: true,
    follower_count: 300000
  },
  { 
    fid: 602, 
    username: "jessepollak", 
    display_name: "Jesse Pollak", 
    custody_address: "0x8270F7E08a3a2f6AEdE6b0e5D24513Cb582FFe93",
    verified_addresses: { 
      eth_addresses: ["0x8270F7E08a3a2f6AEdE6b0e5D24513Cb582FFe93"],
      sol_addresses: [] 
    },
    pfp_url: "https://i.imgur.com/3Zt7T7H.png",
    power_badge: true,
    follower_count: 150000
  },
];

// Neynar API endpoints
export const NEYNAR_BASE_URL = "https://api.neynar.com/v2/farcaster";
export const POWER_USERS_URL = `${NEYNAR_BASE_URL}/user/power`;
export const BULK_USERS_URL = `${NEYNAR_BASE_URL}/user/bulk`;
export const USER_BY_USERNAME_URL = `${NEYNAR_BASE_URL}/user/by_username`;
export const RELEVANT_FOLLOWERS_URL = `${NEYNAR_BASE_URL}/followers/relevant`;
export const POWER_BADGE_THRESHOLD = 10000;
export const DEFAULT_LIMIT = 20;
