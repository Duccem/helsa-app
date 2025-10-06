import { relations, sql } from "drizzle-orm";
import {
	boolean,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { user } from "./auth";

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

export const journal = pgTable("journal_entry", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	content: text("content").notNull(),
	date: timestamp("date").notNull().defaultNow(),
});

export const goal = pgTable("goal", {
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
	goalId: uuid("goal_id")
		.notNull()
		.references(() => goal.id),
	title: text("title").notNull(),
	description: text("description"),
	isCompleted: boolean("is_completed").default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const goalRelations = relations(goal, ({ many }) => ({
	milestones: many(milestone),
}));

export const milestoneRelations = relations(milestone, ({ one }) => ({
	goal: one(goal, {
		fields: [milestone.goalId],
		references: [goal.id],
	}),
}));

export const medication = pgTable("medication", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	name: text("name").notNull(),
	isActive: boolean("is_active").default(true),
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

export const medication_reminder = pgTable("medication_reminder", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	medicationId: uuid("medication_id")
		.notNull()
		.references(() => medication.id),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	scheduledTime: timestamp("scheduled_time").notNull(),
	isTaken: boolean("is_taken").default(false),
	forgotten: boolean("forgotten").default(false),
	takenAt: timestamp("taken_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// Renamed from assessment -> test (table assessment -> test) see migration 0000_rename_assessment_to_test.sql
export const test = pgTable("test", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	type: text("type").notNull(),
	mode: text("mode").notNull(),
	completed: boolean("completed").default(false),
	questions: jsonb("questions").notNull(),
	date: timestamp("date").notNull().defaultNow(),
	notes: text("notes"),
});

// Temporary alias to avoid breaking imports; remove after refactor completes elsewhere.
export const assessment = test;

// Activity: suggestions generated from user inputs (mood, sleep, journal, etc.)
export const activity_category = pgEnum("activity_category", [
	"MINDFULNESS",
	"EXERCISE",
	"SLEEP",
	"NUTRITION",
	"SOCIAL",
	"GENERAL",
]);

export const activity_status = pgEnum("activity_status", [
	"SUGGESTED",
	"ACCEPTED",
	"COMPLETED",
	"DISMISSED",
]);

export const activity = pgTable("activity", {
	id: uuid("id").primaryKey().$defaultFn(v7),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	category: activity_category("category").notNull(),
	title: text("title").notNull(),
	description: text("description"),
	status: activity_status("status").notNull().default("SUGGESTED"),
	metadata: jsonb("metadata"),
	scheduledAt: timestamp("scheduled_at"),
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
