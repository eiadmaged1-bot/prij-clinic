"use client";

type IconName =
  | "dashboard"
  | "calendar"
  | "patients"
  | "queue"
  | "encounter"
  | "prescription"
  | "investigations"
  | "reports"
  | "pregnancy"
  | "ultrasound"
  | "billing"
  | "consent"
  | "ai"
  | "admin"
  | "settings"
  | "files"
  | "timeline"
  | "search"
  | "doctor"
  | "reception";

type ThreeDMedicalIconProps = {
  name: IconName;
  label?: string;
  size?: "sm" | "md" | "lg";
  tone?: "teal" | "navy" | "violet" | "amber" | "rose" | "slate";
};

const paths: Record<IconName, string[]> = {
  dashboard: ["M5 7h6v6H5z", "M13 7h6v4h-6z", "M13 13h6v6h-6z", "M5 15h6v4H5z"],
  calendar: ["M6 6h12v13H6z", "M6 10h12", "M9 4v4", "M15 4v4", "M9 13h2", "M13 13h2", "M9 16h2"],
  patients: ["M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M4.5 19a5 5 0 0 1 10 0", "M16 10.5a2.5 2.5 0 1 0 0-5", "M15.5 14.5a4 4 0 0 1 4 4"],
  queue: ["M6 6h12v12H6z", "M9 9h6", "M9 12h6", "M9 15h3", "M17 4l2 2", "M17 20l2-2"],
  encounter: ["M7 5h10v15H7z", "M10 5a2 2 0 0 1 4 0", "M10 10h4", "M10 13h5", "M10 16h3"],
  prescription: ["M7 5h8a4 4 0 0 1 0 8H7z", "M7 13l8 7", "M7 20V5", "M16 15l4 4", "M20 15l-4 4"],
  investigations: ["M10 4h4", "M12 4v6l-5 8a2 2 0 0 0 1.7 3h6.6A2 2 0 0 0 17 18l-5-8", "M9 15h6"],
  reports: ["M7 5h8l3 3v12H7z", "M15 5v4h4", "M10 14l2 2 4-5", "M10 18h6"],
  pregnancy: ["M12 5a4 4 0 0 0-4 4c0 5 4 10 4 10s4-5 4-10a4 4 0 0 0-4-4z", "M12 11a2 2 0 1 0 0 4"],
  ultrasound: ["M5 6h14v9H5z", "M9 18h6", "M12 15v3", "M8 10h8", "M17 17l3 3"],
  billing: ["M7 5h10v14l-2-1-2 1-2-1-2 1-2-1z", "M10 9h4", "M10 12h5", "M10 15h3"],
  consent: ["M12 4l7 3v5c0 5-3 8-7 9-4-1-7-4-7-9V7z", "M9 12l2 2 4-4"],
  ai: ["M12 5a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0v-2a5 5 0 0 0-5-5z", "M9 10h.1", "M15 10h.1", "M10 15h4", "M19 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"],
  admin: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 3v3", "M12 18v3", "M3 12h3", "M18 12h3", "M5 5l2 2", "M17 17l2 2", "M19 5l-2 2", "M7 17l-2 2"],
  settings: ["M6 8h12", "M8 8a2 2 0 1 0 0 .1", "M6 16h12", "M16 16a2 2 0 1 0 0 .1", "M6 12h12", "M12 12a2 2 0 1 0 0 .1"],
  files: ["M5 7h6l2 2h6v10H5z", "M5 10h14", "M8 14h8"],
  timeline: ["M12 6v6l4 2", "M12 22a10 10 0 1 0-8-4", "M3 18h4v-4"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z", "M16 16l5 5"],
  doctor: ["M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M6 20a6 6 0 0 1 12 0", "M9 14v3", "M15 14v3", "M12 15v5"],
  reception: ["M5 17h14", "M7 17V8h10v9", "M9 11h2", "M13 11h2", "M9 14h6"]
};

export function ThreeDMedicalIcon({ name, label, size = "md", tone = "teal" }: ThreeDMedicalIconProps) {
  return (
    <span className={`medical-icon medical-icon-${size} medical-icon-${tone}`} aria-hidden={label ? undefined : true} aria-label={label} data-icon={name}>
      <svg viewBox="0 0 24 24" role="img" focusable="false">
        <defs>
          <linearGradient id={`g-${name}-${tone}`} x1="4" y1="3" x2="20" y2="21">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="9.5" className="medical-icon-glow" />
        {paths[name].map((path) => (
          <path d={path} key={path} />
        ))}
      </svg>
    </span>
  );
}

export type { IconName };
