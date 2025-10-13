import { expo } from "@better-auth/expo";
import {
	checkout,
	polar,
	portal,
	usage,
	webhooks,
} from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, emailOTP } from "better-auth/plugins";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "../db/index";
import * as schema from "../db/schema/auth";
import { sendForgetPasswordEmail } from "../email";
import { polarClient } from "../payments";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "PATIENT",
				input: true,
			},
		},
	},
	trustedOrigins: [process.env.CORS_ORIGIN || "", "helsa://", "exp://"],
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			enabled: true,
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
			redirectURI: `${process.env.BETTER_AUTH_URL}/api/v1/auth/callback/google`,
		},
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
		database: {
			generateId: () => false,
		},
	},
	plugins: [
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			enableCustomerPortal: true,
			use: [
				checkout({
					products: [
						{
							productId: "your-product-id",
							slug: "pro",
						},
					],
					successUrl: process.env.POLAR_SUCCESS_URL,
					authenticatedUsersOnly: true,
				}),
				portal(),
				webhooks({
					secret: process.env.POLAR_WEBHOOK_SECRET || "",
					onPayload: async (_payload: unknown) => {},
				}),
				usage(),
			],
		}),
		emailOTP({
			otpLength: 6,
			sendVerificationOTP: async ({ email, otp, type }) => {
				switch (type) {
					case "sign-in":
						console.log(`Sign-in OTP for ${email}: ${otp}`);
						break;
					case "email-verification":
						console.log(`Link OTP for ${email}: ${otp}`);
						break;
					case "forget-password":
						await sendForgetPasswordEmail(email, otp);
						break;
				}
			},
		}),
		expo(),
		bearer(),
	],
});

export type BetterSession = typeof auth.$Infer.Session;
export type BetterUser = typeof auth.$Infer.Session.user;

export const getSession = cache(async (): Promise<BetterSession | null> => {
	return await auth.api.getSession({
		headers: await headers(),
	});
});
