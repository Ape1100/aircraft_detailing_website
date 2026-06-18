import { cn } from "@/lib/utils";

interface ConfidenceGaugeProps {
  confidence: "high" | "medium" | "low";
  className?: string;
}

const VALUE: Record<ConfidenceGaugeProps["confidence"], number> = {
  low: 0.18,
  medium: 0.52,
  high: 0.86,
};

const LABEL_COLOR: Record<ConfidenceGaugeProps["confidence"], string> = {
  low: "text-rust",
  medium: "text-amberDark",
  high: "text-navgreen",
};

/** A half-circle instrument dial, echoing a cockpit gauge, used to show how
 * confident the estimate is given the information provided. */
export function ConfidenceGauge({ confidence, className }: ConfidenceGaugeProps) {
  const value = VALUE[confidence];
  const angle = -90 + value * 180;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg viewBox="0 0 200 110" className="w-44">
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke="#EFEBE3"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 10 100 A 90 90 0 0 1 73 16"
          fill="none"
          stroke="#B5532C"
          strokeWidth="14"
          strokeLinecap="round"
          opacity={0.55}
        />
        <path
          d="M 73 16 A 90 90 0 0 1 127 16"
          fill="none"
          stroke="#E8A33D"
          strokeWidth="14"
          opacity={0.55}
        />
        <path
          d="M 127 16 A 90 90 0 0 1 190 100"
          fill="none"
          stroke="#2F8F6F"
          strokeWidth="14"
          strokeLinecap="round"
          opacity={0.55}
        />
        <g transform={`rotate(${angle} 100 100)`} className="transition-transform duration-500">
          <line x1="100" y1="100" x2="100" y2="28" stroke="#0B1320" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="7" fill="#0B1320" />
      </svg>
      <p className={cn("font-display text-sm font-semibold uppercase tracking-wide", LABEL_COLOR[confidence])}>
        {confidence} confidence
      </p>
    </div>
  );
}
