import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { patient } from "@/lib/db/schema/patient";

const createPatientSchema = z.object({
	birthDate: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
		message: "Invalid date format",
	}),
	gender: z.enum(["MAN", "WOMAN", "OTHER"]).optional(),
});

export const PUT = withAuth(
	async ({ body, session }) => {
		try {
			await db
				.insert(patient)
				.values({
					birthDate: new Date(body.birthDate),
					gender: body.gender,
					userId: session.user.id,
				})
				.onConflictDoUpdate({
					target: patient.userId,
					set: {
						birthDate: new Date(body.birthDate),
						gender: body.gender,
						updatedAt: new Date(),
					},
				});

			return NextResponse.json({ message: "Patient Saved correctly" });
		} catch (_error) {
			return NextResponse.json(
				{ error: "Invalid request data" },
				{ status: 400 },
			);
		}
	},
	{ bodySchema: createPatientSchema },
);
