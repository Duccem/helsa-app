import { google } from "@ai-sdk/google";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { generateObject } from "ai";
import { and, desc, eq, gte } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import z from "zod";
import { db } from "@/lib/db";
import {
	activity,
	journal,
	mood,
	patient,
	sleep,
} from "@/lib/db/schema/patient";

// QStash webhook does not use user session; secure via signature (TODO) or internal secret header.
// This handler expects a JSON payload: { patientId: string }

const bodySchema = z.object({
	patientId: z.uuid(),
});

type AllowedCategory =
	| "MINDFULNESS"
	| "EXERCISE"
	| "SLEEP"
	| "NUTRITION"
	| "SOCIAL"
	| "GENERAL";

// Simple mapping helper to clamp to 3-4 activities
function clampActivities<T>(items: T[]): T[] {
	if (items.length < 3) return items; // trust model if fewer
	if (items.length > 4) return items.slice(0, 4);
	return items;
}

export const POST = verifySignatureAppRouter(async (req: NextRequest) => {
	const parsed = bodySchema.safeParse(await req.json());
	if (!parsed.success) {
		return NextResponse.json({ message: "Invalid body" }, { status: 400 });
	}
	const { patientId } = parsed.data;

	const patientExists = await db
		.select({ id: patient.id })
		.from(patient)
		.where(eq(patient.id, patientId))
		.limit(1);
	if (patientExists.length === 0) {
		return NextResponse.json({ message: "Patient not found" }, { status: 404 });
	}

	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	const [recentMoods, recentSleep, recentJournal] = await Promise.all([
		db
			.select({
				id: mood.id,
				level: mood.level,
				reasons: mood.reasons,
				date: mood.date,
			})
			.from(mood)
			.where(and(eq(mood.patientId, patientId), gte(mood.date, sevenDaysAgo)))
			.orderBy(desc(mood.date))
			.limit(20),
		db
			.select({
				id: sleep.id,
				durationMinutes: sleep.durationMinutes,
				quality: sleep.quality,
				date: sleep.date,
			})
			.from(sleep)
			.where(and(eq(sleep.patientId, patientId), gte(sleep.date, sevenDaysAgo)))
			.orderBy(desc(sleep.date))
			.limit(14),
		db
			.select({ id: journal.id, content: journal.content, date: journal.date })
			.from(journal)
			.where(
				and(eq(journal.patientId, patientId), gte(journal.date, sevenDaysAgo)),
			)
			.orderBy(desc(journal.date))
			.limit(25),
	]);

	if (
		recentMoods.length === 0 &&
		recentSleep.length === 0 &&
		recentJournal.length === 0
	) {
		return NextResponse.json(
			{ message: "Not enough recent data to generate activities" },
			{ status: 200 },
		);
	}

	const activityResultSchema = z.object({
		activities: z
			.array(
				z.object({
					category: z.enum([
						"MINDFULNESS",
						"EXERCISE",
						"SLEEP",
						"NUTRITION",
						"SOCIAL",
						"GENERAL",
					]),
					title: z.string().min(3).max(200),
					description: z.string().min(5).max(1000).optional(),
					metadata: z.record(z.string(), z.any()).optional(),
				}),
			)
			.min(1)
			.max(6),
	});

	const system = `You are a compassionate mental health assistant. Analyze the provided user data (moods, sleep, journal) for the last 7 days and generate actionable, supportive activities. Activities must:
  - Be personalized but safe, non-clinical, and encouraging
  - Avoid medical or diagnostic language
  - Focus on practical steps
  - Category must be one of MINDFULNESS|EXERCISE|SLEEP|NUTRITION|SOCIAL|GENERAL
  - Provide diversity (avoid duplicates or trivial rewording)`;

	const user = `Generate 3 or 4 activities (never more than 4) that would be most helpful now. Return ONLY structured data.
  Moods (latest first):\n${recentMoods
		.map(
			(m) =>
				`${m.date.toISOString()} level=${m.level} reasons=${(m.reasons || []).join(";")}`,
		)
		.join("\n")}\n\nSleep entries:\n${recentSleep
		.map(
			(s) =>
				`${s.date.toISOString()} duration=${s.durationMinutes} quality=${s.quality}`,
		)
		.join("\n")}\n\nJournal snippets:\n${recentJournal
		.map(
			(j) =>
				`${j.date.toISOString()} ${j.content.slice(0, 160).replace(/\s+/g, " ")}`,
		)
		.join("\n")}`;

	const { object } = await generateObject({
		model: google("gemini-2.5-flash"),
		schema: activityResultSchema,
		system,
		prompt: user,
		temperature: 0.6,
		maxOutputTokens: 700,
	});

	const prepared = clampActivities(object.activities)
		.slice(0, 4)
		.map((a) => ({
			patientId,
			category: a.category as AllowedCategory,
			title: a.title.slice(0, 200),
			description: a.description?.slice(0, 1000),
			metadata: a.metadata ?? {},
		}));

	if (prepared.length === 0) {
		return NextResponse.json(
			{ message: "No valid activities generated" },
			{ status: 422 },
		);
	}

	await db.insert(activity).values(prepared);

	return NextResponse.json({
		message: "Activities generated",
	});
});
