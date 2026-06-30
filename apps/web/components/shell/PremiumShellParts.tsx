"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ThreeDMedicalIcon } from "../ThreeDMedicalIcon";
import type { NavItem } from "../../app/navigation-registry";

export function PatientSearchCommand() {
  return (
    <label className="portal-search" aria-label="Search patient files">
      <span>Search</span>
      <input placeholder="Find patient file or appointment" />
    </label>
  );
}

export function ModuleBadge({ children }: { children: ReactNode }) {
  return <span className="badge accent">{children}</span>;
}

export function ThemeDensityControls({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="comfort-switch" aria-label="Display density">
      {children}
    </div>
  );
}

export function UserSessionBadge({
  name,
  detail,
  isAdmin
}: {
  name: string;
  detail: string;
  isAdmin: boolean;
}) {
  return (
    <div className="user-menu" aria-label="Current user">
      <ThreeDMedicalIcon name={isAdmin ? "admin" : "doctor"} size="sm" tone={isAdmin ? "violet" : "slate"} />
      <div className="user-menu-copy">
        <strong>{name}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

export function RoleAwareNav({
  groups,
  pathname,
  renderLink
}: {
  groups: Array<{ title: NavItem["group"]; links: NavItem[] }>;
  pathname: string | null;
  renderLink?: (item: NavItem, active: boolean, title: NavItem["group"]) => ReactNode;
}) {
  return (
    <>
      {groups.map((group) => (
        <nav className="nav-group" key={group.title} aria-label={group.title}>
          <div className="nav-group-title">{group.title}</div>
          {group.links.map((item) => {
            const active = isActive(pathname, item.href);
            return renderLink ? (
              renderLink(item, active, group.title)
            ) : (
              <Link className={`nav-item ${active ? "active" : ""}`} href={item.href} key={item.href}>
                <span>{item.label}</span>
                <span className="nav-dot" />
              </Link>
            );
          })}
        </nav>
      ))}
    </>
  );
}

export function PremiumSidebar({ children }: { children: ReactNode }) {
  return <aside className="sidebar">{children}</aside>;
}

export function PremiumTopbar({ children }: { children: ReactNode }) {
  return <header className="topbar">{children}</header>;
}

export function AppShellFrame({
  theme,
  density,
  children
}: {
  theme: string;
  density: string;
  children: ReactNode;
}) {
  return (
    <main className={`app-shell theme-${theme}`} data-density={density}>
      {children}
    </main>
  );
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
