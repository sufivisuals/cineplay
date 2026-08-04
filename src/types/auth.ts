export type UserRole = 'admin' | 'client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  clientCompanyName?: string;
}

export const PRESET_USERS: UserProfile[] = [
  {
    id: 'user-admin-1',
    name: 'Alex Rivers (Admin / Owner)',
    email: 'admin@cineplay.pro',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-client-josh',
    name: 'Josh Miller (Client)',
    email: 'josh@client.com',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    clientCompanyName: 'Josh Commercials Inc.',
  },
  {
    id: 'user-client-sid',
    name: 'Sidney Vance (Client)',
    email: 'sid@client.com',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    clientCompanyName: 'Sid VFX Studios',
  },
];
