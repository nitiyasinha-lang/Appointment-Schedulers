import { logger } from "./logger";

export interface MessageResult {
  sid: string | null;
  simulated: boolean;
  channel: "whatsapp" | "sms" | "simulated";
}

function formatPhoneNumber(phone: string): string {
  const stripped = phone.replace(/^whatsapp:/i, "");
  const digits = stripped.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `+27${digits.slice(1)}`;
  }
  if (!stripped.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  return stripped.startsWith("+") ? stripped : `+${digits}`;
}

async function twilioPost(
  accountSid: string,
  authToken: string,
  to: string,
  from: string,
  body: string
): Promise<{ ok: boolean; sid?: string; errorBody?: string; status?: number }> {
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );
  if (!response.ok) {
    const errorBody = await response.text();
    return { ok: false, errorBody, status: response.status };
  }
  const data = (await response.json()) as { sid: string };
  return { ok: true, sid: data.sid };
}

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<MessageResult> {
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const fromNumber = process.env["TWILIO_PHONE_NUMBER"];

  const toFormatted = formatPhoneNumber(to);

  if (!accountSid || !authToken || !fromNumber) {
    logger.warn(
      { to: toFormatted, body },
      "[SIMULATED] Would send WhatsApp/SMS — Twilio credentials not configured"
    );
    return { sid: null, simulated: true, channel: "simulated" };
  }

  const fromBase = fromNumber.replace(/^whatsapp:/i, "");
  const isExplicitWhatsApp = fromNumber.toLowerCase().startsWith("whatsapp:");

  try {
    if (isExplicitWhatsApp) {
      const result = await twilioPost(
        accountSid, authToken,
        `whatsapp:${toFormatted}`,
        `whatsapp:${fromBase}`,
        body
      );
      if (result.ok) {
        logger.info({ sid: result.sid, to: toFormatted }, "WhatsApp message sent");
        return { sid: result.sid!, simulated: false, channel: "whatsapp" };
      }
      logger.error({ status: result.status, error: result.errorBody }, "WhatsApp send failed");
      return { sid: null, simulated: true, channel: "simulated" };
    }

    const whatsappResult = await twilioPost(
      accountSid, authToken,
      `whatsapp:${toFormatted}`,
      `whatsapp:${fromBase}`,
      body
    );
    if (whatsappResult.ok) {
      logger.info({ sid: whatsappResult.sid, to: toFormatted }, "WhatsApp message sent");
      return { sid: whatsappResult.sid!, simulated: false, channel: "whatsapp" };
    }

    logger.warn(
      { status: whatsappResult.status, error: whatsappResult.errorBody },
      "WhatsApp failed, falling back to SMS"
    );

    const smsResult = await twilioPost(
      accountSid, authToken,
      toFormatted,
      fromBase,
      body
    );
    if (smsResult.ok) {
      logger.info({ sid: smsResult.sid, to: toFormatted }, "SMS message sent");
      return { sid: smsResult.sid!, simulated: false, channel: "sms" };
    }

    logger.error(
      { status: smsResult.status, error: smsResult.errorBody },
      "Both WhatsApp and SMS failed — falling back to simulation"
    );
    return { sid: null, simulated: true, channel: "simulated" };
  } catch (err) {
    logger.error({ err, to: toFormatted }, "Twilio request failed — falling back to simulation");
    return { sid: null, simulated: true, channel: "simulated" };
  }
}

export function buildConfirmationMessage(
  customerName: string,
  appointmentTime: Date
): string {
  const formatted = appointmentTime.toLocaleString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `Hi ${customerName}, your appointment has been confirmed for ${formatted}. We look forward to seeing you! Reply STOP to unsubscribe.`;
}

export function buildReminderMessage(
  customerName: string,
  appointmentTime: Date
): string {
  const formatted = appointmentTime.toLocaleString("en-ZA", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `Hi ${customerName}, this is a reminder that your appointment is coming up on ${formatted}. See you soon!`;
}
