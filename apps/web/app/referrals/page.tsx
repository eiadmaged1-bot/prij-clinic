import { MvpPage } from "../mvp-page";

export default function ReferralsPage() {
  return (
    <MvpPage
      eyebrow="Referral workflow"
      title="Referrals"
      items={[
        "Track inbound, outbound, and internal referrals",
        "Clinical summaries are doctor-authored only",
        "Print-friendly referral letters are demo browser views only"
      ]}
      endpoint="/referrals"
      collectionKey="referrals"
    />
  );
}
