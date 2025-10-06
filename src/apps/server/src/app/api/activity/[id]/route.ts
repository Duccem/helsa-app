import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { activity } from "@/lib/db/schema/patient";

const updateSchema = z.object({
	category: z
		.enum([
			"MINDFULNESS",
			"EXERCISE",
			"SLEEP",
			"NUTRITION",
			"SOCIAL",
			"GENERAL",
		])
		.optional(),
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(1000).optional(),
	status: z
		.enum(["SUGGESTED", "ACCEPTED", "COMPLETED", "DISMISSED"])
		.optional(),
	metadata: z.any().optional(),
	scheduledAt: z.coerce.date().optional(),
	completedAt: z.coerce.date().optional(),
});

export const PUT = withAuth(
	async ({ body, params }) => {
		await db
			.update(activity)
			.set({
				category: body.category,
				title: body.title,
				description: body.description,
				status: body.status,
				metadata: body.metadata,
				scheduledAt: body.scheduledAt,
				completedAt: body.completedAt,
			})
			.where(eq(activity.id, params.id));
		return NextResponse.json({ message: "Activity updated" });
	},
	{ bodySchema: updateSchema, paramsSchema: z.object({ id: z.uuid() }) },
	() =>
		NextResponse.json({ message: "Internal server error" }, { status: 500 }),
);

export const DELETE = withAuth(
	async ({ params }) => {
		await db.delete(activity).where(eq(activity.id, params.id));
		return NextResponse.json({ message: "Activity deleted" });
	},
	{ paramsSchema: z.object({ id: z.uuid() }) },
	() =>
		NextResponse.json({ message: "Internal server error" }, { status: 500 }),
);
