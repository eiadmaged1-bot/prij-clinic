"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../mvp-page";
import { AvailabilitySummary, MarketVariantTable } from "../../../../components/medications/MedicationComponents";
import { getDrugMarketProduct } from "../../../../lib/drug-market";

export default function DrugMarketProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void params.then(({ id }) => getDrugMarketProduct(id).then((data) => setProduct(data as Record<string, unknown>)).catch(() => setProduct(null)));
  }, [params]);

  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Product profile</p>
        <h1>{String(product?.tradeName ?? "Drug market product")}</h1>
        <p className="muted">Expanded profiles list all countries and marketed variants. Strength means market variant, not patient directions.</p>
      </section>
      <section className="panel">
        <h2>Availability</h2>
        <AvailabilitySummary availabilities={(product?.availabilities as Array<Record<string, unknown>>) ?? []} />
      </section>
      <section className="panel">
        <h2>Variants by country</h2>
        <MarketVariantTable variants={(product?.variants as Array<Record<string, unknown>>) ?? []} />
      </section>
    </AppShell>
  );
}
