import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { addMinutes } from "date-fns";
import { between } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { medication_reminder } from "@/lib/db/schema/patient";

export const POST = verifySignatureAppRouter(async (_req: NextRequest) => {
	const inFifteenMinutes = addMinutes(new Date(), 15);
	const _medicationReminders = await db
		.select()
		.from(medication_reminder)
		.where(
			between(medication_reminder.scheduledTime, new Date(), inFifteenMinutes),
		);

	// Enviar notificaciones push a los pacientes correspondientes

	return NextResponse.json({ message: "Hello from QStash!" });
});
