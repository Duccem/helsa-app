import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { medication } from "@/lib/db/schema/patient";

export const PUT = withAuth(
	async ({ body, params: { id } }) => {
		await db
			.update(medication)
			.set({
				name: body.name,
				dosage: body.dosage,
				frequency: body.frequency,
				startDate: new Date(body.startDate),
				endDate: body.endDate ? new Date(body.endDate) : null,
				notes: body.notes || null,
			})
			.where(eq(medication.id, id));
		return NextResponse.json({ message: "Medication updated successfully" });
	},
	{
		bodySchema: z.object({
			name: z.string().min(1),
			dosage: z.string().min(1),
			frequency: z.string().min(1),
			startDate: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
				message: "Invalid date format",
			}),
			endDate: z
				.string()
				.refine((date) => !Number.isNaN(Date.parse(date)), {
					message: "Invalid date format",
				})
				.optional(),
			notes: z.string().optional(),
		}),
		paramsSchema: z.object({ id: z.uuid() }),
	},
	(_error) =>
		NextResponse.json({ message: "Invalid request" }, { status: 400 }),
);
