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
    const [year, month, day] = dateString.split("-").map(Number);
    // 12:00 UTC falls on the same calendar day globally (except extreme edges)
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: this.timezone,
      hour: "numeric",
      hour12: false
    });
    
    // The local hour at 12:00 UTC (e.g., 14 for UTC+2, 15 for UTC+3)
    const localHourStr = formatter.format(utcDate);
    const localHour = parseInt(localHourStr, 10);
    
    // Calculate exact offset in hours from 12:00 UTC
    const offsetHours = localHour - 12;
    
    // Midnight local is (00:00 - offset UTC)
    const start = new Date(Date.UTC(year, month - 1, day, -offsetHours, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day, 23 - offsetHours, 59, 59, 999));
    
    return { start, end };
  }
}