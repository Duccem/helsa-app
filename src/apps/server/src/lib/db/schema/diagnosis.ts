import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { patient } from "./patient";

export const diagnosis = pgTable("diagnosis", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	summary: text("summary").notNull(),
	pathologyId: uuid("pathology_id")
		.notNull()
		.references(() => pathology.id),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const pathology_type = pgEnum("pathology_type", [
	"MOOD_DISORDER",
	"ANXIETY_DISORDER",
	"PSYCHOTIC_DISORDER",
	"EATING_DISORDER",
	"PERSONALITY_DISORDER",
	"DRUG_DISORDER",
	"NEURALDEVELOPMENT_DISORDER",
]);

export const pathology = pgTable("pathology", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	type: pathology_type("type").default("MOOD_DISORDER"),
	name: text("name").notNull(),
});
