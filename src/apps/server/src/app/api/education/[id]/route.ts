import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { education, therapist } from "@/lib/db/schema/therapist";
import { AppError } from "@/lib/error";

const paramsSchema = z.object({ id: z.uuidv7() });

const updateEducationSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	institution: z.string().min(1).max(255).optional(),
	graduatedAt: z
		.string()
		.refine((d) => !Number.isNaN(Date.parse(d)), {
			message: "Invalid date format",
		})
		.optional(),
});

async function getTherapistId(userId: string) {
	const rows = await db
		.select({ id: therapist.id })
		.from(therapist)
		.where(eq(therapist.userId, userId))
		.limit(1);
	return rows[0]?.id;
}

export const PUT = withAuth(
	async ({ session, body, params: { id } }) => {
		const therapistId = await getTherapistId(session.user.id);
		if (!therapistId) {
			throw new AppError("Therapist profile not found", "THERAPIST_NOT_FOUND");
		}

		// Ensure education belongs to therapist
		const existing = await db
			.select({ id: education.id })
			.from(education)
			.where(and(eq(education.id, id), eq(education.therapistId, therapistId)))
			.limit(1);

		if (existing.length === 0) {
			throw new AppError("Education not found", "EDUCATION_NOT_FOUND");
		}

		await db
			.update(education)
			.set({
				...(body.title ? { title: body.title } : {}),
				...(body.institution ? { institution: body.institution } : {}),
				...(body.graduatedAt
					? { graduatedAt: new Date(body.graduatedAt) }
					: {}),
				updatedAt: new Date(),
			})
			.where(eq(education.id, id));

		return NextResponse.json(
			{ message: "Education updated successfully" },
			{ status: 200 },
		);
	},
	{ paramsSchema, bodySchema: updateEducationSchema },
	(error: AppError) => {
		switch (error.code) {
			case "THERAPIST_NOT_FOUND":
			case "EDUCATION_NOT_FOUND":
				return NextResponse.json({ error: error.message }, { status: 404 });
			default:
				return NextResponse.json(
					{ error: "Internal Server Error" },
					{ status: 500 },
				);
		}
	},
);

export const DELETE = withAuth(
	async ({ session, params: { id } }) => {
		const therapistId = await getTherapistId(session.user.id);
		if (!therapistId) {
			throw new AppError("Therapist profile not found", "THERAPIST_NOT_FOUND");
		}

		const existing = await db
			.select({ id: education.id })
			.from(education)
			.where(and(eq(education.id, id), eq(education.therapistId, therapistId)))
			.limit(1);

		if (existing.length === 0) {
			throw new AppError("Education not found", "EDUCATION_NOT_FOUND");
		}

		await db.delete(education).where(eq(education.id, id));
		return NextResponse.json(
			{ message: "Education deleted successfully" },
			{ status: 200 },
		);
	},
	{ paramsSchema },
	(error: AppError) => {
		switch (error.code) {
			case "THERAPIST_NOT_FOUND":
			case "EDUCATION_NOT_FOUND":
				return NextResponse.json({ error: error.message }, { status: 404 });
			default:
				return NextResponse.json(
					{ error: "Internal Server Error" },
					{ status: 500 },
				);
		}
	},
);
