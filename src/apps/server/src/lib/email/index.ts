import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "../db";
import { user } from "../db/schema/auth";
import ForgetPassword from "./templates/forget-password";

export const resend = new Resend(process.env.RESEND_API_KEY ?? "");

export async function sendForgetPasswordEmail(email: string, otp: string) {
	const receiver = await db
		.select()
		.from(user)
		.where(eq(user.email, email))
		.limit(1);
	if (receiver.length === 0) {
		throw new Error("User not found");
	}

	const { error } = await resend.emails.send({
		from: "contacto@helsahealthcare.com",
		to: [email],
		subject: "Reset your password",
		react: ForgetPassword({ otp, name: receiver[0].name ?? undefined }),
	});

	if (error) {
		console.log(error);
		throw new Error("Failed to send email");
	}
}
