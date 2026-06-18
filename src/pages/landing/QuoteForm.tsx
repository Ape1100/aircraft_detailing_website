import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/lib/settings-store";

export function QuoteForm() {
  const [submitted, setSubmitted] = useState(false);
  const { services } = useSettings();

  return (
    <section id="quote" className="bg-white px-6 py-24">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-plate text-amberDark">Request a Quote</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink md:text-4xl">
            Tell us about your aircraft
          </h2>
          <p className="mt-3 text-steel">
            Share a few details and we'll follow up with a quote. For an
            instant, itemized price range right now, try the estimate wizard
            instead.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/estimate">
              Use the instant estimate wizard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-navgreen" />
                <p className="font-display text-lg font-semibold text-ink">Request received</p>
                <p className="max-w-sm text-sm text-steel">
                  We'll review your aircraft details and follow up with a
                  quote shortly.
                </p>
              </div>
            ) : (
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <div>
                  <Label htmlFor="qf-name">Name</Label>
                  <Input id="qf-name" required placeholder="Jordan Avery" />
                </div>
                <div>
                  <Label htmlFor="qf-email">Email</Label>
                  <Input id="qf-email" type="email" required placeholder="jordan@example.com" />
                </div>
                <div>
                  <Label htmlFor="qf-phone">Phone</Label>
                  <Input id="qf-phone" type="tel" placeholder="(555) 123-4567" />
                </div>
                <div>
                  <Label htmlFor="qf-tail">Tail number</Label>
                  <Input id="qf-tail" placeholder="N12345" className="font-mono uppercase tracking-wide" />
                </div>
                <div>
                  <Label htmlFor="qf-aircraft">Aircraft make/model</Label>
                  <Input id="qf-aircraft" required placeholder="Cessna 172" />
                </div>
                <div>
                  <Label htmlFor="qf-airport">Airport / FBO location</Label>
                  <Input id="qf-airport" required placeholder="KSAC — Sacramento Executive" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="qf-parking">Hangared or ramp parked</Label>
                  <Select defaultValue="hangared">
                    <SelectTrigger id="qf-parking">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hangared">Hangared</SelectItem>
                      <SelectItem value="ramp">Ramp parked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="qf-service">Desired service</Label>
                  <Select>
                    <SelectTrigger id="qf-service">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.name}{s.startingPrice === null ? " (quote required)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Photos</Label>
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-ink/15 bg-paperDim/60 px-4 py-5 text-sm text-steel">
                    <UploadCloud className="h-5 w-5 text-steel2" />
                    Drop photos here, or click to upload (optional)
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="qf-notes">Notes</Label>
                  <Textarea id="qf-notes" placeholder="Anything we should know before we quote this?" />
                </div>
                <Button type="submit" variant="amber" size="lg" className="sm:col-span-2">
                  Request Aircraft Service
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
