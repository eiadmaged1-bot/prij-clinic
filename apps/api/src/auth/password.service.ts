import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

@Injectable()
export class PasswordService {
  async hash(password: string) {
    const salt = randomBytes(16).toString("base64url");
    const key = (await scrypt(password, salt, 64)) as Buffer;

    return `scrypt:16384:8:1:${salt}:${key.toString("base64url")}`;
  }

  async verify(password: string, storedHash: string | null | undefined) {
    if (!storedHash) {
      return false;
    }

    const [algorithm, , , , salt, expected] = storedHash.split(":");

    if (algorithm !== "scrypt" || !salt || !expected) {
      return false;
    }

    const actualKey = (await scrypt(password, salt, 64)) as Buffer;
    const expectedKey = Buffer.from(expected, "base64url");

    if (actualKey.length !== expectedKey.length) {
      return false;
    }

    return timingSafeEqual(actualKey, expectedKey);
  }
}
