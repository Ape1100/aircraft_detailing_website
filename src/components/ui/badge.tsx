import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        neutral: "bg-paperDim text-steel",
        ink: "bg-ink text-paper",
        amber: "bg-amber/15 text-amberDark",
        green: "bg-navgreen/10 text-navgreen",
        rust: "bg-rust/10 text-rust",
        outline: "border border-ink/15 text-ink",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
