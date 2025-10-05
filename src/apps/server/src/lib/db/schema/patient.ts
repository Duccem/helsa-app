import { sql } from "drizzle-orm";
import {
	boolean,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { user } from "./auth";
import { therapist } from "./therapist";

export const patient_gender = pgEnum("patient_gender", [
	"MAN",
	"WOMAN",
	"OTHER",
]);

export const patient = pgTable("patient", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	userId: uuid("user_id")
		.unique()
		.notNull()
		.references(() => user.id),
	birthDate: timestamp("birth_date").notNull(),
	gender: patient_gender("gender").default("OTHER"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const mood_level = pgEnum("mood_level", [
	"VERY_BAD",
	"BAD",
	"NEUTRAL",
	"GOOD",
	"VERY_GOOD",
]);

export const mood = pgTable("mood", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	level: mood_level("level").notNull(),
	reasons: text("reasons").array().default(sql`'{}'::text[]`),
	date: timestamp("date").notNull().defaultNow(),
});

export const sleep = pgTable("sleep", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	durationMinutes: text("duration_minutes").notNull(),
	quality: text("quality").notNull(),
	date: timestamp("date").notNull().defaultNow(),
});

export const journal_entry = pgTable("journal_entry", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	content: text("content").notNull(),
	date: timestamp("date").notNull().defaultNow(),
});

export const objective = pgTable("objective", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	title: text("title").notNull(),
	description: text("description"),
	isCompleted: boolean("is_completed").default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const milestone = pgTable("milestone", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	objectiveId: uuid("objective_id")
		.notNull()
		.references(() => objective.id),
	title: text("title").notNull(),
	description: text("description"),
	isCompleted: boolean("is_completed").default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const medication = pgTable("medication", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	name: text("name").notNull(),
	isActive: boolean("is_active").default(false),
	dosage: text("dosage").notNull(),
	frequency: text("frequency").notNull(),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date"),
	notes: text("notes"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const therapy = pgTable("therapy", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	therapistId: uuid("therapist_id")
		.notNull()
		.references(() => therapist.id),
	name: text("name").notNull(),
	description: text("description"),
	objective: text("objective").notNull(),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
