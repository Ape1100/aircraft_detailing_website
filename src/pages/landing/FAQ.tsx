import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is this an FAA inspection or maintenance service?",
    a: "No. Brightwork provides appearance, cleaning, and preservation services only. We do not perform FAA inspections, maintenance, repairs, or airworthiness determinations. Anything we observe that looks maintenance-related is documented and should be reviewed by a qualified A&P mechanic or IA.",
  },
  {
    q: "Do you come to my hangar or ramp spot?",
    a: "Yes. Brightwork is a mobile service — we bring equipment and aircraft-safe products to your hangar or ramp location.",
  },
  {
    q: "How accurate is the instant estimate?",
    a: "The estimate wizard gives you a realistic price range based on aircraft category, condition, and selected services, along with a confidence level. It is not a final quotation — final pricing is confirmed after we review your details or complete an on-site evaluation.",
  },
  {
    q: "Can I get service for a fleet of aircraft?",
    a: "Yes. Our Fleet / FBO plan and fleet preservation programs are built for recurring, multi-aircraft scheduling with consolidated invoicing.",
  },
  {
    q: "What happens after I request a quote?",
    a: "We'll review your aircraft details and follow up with pricing. You can also create a client account to track requests, approve quotes, and pay online.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-paper px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-center font-mono text-xs uppercase tracking-plate text-amberDark">FAQ</p>
        <h2 className="mt-2 text-center font-display text-3xl font-semibold text-ink md:text-4xl">
          Common questions
        </h2>

        <div className="mt-10 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.q}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                >
                  <span className="font-display text-base font-medium text-ink">{item.q}</span>
                  <ChevronDown
                    className={cn("h-5 w-5 flex-shrink-0 text-steel2 transition-transform", open && "rotate-180")}
                  />
                </button>
                {open && <p className="px-6 pb-5 text-sm text-steel">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
