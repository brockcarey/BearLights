export type Player = {
  id: string;
  full_name: string;
  position: string;
  jersey_number: number;
  image_url: string | null;
  sport: 'football' | 'basketball';
};
