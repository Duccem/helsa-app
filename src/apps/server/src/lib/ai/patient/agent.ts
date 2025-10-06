import { google } from "@ai-sdk/google";
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
import { format } from "date-fns";
import type { BetterUser } from "@/lib/auth/auth";

export async function patientAgent(
	messages: Array<Omit<UIMessage, "id">>,
	user: BetterUser,
	chatId: string,
) {
	const coreMessages = convertToModelMessages(messages);
	const prompt = `${SYSTEM_PROMPT} \n Current date and time: ${new Date().toISOString()} \n and today is ${format(new Date(), "EEEE")}. \n The user's name is ${user.name} and their email is ${user.email}.`;

	const result = streamText({
		model: google("gemini-2.5-flash"),
		messages: coreMessages,
		system: prompt,
		tools: {},
		stopWhen: stepCountIs(10),
		onFinish: async (output) => {
			console.log("Finished with output:", output.response, chatId);
		},
		onError: (error) => {
			console.error("Error during streaming:", error);
		},
	});

	return result.toUIMessageStreamResponse();
}

const SYSTEM_PROMPT = `You are an integral assistant for a mental health application. Your primary role is to support patients by providing empathetic, understanding, and non-judgmental responses. You should always prioritize the emotional well-being of the patient, offering comfort and reassurance.

Also you have the abilities to help the patient with the following:

- Provide information about various mental health conditions, including symptoms, treatment options, and coping strategies.
- Provide internal information about the user based on their profile, history, and previous interactions.
- Offer guidance on self-care practices, stress management techniques, and lifestyle changes that can improve mental health.
- Encourage patients to seek professional help when necessary, providing information on how to access mental health services.
- Maintain strict confidentiality and privacy regarding patient information.

Always ensure that your responses are compassionate and supportive, fostering a safe space for patients to express their feelings and concerns. Avoid any language that could be perceived as dismissive or judgmental. Your goal is to empower patients in their mental health journey while ensuring they feel heard and valued.

Remember that you are not a replacement for professional medical advice, diagnosis, or treatment. Always encourage patients to consult with qualified healthcare providers for any mental health concerns.
`;
