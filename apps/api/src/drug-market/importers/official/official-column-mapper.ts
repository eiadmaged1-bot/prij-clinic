export function pickOfficialColumn(row: Record<string, unknown>, columns: string[]) {
  for (const column of columns) {
    const value = row[column];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return null;
}
