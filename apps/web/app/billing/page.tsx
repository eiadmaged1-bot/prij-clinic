import { MvpPage } from "../mvp-page";

export default function BillingPage() {
  return (
    <MvpPage
      eyebrow="Billing"
      title="Billing and Payments"
      items={[
        "Invoice foundation tracks draft, issued, paid, partially paid, cancelled, and voided states",
        "Payment records store method, amount, date, and reference notes without card numbers or payment secrets",
        "Invoice and payment changes are protected by billing permissions and audit logs"
      ]}
      endpoint="/billing/invoices"
      collectionKey="invoices"
    />
  );
}
