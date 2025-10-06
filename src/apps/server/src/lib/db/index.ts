import { drizzle } from "drizzle-orm/node-postgres";
import * as appointment from "./schema/appointment";
import * as auth from "./schema/auth";
import * as patient from "./schema/patient";
import * as therapist from "./schema/therapist";

export const db = drizzle(process.env.DATABASE_URL || "", {
	schema: {
		...auth,
		...patient,
		...appointment,
		...therapist,
	},
});
