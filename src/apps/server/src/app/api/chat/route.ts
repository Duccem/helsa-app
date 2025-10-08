import { type NextRequest, NextResponse } from "next/server";
import { patientAgent } from "@/lib/ai/patient/agent";
import { getSession } from "@/lib/auth/auth";

export const POST = async (req: NextRequest) => {
	const session = await getSession();

	if (!session) {
		return NextResponse.json(
			{ error: "Unauthorized" },
			{
				status: 401,
			},
		);
	}

	const { messages, chatId } = await req.json();

	if (session.user.role === "PATIENT") {
		return patientAgent(messages, session.user, chatId);
	}
	return NextResponse.json(
		{ error: "Only patients can access this endpoint" },
		{ status: 403 },
	);
};
