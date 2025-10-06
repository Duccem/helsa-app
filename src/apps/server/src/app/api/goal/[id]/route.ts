import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { goal } from "@/lib/db/schema/patient";

export const PUT = withAuth(
	async ({ body, params: { id } }) => {
		await db.update(goal).set(body).where(eq(goal.id, id));
		return NextResponse.json(
			{ message: "Goal updated successfully" },
			{ status: 200 },
		);
	},
	{
		paramsSchema: z.object({
			id: z.uuidv7(),
		}),
		bodySchema: z.object({
			title: z.string().min(1).max(100).optional(),
			description: z.string().max(500).optional(),
			isCompleted: z.boolean().optional(),
		}),
	},
	(_error) => {
		return NextResponse.json(
			{ error: "Failed to update goal" },
			{ status: 500 },
		);
	},
);

export const DELETE = withAuth(
	async ({ params: { id } }) => {
		await db.delete(goal).where(eq(goal.id, id));
		return NextResponse.json(
			{ message: "Goal deleted successfully" },
			{ status: 200 },
		);
	},
	{
		paramsSchema: z.object({
			id: z.uuidv7(),
		}),
	},
	(_error) => {
		return NextResponse.json(
			{ error: "Failed to delete goal" },
			{ status: 500 },
		);
	},
);
