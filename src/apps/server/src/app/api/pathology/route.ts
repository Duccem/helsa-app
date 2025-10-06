import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { pathology } from "@/lib/db/schema/diagnosis";

export const GET = withAuth(
	async () => {
		const items = await db.select().from(pathology);
		return NextResponse.json({ items });
	},
	undefined,
	() => NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
);
