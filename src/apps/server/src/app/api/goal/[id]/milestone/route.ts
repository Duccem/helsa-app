import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { milestone } from "@/lib/db/schema/patient";

export const POST = withAuth(
	async ({ params: { id }, body }) => {
		await db.insert(milestone).values({
			goalId: id,
			...body,
		});
		return NextResponse.json({ message: "Milestone saved" }, { status: 200 });
	},
	{
		bodySchema: z.object({
			title: z.string().min(1).max(100),
			description: z.string().max(500).optional(),
			isCompleted: z.boolean().optional(),
		}),
		paramsSchema: z.object({
			id: z.uuidv7(),
		}),
	},
	(_error) => {
		return NextResponse.json(
			{ error: "Failed to create milestone" },
			{ status: 500 },
		);
	},
);
