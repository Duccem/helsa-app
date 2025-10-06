import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { test } from "@/lib/db/schema/patient";

export const PUT = withAuth(
	async ({ body, params }) => {
		await db
			.update(test)
			.set({
				type: body.type,
				mode: body.mode,
				completed: body.completed,
				questions: body.questions,
				notes: body.notes,
			})
			.where(eq(test.id, params.id));
		return NextResponse.json({ message: "Update test" });
	},
	{
		bodySchema: z.object({
			type: z.string().optional(),
			mode: z.string().optional(),
			completed: z.boolean().optional(),
			questions: z
				.array(
					z.object({
						questionId: z.string(),
						answer: z.string().optional(),
						answerValue: z.number().optional(),
					}),
				)
				.optional(),
			notes: z.string().optional(),
		}),
		paramsSchema: z.object({
			id: z.uuid(),
		}),
	},
	(_error) =>
		NextResponse.json({ message: "Invalid request" }, { status: 400 }),
);
