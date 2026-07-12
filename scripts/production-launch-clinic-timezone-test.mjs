import assert from 'node:assert/strict';
import fs from 'node:fs';

function parseClinicDate(dateString) {
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3 || parts.some(value => !Number.isInteger(value))) throw new Error('Invalid clinic date.');
  const [year, month, day] = parts;
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) throw new Error('Invalid clinic date.');
  return [year, month, day];
}

function localMidnightUtc(year, month, day) {
  const noon = new Date(Date.UTC(year, month - 1, day, 12));
  const label = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', timeZoneName: 'shortOffset' })
    .formatToParts(noon).find(part => part.type === 'timeZoneName')?.value;
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(label ?? '');
  assert.ok(match, 'Cairo offset must be available');
  const minutes = (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] ?? 0));
  return new Date(Date.UTC(year, month - 1, day) - minutes * 60_000);
}

function bounds(value) {
  const [year, month, day] = parseClinicDate(value);
  const start = localMidnightUtc(year, month, day);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDayStart = localMidnightUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
  return { start, nextDayStart };
}

assert.equal(bounds('2026-01-15').start.toISOString(), '2026-01-14T22:00:00.000Z', 'Cairo winter midnight must be UTC+2');
assert.equal(bounds('2026-07-12').start.toISOString(), '2026-07-11T21:00:00.000Z', 'Cairo summer midnight must be UTC+3');
for (const date of ['2026-01-15', '2026-07-12']) {
  const { start, nextDayStart } = bounds(date);
  assert.equal(nextDayStart.getTime() - start.getTime(), 86_400_000, `${date} must have contiguous midnight boundaries`);
  assert.equal(new Date(nextDayStart.getTime() - 1).getTime() + 1, nextDayStart.getTime());
}
for (const invalid of ['2026-02-31', '2025-02-29', '2026-13-01', '2026-00-01', 'not-a-date']) {
  assert.throws(() => bounds(invalid), /Invalid clinic date/);
}

const source = fs.readFileSync(new URL('../apps/api/src/clinic-time/clinic-time.service.ts', import.meta.url), 'utf8');
assert.match(source, /parts\.length !== 3/);
assert.match(source, /nextDayStart\.getTime\(\) - 1/);
console.log('Clinic timezone winter, summer, midnight, and invalid-date tests passed.');
