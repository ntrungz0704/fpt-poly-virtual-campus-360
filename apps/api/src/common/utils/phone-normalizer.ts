/**
 * Deterministic E.164 / Vietnam phone normalizer (OD-04).
 * Converts inputs such as "0901 234 567", "84901234567", "(+84) 90-123-4567"
 * into canonical "+84901234567" before uniqueness checks, persistence, and login.
 */
export function tryNormalizePhoneToE164(rawInput: string | null | undefined): string | null {
  if (typeof rawInput !== "string") {
    return null;
  }
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return null;
  }

  // Strip common formatting punctuation only; reject any alphabetic characters immediately.
  if (/[a-zA-Z]/.test(trimmed)) {
    return null;
  }
  const compact = trimmed.replace(/[\s().-]+/g, "");
  if (!compact) {
    return null;
  }

  // Reject misplaced '+' (must appear only at start if present)
  if (compact.includes("+") && !compact.startsWith("+")) {
    return null;
  }
  const withoutPlus = compact.startsWith("+") ? compact.slice(1) : compact;
  if (!/^\d+$/.test(withoutPlus)) {
    return null;
  }

  let e164Digits: string;
  if (compact.startsWith("+")) {
    // Handle mistaken "+0..." or standard "+84..." / "+<country>"
    if (withoutPlus.startsWith("0")) {
      return null;
    }
    e164Digits = withoutPlus;
  } else if (withoutPlus.startsWith("00")) {
    const intl = withoutPlus.slice(2);
    if (!intl || intl.startsWith("0")) {
      return null;
    }
    e164Digits = intl;
  } else if (withoutPlus.startsWith("0")) {
    // Vietnam national format: leading 0 followed by 9 or 10 non-zero digits
    const subscriber = withoutPlus.slice(1);
    if (subscriber.length < 9 || subscriber.length > 10 || subscriber.startsWith("0")) {
      return null;
    }
    e164Digits = `84${subscriber}`;
  } else if (withoutPlus.startsWith("84")) {
    const subscriber = withoutPlus.slice(2);
    if (subscriber.length < 9 || subscriber.length > 10 || subscriber.startsWith("0")) {
      return null;
    }
    e164Digits = withoutPlus;
  } else {
    return null;
  }

  // Standard E.164 requires 8..15 total digits and non-zero leading digit
  if (e164Digits.length < 8 || e164Digits.length > 15 || e164Digits.startsWith("0")) {
    return null;
  }

  // Additional check for +84 numbers to guarantee valid VN subscriber length (9 or 10 digits)
  if (e164Digits.startsWith("84")) {
    const vnSub = e164Digits.slice(2);
    if (vnSub.length < 9 || vnSub.length > 10 || vnSub.startsWith("0")) {
      return null;
    }
  }

  return `+${e164Digits}`;
}

export function normalizeEmailLower(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}
