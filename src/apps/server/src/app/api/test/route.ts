import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { test } from "@/lib/db/schema/patient";

export const POST = withAuth(
	async ({ body }) => {
		await db.insert(test).values({
			patientId: body.patientId,
			type: body.type,
			mode: body.mode,
			completed: body.completed ?? false,
			questions: body.questions,
			notes: body.notes,
		});
		return NextResponse.json({ message: "Test created" });
	},
	{
		bodySchema: z.object({
			patientId: z.uuid(),
			type: z.string(),
			mode: z.string(),
			completed: z.boolean().optional(),
			questions: z.array(
				z.object({
					questionId: z.string(),
					answer: z.string().optional(),
					answerValue: z.number().optional(),
				}),
			),
			notes: z.string().optional(),
		}),
	},
	(_error) =>
		NextResponse.json({ message: "Invalid request" }, { status: 400 }),
);
