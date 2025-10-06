import { and, desc, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { activity, patient } from "@/lib/db/schema/patient";

const createSchema = z.object({
	patientId: z.uuid(),
	category: z.enum([
		"MINDFULNESS",
		"EXERCISE",
		"SLEEP",
		"NUTRITION",
		"SOCIAL",
		"GENERAL",
	]),
	title: z.string().min(1).max(200),
	description: z.string().max(1000).optional(),
	metadata: z.any().optional(),
	scheduledAt: z.coerce.date().optional(),
});

export const POST = withAuth(
	async ({ body }) => {
		await db.insert(activity).values({
			patientId: body.patientId,
			category: body.category,
			title: body.title,
			description: body.description,
			metadata: body.metadata,
			scheduledAt: body.scheduledAt,
		});
		return NextResponse.json({ message: "Activity created" }, { status: 201 });
	},
	{ bodySchema: createSchema },
	() =>
		NextResponse.json({ message: "Internal server error" }, { status: 500 }),
);

const listQuerySchema = z.object({
	page: z.coerce.number().optional().default(1),
	pageSize: z.coerce.number().optional().default(10),
	status: z
		.enum(["SUGGESTED", "ACCEPTED", "COMPLETED", "DISMISSED"])
		.optional(),
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
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

export const GET = withAuth(
	async ({ session, queryParams }) => {
		const existingPatient = await db
			.select()
			.from(patient)
			.where(eq(patient.userId, session.user.id))
			.limit(1);
		if (existingPatient.length === 0) {
			return NextResponse.json(
				{ message: "Patient not found" },
				{ status: 404 },
			);
		}
		const p = existingPatient[0];
		const parsed = queryParams;
		const offset = ((parsed.page ?? 1) - 1) * (parsed.pageSize ?? 10);

		const filters = and(
			eq(activity.patientId, p.id),
			parsed.status ? eq(activity.status, parsed.status) : undefined,
			parsed.category ? eq(activity.category, parsed.category) : undefined,
			parsed.startDate
				? gte(activity.createdAt, new Date(parsed.startDate))
				: undefined,
			parsed.endDate
				? lte(activity.createdAt, new Date(parsed.endDate))
				: undefined,
		);

		const items = await db
			.select()
			.from(activity)
			.where(filters)
			.orderBy(desc(activity.createdAt))
			.limit(parsed.pageSize ?? 10)
			.offset(offset);

		return NextResponse.json({
			items,
			page: parsed.page,
			pageSize: parsed.pageSize,
		});
	},
	{ querySchema: listQuerySchema },
	() =>
		NextResponse.json({ message: "Internal server error" }, { status: 500 }),
);
