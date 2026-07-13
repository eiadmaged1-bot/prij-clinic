import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, copyFile, mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import type { StoredDocument } from "./document-storage.types";

const MAGIC = Buffer.from("PRIJDOC1", "ascii");
const VERSION = 1;

@Injectable()
export class LocalEncryptedStorageService {
  async writeQuarantine(plaintext: Buffer): Promise<StoredDocument> {
    const { key, keyId } = encryptionConfig();
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, nonce);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const envelope = Buffer.concat([MAGIC, Buffer.from([VERSION]), nonce, cipher.getAuthTag(), ciphertext]);
    const storageKey = `quarantine/${randomUUID()}.pdoc`;
    const path = this.pathFor(storageKey);
    await mkdir(resolve(path, ".."), { recursive: true });
    const handle = await open(path, "wx", 0o600);
    try { await handle.writeFile(envelope); await handle.sync(); } finally { await handle.close(); }
    return { storageKey, encryptionVersion: VERSION, encryptionKeyId: keyId, sizeBytes: plaintext.length };
  }

  async validateAndPromote(quarantineKey: string): Promise<string> {
    if (!quarantineKey.startsWith("quarantine/")) throw new BadRequestException({ code: "DOCUMENT_QUARANTINED", message: "Invalid quarantine state." });
    const promotedKey = `promoted/${randomUUID()}.pdoc`;
    const from = this.pathFor(quarantineKey); const to = this.pathFor(promotedKey);
    await mkdir(resolve(to, ".."), { recursive: true });
    try { await rename(from, to); } catch { await copyFile(from, to, constants.COPYFILE_EXCL); const h = await open(to, "r"); try { await h.sync(); } finally { await h.close(); } await rm(from); }
    return promotedKey;
  }

  async readAuthorized(storageKey: string, encryptionKeyId?: string | null): Promise<Buffer> {
    if (!storageKey.startsWith("promoted/")) throw new BadRequestException({ code: "DOCUMENT_NOT_READY", message: "Document is not ready." });
    try {
      const envelope = await readFile(this.pathFor(storageKey));
      if (!envelope.subarray(0, MAGIC.length).equals(MAGIC) || envelope[MAGIC.length] !== VERSION) throw new Error("invalid envelope");
      const { key } = encryptionConfig(encryptionKeyId ?? undefined); const nonceStart = MAGIC.length + 1;
      const decipher = createDecipheriv("aes-256-gcm", key, envelope.subarray(nonceStart, nonceStart + 12));
      decipher.setAuthTag(envelope.subarray(nonceStart + 12, nonceStart + 28));
      return Buffer.concat([decipher.update(envelope.subarray(nonceStart + 28)), decipher.final()]);
    } catch { throw new ServiceUnavailableException({ code: "DOCUMENT_DECRYPTION_FAILED", message: "Document could not be read securely." }); }
  }

  async deleteQuarantine(storageKey: string) { if (storageKey.startsWith("quarantine/")) await rm(this.pathFor(storageKey), { force: true }); }
  async exists(storageKey: string) { try { await access(this.pathFor(storageKey)); return true; } catch { return false; } }

  root() { return resolve(process.env.PATIENT_DOCUMENT_STORAGE_ROOT || join(process.cwd(), "storage", "patient-documents-secure")); }
  pathFor(storageKey: string) {
    if (!/^(quarantine|promoted|orphan)\/[0-9a-f-]+\.pdoc$/i.test(storageKey)) throw new BadRequestException("Unsafe document storage key.");
    const root = this.root(); const path = resolve(root, storageKey); const rel = relative(root, path);
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new BadRequestException("Unsafe document storage key.");
    return path;
  }
}

function encryptionConfig(requestedKeyId?: string) {
  const encoded = process.env.PATIENT_DOCUMENT_ENCRYPTION_KEY; const keyId = process.env.PATIENT_DOCUMENT_ENCRYPTION_KEY_ID;
  if (!encoded || !keyId) throw new ServiceUnavailableException("Patient document encryption is not configured.");
  let selected = encoded;
  if (requestedKeyId && requestedKeyId !== keyId) {
    try {
      const keyring = JSON.parse(process.env.PATIENT_DOCUMENT_DECRYPTION_KEYS_JSON || "{}") as Record<string, string>;
      selected = keyring[requestedKeyId] ?? "";
    } catch { throw new ServiceUnavailableException("Patient document encryption configuration is invalid."); }
  }
  const key = Buffer.from(selected, "base64");
  if (key.length !== 32) throw new ServiceUnavailableException("Patient document encryption configuration is invalid.");
  return { key, keyId: requestedKeyId ?? keyId };
}
