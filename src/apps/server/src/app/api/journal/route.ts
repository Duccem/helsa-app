import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { journal, patient } from "@/lib/db/schema/patient";
import { buildNextPagination } from "@/lib/utils";

const schema = z.object({
	patientId: z.uuid({}),
	content: z.string().min(1).max(5000),
	date: z.coerce.date().optional(),
});

export const POST = withAuth(
	async ({ body }) => {
		try {
			await db.insert(journal).values({
				patientId: body.patientId,
				content: body.content,
				date: body.date ?? new Date(),
			});
			return NextResponse.json(
				{ message: "Journal entry created successfully" },
				{ status: 201 },
			);
		} catch (error) {
			console.error(error);
			return NextResponse.json(
				{ message: "Internal server error" },
				{ status: 500 },
			);
		}
	},
	{ bodySchema: schema },
);

const searchSchema = z.object({
	page: z.coerce.number().optional().default(1),
	pageSize: z.coerce.number().optional().default(10),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

export const GET = withAuth(
	async ({ session, queryParams }) => {
		try {
			const existingPatient = await getPatient(session.user.id);

			const [items, count] = await Promise.all([
				getEntries(queryParams, existingPatient.id),
				countEntries(queryParams, existingPatient.id),
			]);

			const pagination = buildNextPagination(queryParams, count);
			return NextResponse.json({ items, pagination });
		} catch (error) {
			console.error(error);
			return NextResponse.json(
				{ message: "Internal server error" },
				{ status: 500 },
			);
		}
	},
	{ querySchema: searchSchema },
);

async function getPatient(userId: string) {
	const existingPatient = await db
		.select()
		.from(patient)
		.where(eq(patient.userId, userId))
		.limit(1);
	if (existingPatient.length === 0) {
		throw new Error("Patient not found");
	}
	return existingPatient[0];
}

async function getEntries(
	parsed: z.infer<typeof searchSchema>,
	patientId: string,
) {
	const offset = ((parsed?.page ?? 1) - 1) * (parsed?.pageSize ?? 10);
	return await db
		.select()
		.from(journal)
		.where(
			and(
				eq(journal.patientId, patientId),
				parsed.startDate
					? gte(journal.date, new Date(parsed.startDate))
					: undefined,
				parsed.endDate
					? lte(journal.date, new Date(parsed.endDate))
					: undefined,
			),
		)
		.orderBy(desc(journal.date))
		.limit(parsed.pageSize ?? 10)
		.offset(offset ?? 0);
}

async function countEntries(
	parsed: z.infer<typeof searchSchema>,
	patientId: string,
) {
	const record = await db
		.select({ count: count(journal.id) })
		.from(journal)
		.where(
			and(
				eq(journal.patientId, patientId),
				parsed.startDate
					? gte(journal.date, new Date(parsed.startDate))
					: undefined,
				parsed.endDate
					? lte(journal.date, new Date(parsed.endDate))
					: undefined,
			),
		);
	return Number(record[0]?.count ?? 0);
}
