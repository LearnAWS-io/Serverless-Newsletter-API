import { z } from "zod";

export const signupReqSchema = z.object({
  token: z.string(),
  name: z.string().max(50).min(3),
  email: z.string().email("Invalid email supplied"),
});

export const envSchema = z.object({
  TABLE_NAME: z.string(),
  JWT_SECRET: z.string().min(25),
});
