import { Router } from "express";
import { eq, desc, sql, gte, lt } from "drizzle-orm";
import { db, appointmentsTable } from "@workspace/db";
import {
  CreateAppointmentBody,
  GetAppointmentParams,
  SendReminderParams,
} from "@workspace/api-zod";
import {
  sendWhatsAppMessage,
  buildConfirmationMessage,
  buildReminderMessage,
} from "../lib/messaging";

const router = Router();

router.get("/appointments", async (req, res) => {
  const appointments = await db
    .select()
    .from(appointmentsTable)
    .orderBy(desc(appointmentsTable.appointmentTime));
  res.json(appointments);
});

router.get("/appointments/stats/summary", async (req, res) => {
  const now = new Date();

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      upcoming: sql<number>`count(*) filter (where ${appointmentsTable.appointmentTime} >= ${now})::int`,
      past: sql<number>`count(*) filter (where ${appointmentsTable.appointmentTime} < ${now})::int`,
      confirmationsSent: sql<number>`count(*) filter (where ${appointmentsTable.confirmationSent} = true)::int`,
      remindersSent: sql<number>`count(*) filter (where ${appointmentsTable.reminderSent} = true)::int`,
    })
    .from(appointmentsTable);

  res.json(totals);
});

router.post("/appointments", async (req, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerName, phoneNumber, appointmentTime, notes } = parsed.data;

  const [appointment] = await db
    .insert(appointmentsTable)
    .values({
      customerName,
      phoneNumber,
      appointmentTime: new Date(appointmentTime),
      notes: notes ?? null,
    })
    .returning();

  const message = buildConfirmationMessage(customerName, appointment.appointmentTime);
  const result = await sendWhatsAppMessage(phoneNumber, message);

  const [updated] = await db
    .update(appointmentsTable)
    .set({
      confirmationSent: !result.simulated,
      messageSid: result.sid,
    })
    .where(eq(appointmentsTable.id, appointment.id))
    .returning();

  req.log.info(
    { id: updated.id, simulated: result.simulated },
    "Appointment created, confirmation message dispatched"
  );

  res.status(201).json(updated);
});

router.get("/appointments/:id", async (req, res) => {
  const parsed = GetAppointmentParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid appointment ID" });
    return;
  }

  const [appointment] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, parsed.data.id));

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(appointment);
});

router.post("/appointments/:id/remind", async (req, res) => {
  const parsed = SendReminderParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid appointment ID" });
    return;
  }

  const [appointment] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, parsed.data.id));

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const message = buildReminderMessage(appointment.customerName, appointment.appointmentTime);
  const result = await sendWhatsAppMessage(appointment.phoneNumber, message);

  const [updated] = await db
    .update(appointmentsTable)
    .set({
      reminderSent: !result.simulated,
      messageSid: result.sid ?? appointment.messageSid,
    })
    .where(eq(appointmentsTable.id, appointment.id))
    .returning();

  req.log.info(
    { id: updated.id, simulated: result.simulated },
    "Reminder message dispatched"
  );

  res.json(updated);
});

export default router;
