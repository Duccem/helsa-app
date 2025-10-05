import {
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { patient } from "./patient";
import { therapist } from "./therapist";

export const appointment_type = pgEnum("appointment_type", [
	"INITIAL",
	"THERAPY",
]);
export const appointment_mode = pgEnum("appointment_mode", [
	"ONLINE",
	"IN_PERSON",
]);
export const appointment_status = pgEnum("appointment_status", [
	"SCHEDULED",
	"CONFIRMED",
	"PAYED",
	"READY",
	"STARTED",
	"CANCELLED",
	"MISSED_BY_PATIENT",
	"MISSED_BY_THERAPIST",
	"FINISHED",
]);

export const appointment = pgTable("appointment", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	therapistId: uuid("therapist_id")
		.notNull()
		.references(() => therapist.id),
	date: timestamp("date").notNull(),
	motive: text("motive").notNull(),
	type: appointment_type("type").default("INITIAL"),
	mode: appointment_mode("mode").default("ONLINE"),
	status: appointment_status("status").default("SCHEDULED"),
	location: text("location").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const appointment_rating = pgTable("appointment_rating", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patient.id),
	therapistId: uuid("therapist_id")
		.notNull()
		.references(() => therapist.id),
	score: integer("score").notNull().default(1),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const appointment_note = pgTable("appointment_note", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	note: text("note").notNull(),
	appointmentId: uuid("appointment_id")
		.notNull()
		.references(() => appointment.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
