import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { education, therapist } from "@/lib/db/schema/therapist";
import { AppError } from "@/lib/error";

const createEducationSchema = z.object({
	title: z.string().min(1).max(255),
	institution: z.string().min(1).max(255),
	graduatedAt: z.string().refine((d) => !Number.isNaN(Date.parse(d)), {
		message: "Invalid date format",
	}),
});

export const POST = withAuth(
	async ({ session, body }) => {
		const existingTherapist = await db
			.select({ id: therapist.id })
			.from(therapist)
			.where(eq(therapist.userId, session.user.id))
			.limit(1);

		if (existingTherapist.length === 0) {
			throw new AppError("Therapist profile not found", "THERAPIST_NOT_FOUND");
		}

		const result = await db
			.insert(education)
			.values({
				therapistId: existingTherapist[0].id,
				title: body.title,
				institution: body.institution,
				graduatedAt: new Date(body.graduatedAt),
			})
			.returning({ id: education.id });

		return NextResponse.json(
			{ message: "Education created successfully", id: result[0].id },
			{ status: 201 },
		);
	},
	{ bodySchema: createEducationSchema },
	(error: AppError) => {
		switch (error.code) {
			case "THERAPIST_NOT_FOUND":
				return NextResponse.json(
					{ error: "Therapist profile not found" },
					{ status: 404 },
				);
			default:
				return NextResponse.json(
					{ error: "Internal Server Error" },
					{ status: 500 },
				);
		}
	},
);
