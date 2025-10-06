import { relations } from "drizzle-orm";
import {
	integer,
	jsonb,
	pgEnum,
	pgTable,
	real,
	text,
	time,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { user } from "./auth";

export const specialty = pgTable("specialty", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	name: text("name").notNull(),
	color: text("color").notNull(),
});

export const therapist = pgTable("therapist", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.unique()
		.references(() => user.id),
	specialtyId: uuid("specialty_id")
		.notNull()
		.references(() => specialty.id),
	licenseNumber: text("license_number").notNull(),
	bio: text("bio"),
	score: real("score").notNull().default(0.0),
	experience: integer("experience").notNull().default(1),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const price = pgTable("price", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	therapistId: uuid("therapist_id")
		.notNull()
		.unique()
		.references(() => therapist.id),
	amount: real("amount").notNull().default(10.0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const office_address = pgTable("office_address", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	therapistId: uuid("therapist_id")
		.notNull()
		.unique()
		.references(() => therapist.id),
	address: text("address").notNull(),
	location: jsonb("location").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const education = pgTable("education", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	therapistId: uuid("therapist_id")
		.notNull()
		.references(() => therapist.id),
	title: text("title").notNull(),
	institution: text("institution").notNull(),
	graduatedAt: timestamp("graduated_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const schedule = pgTable("schedule", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	therapistId: uuid("therapist_id")
		.notNull()
		.unique()
		.references(() => therapist.id),
	appointmentDuration: integer("appointment_duration").notNull().default(30),
	maxAppointmentPerDay: integer("max_appointments_per_day")
		.notNull()
		.default(5),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const schedule_day = pgTable("schedule_day", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	scheduleId: uuid("schedule_id")
		.notNull()
		.references(() => schedule.id),

	day: integer("day").default(1),
	startHour: time("start_hour").notNull(),
	endHour: time("end_hour").notNull(),
});

export const slot_state = pgEnum("slot_state", ["TAKEN", "AVAILABLE"]);

export const availability_slot = pgTable("availability_slot", {
	id: uuid("id").$defaultFn(v7).primaryKey(),
	therapistId: uuid("therapist_id")
		.notNull()
		.references(() => therapist.id),
	date: timestamp("date").notNull(),
	hour: time("hour").notNull(),
	state: slot_state("state").default("AVAILABLE"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const therapist_relations = relations(therapist, ({ one }) => ({
	schedule: one(schedule, {
		fields: [therapist.id],
		references: [schedule.therapistId],
	}),
	user: one(user, {
		fields: [therapist.userId],
		references: [user.id],
	}),
	specialty: one(specialty, {
		fields: [therapist.specialtyId],
		references: [specialty.id],
	}),
	office_address: one(office_address, {
		fields: [therapist.id],
		references: [office_address.therapistId],
	}),
	price: one(price, {
		fields: [therapist.id],
		references: [price.therapistId],
	}),
}));

export const specialty_relations = relations(specialty, ({ many }) => ({
	therapists: many(therapist),
}));

export const education_relations = relations(education, ({ one }) => ({
	therapist: one(therapist, {
		fields: [education.therapistId],
		references: [therapist.id],
	}),
}));

export const price_relations = relations(price, ({ one }) => ({
	therapist: one(therapist, {
		fields: [price.therapistId],
		references: [therapist.id],
	}),
}));

export const office_address_relations = relations(
	office_address,
	({ one }) => ({
		therapist: one(therapist, {
			fields: [office_address.therapistId],
			references: [therapist.id],
		}),
	}),
);

export const availability_slot_relations = relations(
	availability_slot,
	({ one }) => ({
		therapist: one(therapist, {
			fields: [availability_slot.therapistId],
			references: [therapist.id],
		}),
	}),
);

export const schedule_relations = relations(schedule, ({ many, one }) => ({
	days: many(schedule_day),
	therapist: one(therapist, {
		fields: [schedule.therapistId],
		references: [therapist.id],
	}),
}));
