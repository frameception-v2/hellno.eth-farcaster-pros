export const PROJECT_ID = 'farcaster-frames-template';
export const PROJECT_TITLE = "Farcaster Power Users";
export const PROJECT_DESCRIPTION = "Search and discover top Farcaster profiles";
export const EXAMPLE_PROFILES = [
  { 
    fid: 3, 
    username: "dwr.eth", 
    display_name: "Dan Romero", 
    address: "0x6b0bda3f2ffed5efc83fa8c024acff1dd45793f1",
    pfp_url: "https://i.imgur.com/5VDCQ9Z.png",
    power_badge: true,
    follower_count: 500000
  },
  { 
    fid: 5650, 
    username: "v", 
    display_name: "Vitalik", 
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    pfp_url: "https://i.imgur.com/MJ3A7qG.png",
    power_badge: true,
    follower_count: 300000
  },
  { 
    fid: 602, 
    username: "jessepollak", 
    display_name: "Jesse Pollak", 
    address: "0x8270F7E08a3a2f6AEdE6b0e5D24513Cb582FFe93",
    pfp_url: "https://i.imgur.com/3Zt7T7H.png",
    power_badge: true,
    follower_count: 150000
  },
];

// Neynar API endpoints
export const NEYNAR_API_URL = "https://api.neynar.com/v2/farcaster/user/power";
export const POWER_BADGE_THRESHOLD = 10000; // Minimum followers to be considered power user
export const DEFAULT_LIMIT = 20;
export const NEYNAR_CAST_URL = "https://warpcast.com/~/profiles";
