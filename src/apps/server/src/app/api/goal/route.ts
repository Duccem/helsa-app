import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { goal, patient } from "@/lib/db/schema/patient";

const schema = z.object({
	patientId: z.uuid(),
	title: z.string().min(1).max(255),
	description: z.string().max(1000).optional(),
});

export const POST = withAuth(
	async ({ body }) => {
		try {
			await db.insert(goal).values({
				patientId: body.patientId,
				title: body.title,
				description: body.description,
			});
			return NextResponse.json(
				{ message: "Goal created successfully" },
				{ status: 201 },
			);
		} catch (error) {
			console.error(error);
			return NextResponse.json(
				{ error: "Internal Server Error" },
				{ status: 500 },
			);
		}
	},
	{ bodySchema: schema },
);

export const GET = withAuth(async ({ session }) => {
	try {
		const patient = await getPatient(session.user.id);
		const goals = await db.query.goal.findMany({
			where: eq(goal.patientId, patient.id),
			orderBy: [desc(goal.createdAt)],
			with: {
				milestones: true,
			},
		});

		return NextResponse.json({ items: goals }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
});

async function getPatient(userId: string) {
	const existingPatient = await db
		.select()
		.from(patient)
		.where(eq(patient.userId, userId))
		.limit(1);

	if (!existingPatient) {
		throw new Error("Patient not found");
	}
	return existingPatient[0];
}
