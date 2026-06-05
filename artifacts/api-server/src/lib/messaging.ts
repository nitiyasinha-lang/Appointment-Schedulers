import { logger } from "./logger";

export interface MessageResult {
  sid: string | null;
  simulated: boolean;
}

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `+27${digits.slice(1)}`;
  }
  if (!digits.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  return phone.startsWith("+") ? phone : `+${digits}`;
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
      {
        to: toFormatted,
        body,
        missingVars: {
          TWILIO_ACCOUNT_SID: !accountSid,
          TWILIO_AUTH_TOKEN: !authToken,
          TWILIO_PHONE_NUMBER: !fromNumber,
        },
      },
      "[SIMULATED] Would send WhatsApp/SMS message — Twilio credentials not configured"
    );
    return { sid: null, simulated: true };
  }

  try {
    const fromFormatted = fromNumber.startsWith("whatsapp:")
      ? fromNumber
      : `whatsapp:${fromNumber}`;
    const toWhatsApp = `whatsapp:${toFormatted}`;

    const params = new URLSearchParams({
      To: toWhatsApp,
      From: fromFormatted,
      Body: body,
    });

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
      logger.error(
        { status: response.status, errorBody, to: toWhatsApp },
        "Twilio API error — falling back to simulation"
      );
      return { sid: null, simulated: true };
    }

    const data = (await response.json()) as { sid: string };
    logger.info({ sid: data.sid, to: toWhatsApp }, "WhatsApp message sent via Twilio");
    return { sid: data.sid, simulated: false };
  } catch (err) {
    logger.error({ err, to: toFormatted }, "Failed to send Twilio message — falling back to simulation");
    return { sid: null, simulated: true };
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
