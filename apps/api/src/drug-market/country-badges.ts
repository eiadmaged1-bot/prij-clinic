type Availability = {
  countryCode: string;
  compactBadgeLabel: string | null;
  showCompactBadge: boolean;
};

export function compactCountryBadges(availabilities: Availability[]) {
  const hasEgypt = availabilities.some((item) => item.countryCode === "EG");
  if (hasEgypt) return [];
  return availabilities
    .filter((item) => item.showCompactBadge && item.compactBadgeLabel)
    .map((item) => item.compactBadgeLabel as string);
}
