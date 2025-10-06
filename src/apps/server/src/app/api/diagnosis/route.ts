import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { diagnosis, pathology } from "@/lib/db/schema/diagnosis";
import { patient } from "@/lib/db/schema/patient";
import { AppError } from "@/lib/error";

const createDiagnosisSchema = z.object({
	patientId: z.uuid(),
	pathologyId: z.uuid(),
	summary: z.string().min(1).max(2000),
});

export const POST = withAuth(
	async ({ body }) => {
		// Ensure referenced pathology exists (lightweight check)
		const existingPathology = await db
			.select({ id: pathology.id })
			.from(pathology)
			.where(eq(pathology.id, body.pathologyId))
			.limit(1);
		if (existingPathology.length === 0) {
			throw new AppError("Pathology not found", "PATHOLOGY_NOT_FOUND");
		}

		await db.insert(diagnosis).values({
			patientId: body.patientId,
			pathologyId: body.pathologyId,
			summary: body.summary,
		});
		return NextResponse.json(
			{ message: "Diagnosis created successfully" },
			{ status: 201 },
		);
	},
	{ bodySchema: createDiagnosisSchema },
	(error: AppError) => {
		switch (error.code) {
			case "PATHOLOGY_NOT_FOUND":
				return NextResponse.json(
					{ error: "Pathology not found" },
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

export const GET = withAuth(
	async ({ session }) => {
		// Resolve patient for current user
		const existingPatient = await db
			.select({ id: patient.id })
			.from(patient)
			.where(eq(patient.userId, session.user.id))
			.limit(1);
		if (existingPatient.length === 0) {
			throw new AppError("Patient profile not found", "PATIENT_NOT_FOUND");
		}

		const items = await db
			.select()
			.from(diagnosis)
			.where(eq(diagnosis.patientId, existingPatient[0].id))
			.orderBy(desc(diagnosis.createdAt));

		return NextResponse.json({ items });
	},
	undefined,
	(error: AppError) => {
		switch (error.code) {
			case "PATIENT_NOT_FOUND":
				return NextResponse.json(
					{ error: "Patient profile not found" },
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
