import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  appointmentTime: timestamp("appointment_time", { withTimezone: true }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  confirmationSent: boolean("confirmation_sent").default(false).notNull(),
  reminderSent: boolean("reminder_sent").default(false).notNull(),
  messageSid: text("message_sid"),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({
  id: true,
  createdAt: true,
  confirmationSent: true,
  reminderSent: true,
  messageSid: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
