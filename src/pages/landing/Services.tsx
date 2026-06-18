import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AvailabilityBadge, availabilityNote } from "@/components/aviation/AvailabilityBadge";
import { useSettings } from "@/lib/settings-store";
import { formatCurrency } from "@/lib/utils";

export function Services() {
  const { services } = useSettings();
  const launch = services.filter((s) => s.category === "launch");
  const advanced = services.filter((s) => s.category === "advanced");

  return (
    <section id="services" className="bg-paper px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-plate text-amberDark">Services</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink md:text-4xl">
            Available at launch
          </h2>
          <p className="mt-3 text-steel">
            Core appearance and cleaning services, ready to schedule today.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {launch.map((service) => (
            <Card key={service.code}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{service.name}</CardTitle>
                  <AvailabilityBadge status={service.availability} />
                </div>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-display text-xl font-semibold text-ink">
                  {service.startingPrice ? `Starting at ${formatCurrency(service.startingPrice)}` : "Quote required"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {advanced.length > 0 && (
          <>
            <div className="mt-20 max-w-xl">
              <p className="font-mono text-xs uppercase tracking-plate text-amberDark">
                Advanced &amp; limited availability
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
                Specialty services, by evaluation or referral
              </h3>
              <p className="mt-3 text-steel">
                These services require an on-site evaluation, are offered in
                limited capacity, or are coordinated through approved partners.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {advanced.map((service) => (
                <Card key={service.code} className="border-dashed">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle>{service.name}</CardTitle>
                      <AvailabilityBadge status={service.availability} />
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-lg font-semibold text-ink">
                      {service.startingPrice ? `Starting at ${formatCurrency(service.startingPrice)}` : "Quote required"}
                    </p>
                    <p className="mt-2 text-xs text-steel2">{availabilityNote(service.availability)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
