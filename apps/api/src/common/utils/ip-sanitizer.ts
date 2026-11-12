import net from "node:net";

/**
 * Validates and normalizes request IP strings before inserting into PostgreSQL INET columns.
 * Prevents `22P02` syntax failures from comma-separated headers or invalid tokens.
 */
export function sanitizeIpAddress(rawIp: string | undefined | null): string | null {
  if (!rawIp || typeof rawIp !== "string") {
    return null;
  }
  const firstSegment = rawIp.split(",")[0]?.trim();
  if (!firstSegment) {
    return null;
  }
  const normalized = firstSegment.startsWith("::ffff:")
    ? firstSegment.slice(7)
    : firstSegment;
  return net.isIP(normalized) !== 0 ? normalized : null;
}
