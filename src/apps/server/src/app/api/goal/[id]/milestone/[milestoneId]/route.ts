import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { milestone } from "@/lib/db/schema/patient";

export const PUT = withAuth(
	async ({ body, params: { milestoneId } }) => {
		await db.update(milestone).set(body).where(eq(milestone.id, milestoneId));
		return NextResponse.json(
			{ message: "Milestone updated successfully" },
			{ status: 200 },
		);
	},
	{
		paramsSchema: z.object({
			milestoneId: z.uuidv7(),
		}),
		bodySchema: z.object({
			title: z.string().min(1).max(100).optional(),
			description: z.string().max(500).optional(),
			isCompleted: z.boolean().optional(),
		}),
	},
	(_error) => {
		return NextResponse.json(
			{ error: "Failed to update milestone" },
			{ status: 500 },
		);
	},
);

export const DELETE = withAuth(
	async ({ params: { milestoneId } }) => {
		await db.delete(milestone).where(eq(milestone.id, milestoneId));
		return NextResponse.json(
			{ message: "Milestone deleted successfully" },
			{ status: 200 },
		);
	},
	{
		paramsSchema: z.object({
			milestoneId: z.uuidv7(),
		}),
	},
	(_error) => {
		return NextResponse.json(
			{ error: "Failed to delete milestone" },
			{ status: 500 },
		);
	},
);
