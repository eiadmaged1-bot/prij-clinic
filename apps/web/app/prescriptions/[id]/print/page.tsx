"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { A5_PRINT_LAYOUT, prescriptionTextDirection } from "@/lib/prescription-print";
import styles from "./print.module.css";

type PrintPrescription = {
  id: string;
  status: string;
  createdAt: string;
  notes?: string | null;
  patient?: { firstName?: string; lastName?: string; displayName?: string; dateOfBirth?: string | null; medicalRecordNumber?: string | null } | null;
  doctor?: { displayName?: string } | null;
  items: Array<{ id: string; medicationName: string; genericName?: string | null; tradeName?: string | null; strengthText?: string | null; dosageForm?: string | null; quantityText?: string | null; dispensingUnit?: string | null; dose?: string | null; route?: string | null; frequency?: string | null; duration?: string | null; instructions?: string | null }>;
};

export default function PrescriptionPrintPage() {
  const params = useParams<{ id: string }>();
  const [prescription, setPrescription] = useState<PrintPrescription | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    void fetch(`${getApiBaseUrl()}/prescriptions/${encodeURIComponent(params.id)}/print`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setPrescription((await response.json()) as PrintPrescription);
      })
      .catch(() => setError("This prescription could not be prepared for printing. Return to the prescription workspace and try again."));
  }, [params.id]);

  const paperStyle = useMemo(() => ({
    "--safe-top": `${A5_PRINT_LAYOUT.safeArea.topMm}mm`,
    "--safe-right": `${A5_PRINT_LAYOUT.safeArea.rightMm}mm`,
    "--safe-bottom": `${A5_PRINT_LAYOUT.safeArea.bottomMm}mm`,
    "--safe-left": `${A5_PRINT_LAYOUT.safeArea.leftMm}mm`,
    ...(A5_PRINT_LAYOUT.approvedBackgroundUrl ? { backgroundImage: `url(${A5_PRINT_LAYOUT.approvedBackgroundUrl})` } : {})
  }) as CSSProperties, []);

  if (error) return <main className={styles.error}>{error}</main>;
  if (!prescription) return <main className={styles.error}>Preparing prescription…</main>;

  const patientName = prescription.patient?.displayName || [prescription.patient?.firstName, prescription.patient?.lastName].filter(Boolean).join(" ") || "Patient";
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(prescription.createdAt));

  return <main>
    <div className={styles.screenToolbar}><button type="button" onClick={() => window.print()}>Print A5 prescription</button></div>
    <article className={styles.paper} style={paperStyle} data-prescription-print-page>
      <header className={styles.patientRow}>
        <strong dir={prescriptionTextDirection(patientName)}>{patientName}</strong>
        <span>{formatAge(prescription.patient?.dateOfBirth)}</span>
        <span>{date}</span>
        {prescription.patient?.medicalRecordNumber ? <span>File: {prescription.patient.medicalRecordNumber}</span> : null}
      </header>
      <section className={styles.medications}>
        {prescription.items.map((item, index) => <article className={styles.medication} key={item.id} dir={prescriptionTextDirection(`${item.medicationName} ${item.instructions ?? ""}`)}>
          <div className={styles.medicationHeader}><strong>{index + 1}. {item.medicationName}</strong><span>{[item.strengthText, item.dosageForm].filter(Boolean).join(" · ")}</span></div>
          {item.quantityText || item.dispensingUnit ? <div className={styles.directions}>Dispense: {[item.quantityText, item.dispensingUnit].filter(Boolean).join(" ")}</div> : null}
          <div className={styles.directions}>{[item.dose, item.route, item.frequency, item.duration].filter(Boolean).join(" · ")}</div>
          {item.instructions ? <div className={styles.instructions}>{item.instructions}</div> : null}
        </article>)}
      </section>
      <footer className={styles.footer}>
        <div className={styles.notes} dir={prescriptionTextDirection(prescription.notes ?? "")}>{prescription.notes || ""}</div>
        <div className={styles.signature}><strong>{prescription.doctor?.displayName || "Doctor"}</strong><br /><span>Signature / stamp</span></div>
      </footer>
    </article>
  </main>;
}

function formatAge(value?: string | null) {
  if (!value) return "Age not recorded";
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return "Age not recorded";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return `Age: ${Math.max(age, 0)}`;
}
