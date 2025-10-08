import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { specialty } from "@/lib/db/schema/therapist";

export const GET = async (_req: NextRequest) => {
	try {
		const data = await db.select().from(specialty);
		return NextResponse.json({ items: data });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
};
