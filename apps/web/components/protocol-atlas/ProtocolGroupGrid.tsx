"use client";

const displayGroups = [
  "General gynecology",
  "Menstrual disorders",
  "Pelvic pain/endometriosis",
  "Benign gynecology",
  "Infection/STI",
  "PCOS/endocrine",
  "Fertility/IVF",
  "Contraception/family planning",
  "Early pregnancy",
  "Antenatal care",
  "High-risk obstetrics",
  "Fetal medicine/ultrasound",
  "Labor/delivery",
  "Postpartum/lactation",
  "Menopause/midlife",
  "Urogynecology/pelvic floor",
  "Women's health physiotherapy",
  "Breast health",
  "Preventive/oncology",
  "Sexual health/sensitive care",
  "Adolescent gynecology",
  "Surgical gynecology",
  "Medical disease intersection",
  "Emergency red flags"
];

export function ProtocolGroupGrid({ onSelect }: { onSelect: (group: string) => void }) {
  return (
    <div className="protocol-group-grid">
      {displayGroups.map((group) => (
        <button className="protocol-group-card" key={group} onClick={() => onSelect(group)} type="button">
          <strong>{group}</strong>
          <span>Open catalog</span>
        </button>
      ))}
    </div>
  );
}
