import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db"; // your drizzle instance
import { nextCookies } from "better-auth/next-js";
import { users, accounts, sessions, verifications } from "../db/schema/auth";
import { env } from "@/lib/env";

export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // don't allow user to set role
      },
      lang: {
        type: "string",
        required: false,
        defaultValue: "en",
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    usePlural: true,
    schema: {
      users,
      accounts,
      sessions,
      verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true if you want email verification
    sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
      // In production, you would send an actual email here
      // For now, we'll just log the reset URL
      console.log(`Password reset link for ${user.email}: ${url}`);

      // You can integrate with email services like:
      // - Resend
      // - SendGrid
      // - Nodemailer
      // - etc.
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: any;
      url: string;
    }) => {
      // In production, you would send an actual email here
      console.log(`Email verification link for ${user.email}: ${url}`);
    },
  },
  plugins: [nextCookies()],
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_BETTER_AUTH_URL,
    "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
