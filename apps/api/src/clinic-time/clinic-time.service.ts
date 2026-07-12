import { Injectable } from "@nestjs/common";

@Injectable()
export class ClinicTimeService {
  private readonly timezone = "Africa/Cairo";

  /**
   * Get the current date or provided date as a timezone-adjusted string (YYYY-MM-DD).
   */
  getClinicDate(date = new Date()): string {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: this.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    
    return formatter.format(date);
  }

  /**
   * Get the start and end of the day in UTC, based on the clinic's local midnight.
   */
  getClinicDayBounds(dateString: string): { start: Date; end: Date } {
    const tempDate = new Date(`${dateString}T12:00:00Z`);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: this.timezone,
      timeZoneName: "shortOffset"
    });
    const parts = formatter.formatToParts(tempDate);
    const tzPart = parts.find(p => p.type === "timeZoneName")?.value || "GMT+02:00";
    
    let offsetString = tzPart.replace("GMT", "");
    if (!offsetString.includes(":")) {
        offsetString += ":00";
    }
    offsetString = offsetString.startsWith("+") || offsetString.startsWith("-") ? offsetString : "+" + offsetString;
    if (offsetString.length === 5) {
        offsetString = offsetString.substring(0, 1) + "0" + offsetString.substring(1); // e.g. +2:00 -> +02:00
    }
    
    const start = new Date(`${dateString}T00:00:00.000${offsetString}`);
    const end = new Date(`${dateString}T23:59:59.999${offsetString}`);
    
    return { start, end };
  }
}