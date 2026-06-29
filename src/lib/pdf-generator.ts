// Generates real downloadable/shareable PDF files for detailing reports —
// deliberately a real PDF library rather than the browser's print dialog,
// since the point is a file an admin can attach/share, not just print.

import { jsPDF } from "jspdf";
import type { BusinessSettings, ObservedIssueCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";

const ISSUE_LABELS: Record<ObservedIssueCategory, string> = {
  paint_chips: "Paint Chips",
  scratches: "Scratches",
  corrosion_observation: "Corrosion Observation",
  loose_missing_fastener: "Loose / Missing Fastener Observation",
  fluid_staining: "Fluid Staining",
  tire_wheel_observation: "Tire / Wheel Observation",
  window_condition: "Window Condition",
  seal_trim_condition: "Seal / Trim Condition",
  interior_wear: "Interior Wear",
  other: "Other",
};

export interface ReportPdfPhoto {
  signedUrl: string;
  kind: "before" | "after" | "observed_issue";
}

export interface ReportPdfServicePrice {
  name: string;
  finalPrice: number;
}

export interface ReportPdfData {
  businessSettings: BusinessSettings;
  aircraftLabel: string; // e.g. "N12345 — Cessna 172"
  clientName: string;
  serviceDate: string; // already formatted for display
  location: string;
  servicePrices: ReportPdfServicePrice[];
  total: number;
  productsUsed: string[];
  technicianNotes: string | null;
  recommendations: string | null;
  observedIssues: { category: ObservedIssueCategory; note: string }[];
  photos: ReportPdfPhoto[];
  disclaimer: string;
}

const PAGE_WIDTH = 210; // A4 mm
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAGE_BOTTOM = 280;

function fileBaseName(data: ReportPdfData, prefix: string) {
  return `${prefix}-${data.aircraftLabel.split(" ")[0]}-${data.serviceDate}.pdf`.replace(/[\s,]+/g, "-");
}

/** Fetches an (already-signed) image URL and converts it to a data URL,
 * since jsPDF's addImage needs the actual bytes, not a URL it can fetch
 * itself (and these URLs are time-limited signed URLs from a private
 * bucket, not something jsPDF could load cross-origin anyway). */
async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

class PdfCursor {
  doc: jsPDF;
  y: number;

  constructor(doc: jsPDF) {
    this.doc = doc;
    this.y = MARGIN;
  }

  ensureSpace(neededHeight: number) {
    if (this.y + neededHeight > PAGE_BOTTOM) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  heading(text: string) {
    this.ensureSpace(10);
    this.doc.setFontSize(13);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(text, MARGIN, this.y);
    this.y += 7;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
  }

  label(text: string) {
    this.ensureSpace(6);
    this.doc.setFontSize(8);
    this.doc.setTextColor(120);
    this.doc.text(text.toUpperCase(), MARGIN, this.y);
    this.y += 4.5;
    this.doc.setTextColor(20);
    this.doc.setFontSize(10);
  }

  paragraph(text: string, fontSize = 10) {
    this.doc.setFontSize(fontSize);
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(5.5);
      this.doc.text(line, MARGIN, this.y);
      this.y += 5.5;
    }
    this.y += 2;
  }

  /** A service name on the left, its price right-aligned — same row. */
  priceLine(name: string, amount: number, bold = false) {
    this.ensureSpace(6);
    this.doc.setFont("helvetica", bold ? "bold" : "normal");
    this.doc.text(name, MARGIN, this.y);
    this.doc.text(formatCurrency(amount), PAGE_WIDTH - MARGIN, this.y, { align: "right" });
    this.doc.setFont("helvetica", "normal");
    this.y += 6;
  }

  divider() {
    this.ensureSpace(4);
    this.doc.setDrawColor(220);
    this.doc.line(MARGIN, this.y, PAGE_WIDTH - MARGIN, this.y);
    this.y += 6;
  }

  async image(dataUrl: string, caption?: string) {
    const width = 60;
    const height = 60;
    this.ensureSpace(height + (caption ? 6 : 0) + 4);
    try {
      this.doc.addImage(dataUrl, "JPEG", MARGIN, this.y, width, height);
    } catch {
      // Some browsers/photos produce a format addImage can't sniff from
      // the data URL prefix — retry as PNG before giving up on this photo.
      try {
        this.doc.addImage(dataUrl, "PNG", MARGIN, this.y, width, height);
      } catch {
        return;
      }
    }
    this.y += height + 2;
    if (caption) {
      this.doc.setFontSize(8);
      this.doc.setTextColor(120);
      this.doc.text(caption, MARGIN, this.y);
      this.doc.setTextColor(20);
      this.doc.setFontSize(10);
      this.y += 5;
    }
  }
}

function drawHeader(doc: jsPDF, business: BusinessSettings, title: string) {
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(business.companyName || "Detailing Report", MARGIN, MARGIN);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  const contactLine = [business.contactEmail, business.contactPhone].filter(Boolean).join(" · ");
  if (contactLine) {
    doc.text(contactLine, MARGIN, MARGIN + 5.5);
  }
  doc.setTextColor(20);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, PAGE_WIDTH - MARGIN, MARGIN, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
}

async function buildServiceReportDoc(data: ReportPdfData): Promise<jsPDF> {
  const doc = new jsPDF();
  drawHeader(doc, data.businessSettings, "Detailing Report");

  const cursor = new PdfCursor(doc);
  cursor.y = MARGIN + 16;
  cursor.divider();

  cursor.label("Aircraft");
  cursor.paragraph(data.aircraftLabel);
  cursor.label("Client");
  cursor.paragraph(data.clientName);
  cursor.label("Service date");
  cursor.paragraph(data.serviceDate);
  cursor.label("Location");
  cursor.paragraph(data.location);

  if (data.servicePrices.length > 0) {
    cursor.heading("Services performed");
    for (const sp of data.servicePrices) {
      cursor.priceLine(sp.name, sp.finalPrice);
    }
    cursor.divider();
    cursor.priceLine("Total", data.total, true);
  }

  if (data.productsUsed.length > 0) {
    cursor.heading("Products used");
    cursor.paragraph(data.productsUsed.join(", "));
  }

  if (data.technicianNotes) {
    cursor.heading("Technician notes");
    cursor.paragraph(data.technicianNotes);
  }

  if (data.observedIssues.length > 0) {
    cursor.heading("Observed issues");
    for (const issue of data.observedIssues) {
      cursor.paragraph(`${ISSUE_LABELS[issue.category]} — ${issue.note}`);
    }
  }

  if (data.recommendations) {
    cursor.heading("Recommendations");
    cursor.paragraph(data.recommendations);
  }

  if (data.photos.length > 0) {
    cursor.heading("Photos");
    for (const photo of data.photos) {
      try {
        const dataUrl = await fetchAsDataUrl(photo.signedUrl);
        await cursor.image(dataUrl, photo.kind.replace("_", " "));
      } catch {
        // A single bad/expired photo URL shouldn't block the whole report.
      }
    }
  }

  cursor.divider();
  cursor.paragraph(data.disclaimer, 8);

  return doc;
}

async function buildConditionReportDoc(data: ReportPdfData): Promise<jsPDF> {
  const doc = new jsPDF();
  drawHeader(doc, data.businessSettings, "Condition Report");

  const cursor = new PdfCursor(doc);
  cursor.y = MARGIN + 16;
  cursor.divider();

  cursor.label("Aircraft");
  cursor.paragraph(data.aircraftLabel);
  cursor.label("Client");
  cursor.paragraph(data.clientName);
  cursor.label("Observed on");
  cursor.paragraph(data.serviceDate);
  cursor.label("Location");
  cursor.paragraph(data.location);

  cursor.heading("Observed issues");
  if (data.observedIssues.length === 0) {
    cursor.paragraph("No issues observed during this visit.");
  } else {
    for (const issue of data.observedIssues) {
      cursor.paragraph(`${ISSUE_LABELS[issue.category]} — ${issue.note}`);
    }
  }

  if (data.photos.length > 0) {
    cursor.heading("Photos");
    for (const photo of data.photos) {
      try {
        const dataUrl = await fetchAsDataUrl(photo.signedUrl);
        await cursor.image(dataUrl);
      } catch {
        // Skip a photo that fails to load rather than failing the report.
      }
    }
  }

  cursor.divider();
  cursor.paragraph(data.disclaimer, 8);

  return doc;
}

/** Full service report: every section of the detailing report, including
 * the per-service prices and total. Triggers a browser download. */
export async function generateServiceReportPdf(data: ReportPdfData): Promise<void> {
  const doc = await buildServiceReportDoc(data);
  doc.save(fileBaseName(data, "detailing-report"));
}

/** Condition report: aircraft/client identification + observed issues
 * (with their photos) + disclaimer only — deliberately narrower than the
 * full service report, for when only the condition findings need to be
 * shared (e.g. with an owner or broker), not the whole service writeup.
 * Triggers a browser download. */
export async function generateConditionReportPdf(data: ReportPdfData): Promise<void> {
  const doc = await buildConditionReportDoc(data);
  doc.save(fileBaseName(data, "condition-report"));
}

/** Same content as generateServiceReportPdf, but returns the PDF as a
 * base64 string instead of triggering a download — for attaching to the
 * "send to client" email rather than saving locally. */
export async function getServiceReportPdfBase64(
  data: ReportPdfData
): Promise<{ base64: string; filename: string }> {
  const doc = await buildServiceReportDoc(data);
  // jsPDF's typed output() overloads don't include a plain "base64"
  // variant — "datauristring" is typed and gives the same bytes prefixed
  // with a data: URI header, which we strip off.
  const dataUri = doc.output("datauristring");
  const base64 = dataUri.slice(dataUri.indexOf("base64,") + "base64,".length);
  return { base64, filename: fileBaseName(data, "detailing-report") };
}
