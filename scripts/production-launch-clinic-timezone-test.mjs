import assert from 'assert';

function getClinicDayBounds(dateString, timezone = 'Africa/Cairo') {
  const tempDate = new Date(`${dateString}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(tempDate);
  const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+02:00';
  
  let offsetString = tzPart.replace('GMT', '');
  if (!offsetString.includes(':')) {
      offsetString += ':00';
  }
  offsetString = offsetString.startsWith('+') || offsetString.startsWith('-') ? offsetString : '+' + offsetString;
  if (offsetString.length === 5) {
      offsetString = offsetString.substring(0, 1) + '0' + offsetString.substring(1); // e.g. +2:00 -> +02:00
  }
  
  const start = new Date(`${dateString}T00:00:00.000${offsetString}`);
  const end = new Date(`${dateString}T23:59:59.999${offsetString}`);
  
  return { start, end };
}

function getClinicDayBoundsRobust(dateString, timezone = 'Africa/Cairo') {
  const [year, month, day] = dateString.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false
  });
  const localHour = parseInt(formatter.format(utcDate), 10);
  const offsetHours = localHour - 12;
  const startUtc = new Date(Date.UTC(year, month - 1, day, -offsetHours, 0, 0, 0));
  const endUtc = new Date(Date.UTC(year, month - 1, day, 23 - offsetHours, 59, 59, 999));
  return { start: startUtc, end: endUtc };
}

console.log('Testing timezone offset logic...');
try {
  const res1 = getClinicDayBoundsRobust('2026-07-12'); // Summer time (likely UTC+3)
  console.log('Robust 2026-07-12 bounds:', res1);
  const res2 = getClinicDayBoundsRobust('2026-01-15'); // Winter time (likely UTC+2)
  console.log('Robust 2026-01-15 bounds:', res2);
} catch (e) {
  console.error('Failed:', e.message);
}
