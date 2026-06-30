// Netlify Function: send-report-email
// ---------------------------------------------------------------------
// Emails a confirmed detailing report (PDF attached) to the client on
// file. The PDF itself is generated client-side (src/lib/pdf-generator.ts,
// using jsPDF in the browser, since that's where the signed photo URLs
// and business settings already live) and passed here as base64 —
// this function only needs the Resend API key, which must stay
// server-side.
//
// AdminReportBuilder.tsx calls this, and only on a 200 response does it
// call confirmDetailingReport() to mark the report confirmed — a failed
// send must never leave a report marked as sent.
//
// Requires RESEND_API_KEY and RESEND_FROM_EMAIL in the Netlify
// environment. RESEND_FROM_EMAIL must be an address on a domain verified
// in the Resend dashboard (or the default onboarding@resend.dev test
// sender, which works with no verification but is rate-limited and
// looks like a test address to the client).
// ---------------------------------------------------------------------

import type { Handler } from "@netlify/functions";
import { Resend } from "resend";
import { createPostHogClient } from "./posthog-client";

function badRequest(message: string) {
  return { statusCode: 400, body: JSON.stringify({ error: message }) };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  if (!process.env.RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing RESEND_API_KEY environment variable" }) };
  }
  if (!process.env.RESEND_FROM_EMAIL) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing RESEND_FROM_EMAIL environment variable" }) };
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return badRequest("Malformed JSON body");
  }

  const { to, clientName, businessName, total, filename, pdfBase64 } = body;

  if (typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return badRequest("A valid recipient email (to) is required");
  }
  if (typeof pdfBase64 !== "string" || pdfBase64.length === 0) {
    return badRequest("pdfBase64 is required");
  }
  if (typeof filename !== "string" || filename.length === 0) {
    return badRequest("filename is required");
  }

  const greetingName = typeof clientName === "string" && clientName.trim() ? clientName.trim() : "there";
  const fromName = typeof businessName === "string" && businessName.trim() ? businessName.trim() : "your detailer";
  const totalLine =
    typeof total === "number" && Number.isFinite(total)
      ? `<p>Total: <strong>$${total.toFixed(2)}</strong></p>`
      : "";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: `Your detailing report from ${fromName}`,
      html: `
        <p>Hi ${greetingName},</p>
        <p>Your detailing report from ${fromName} is attached.</p>
        ${totalLine}
        <p>Thanks for your business.</p>
      `,
      attachments: [{ filename, content: pdfBase64 }],
    });

    if (error) {
      return { statusCode: 502, body: JSON.stringify({ error: error.message }) };
    }

    const posthog = createPostHogClient();
    posthog.capture({
      distinctId: to,
      event: "detailing report emailed",
      properties: {
        recipient_email: to,
        client_name: typeof clientName === "string" ? clientName : undefined,
        total: typeof total === "number" ? total : undefined,
        filename,
      },
    });
    await posthog.shutdown();

    return { statusCode: 200, body: JSON.stringify({ sent: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: (err as Error).message }) };
  }
};
