import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { subHours } from "date-fns";
import { and, between, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { medication_reminder } from "@/lib/db/schema/patient";

export const POST = verifySignatureAppRouter(async (_req: NextRequest) => {
	const inLastHour = subHours(new Date(), 1);
	const _medicationReminders = await db
		.select()
		.from(medication_reminder)
		.where(
			and(
				between(medication_reminder.scheduledTime, inLastHour, new Date()),
				eq(medication_reminder.isTaken, false),
			),
		);

	// Enviar notificaciones push a los pacientes correspondientes

	return NextResponse.json({ message: "Hello from QStash!" });
});
