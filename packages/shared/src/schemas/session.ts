import { z } from 'zod';

export const session_connect_input = z.object({
  token: z.string().describe('Session token from the Roblox Studio plugin'),
});

export const session_disconnect_input = z.object({});

export const session_status_input = z.object({});
