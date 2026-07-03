import type { ChangeEventHandler } from "react";

export function PatientSearchCard({
  value,
  onChange,
  placeholder = "Search by file number, name, or contact"
}: {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
}) {
  return (
    <section className="panel patient-search-card">
      <label>
        Patient search
        <input onChange={onChange} placeholder={placeholder} value={value} />
      </label>
    </section>
  );
}
