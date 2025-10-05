import { expo } from "@better-auth/expo";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { db } from "./db/index";
import * as schema from "./db/schema/auth";
import { polarClient } from "./payments";

export const auth = betterAuth<BetterAuthOptions>({
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
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
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
			],
		}),
		expo(),
		bearer(),
	],
});
