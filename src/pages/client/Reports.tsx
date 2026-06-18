import { Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_AIRCRAFT, MOCK_REPORTS } from "@/lib/mock-data";
import { useSettings } from "@/lib/settings-store";
import { formatDate } from "@/lib/utils";

const ISSUE_LABELS: Record<string, string> = {
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

export default function Reports() {
  const { services } = useSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Detailing Reports</h1>
        <p className="text-sm text-steel">Photo-documented condition reports from every visit.</p>
      </div>

      {MOCK_REPORTS.map((report) => {
        const aircraft = MOCK_AIRCRAFT.find((a) => a.id === report.aircraftId);
        return (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle>{aircraft?.tailNumber} — {formatDate(report.serviceDate)}</CardTitle>
              <CardDescription>{report.location}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-steel2">Services performed</p>
                <p className="text-sm text-ink">
                  {report.servicesPerformed
                    .map((s) => services.find((sc) => sc.code === s)?.name ?? s)
                    .join(", ")}
                </p>
              </div>

              {report.technicianNotes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-steel2">Technician notes</p>
                  <p className="text-sm text-ink">{report.technicianNotes}</p>
                </div>
              )}

              {report.observedIssues.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-steel2">Observed issues</p>
                  <div className="mt-2 space-y-2">
                    {report.observedIssues.map((issue) => (
                      <div key={issue.id} className="rounded-lg border border-ink/10 px-4 py-3">
                        <Badge variant="outline">{ISSUE_LABELS[issue.category]}</Badge>
                        <p className="mt-1.5 text-sm text-ink">{issue.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.recommendations && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-steel2">Recommendations</p>
                  <p className="text-sm text-ink">{report.recommendations}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {report.photos.map((p) => (
                  <div key={p.id} className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-ink/10 bg-paperDim text-steel2">
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px] capitalize">{p.kind.replace("_", " ")}</span>
                  </div>
                ))}
              </div>

              <p className="border-t border-ink/10 pt-4 text-xs leading-relaxed text-steel2">
                {report.disclaimer}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
