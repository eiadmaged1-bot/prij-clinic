import { BadRequestException, Injectable } from "@nestjs/common";

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
    const parts = dateString.split("-").map(Number);
    if (parts.length !== 3 || parts.some(value => !Number.isInteger(value))) {
      throw new BadRequestException("Invalid clinic date.");
    }

    const [year, month, day] = parts as [number, number, number];
    if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) {
      throw new BadRequestException("Invalid clinic date.");
    }

    const start = this.localMidnightUtc(year, month, day);
    const followingDate = new Date(Date.UTC(year, month - 1, day + 1));
    const nextDayStart = this.localMidnightUtc(
      followingDate.getUTCFullYear(),
      followingDate.getUTCMonth() + 1,
      followingDate.getUTCDate()
    );

    // Preserve the public inclusive `end` contract while deriving it from the
    // exclusive next-day boundary so DST changes cannot create gaps/overlaps.
    return { start, end: new Date(nextDayStart.getTime() - 1) };
  }

  private localMidnightUtc(year: number, month: number, day: number): Date {
    // Noon UTC is safely within the requested Cairo calendar date and allows
    // Intl to provide the offset in effect for that date.
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12));
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: this.timezone,
      timeZoneName: "shortOffset"
    });
    const offsetLabel = formatter.formatToParts(utcDate).find(part => part.type === "timeZoneName")?.value;
    const match = /^GMT(?<sign>[+-])(?<hours>\d{1,2})(?::(?<minutes>\d{2}))?$/.exec(offsetLabel ?? "");
    if (!match?.groups) {
      throw new BadRequestException("Clinic timezone is unavailable.");
    }
    const direction = match.groups.sign === "+" ? 1 : -1;
    const offsetMinutes = direction * (Number(match.groups.hours) * 60 + Number(match.groups.minutes ?? 0));
    return new Date(Date.UTC(year, month - 1, day) - offsetMinutes * 60_000);
  }
}
