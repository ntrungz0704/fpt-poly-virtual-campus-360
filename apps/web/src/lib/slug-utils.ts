/**
 * Utility to generate SEO-friendly slugs and automatic image paths from Vietnamese titles/names.
 */
export function slugifyVietnamese(input: string): string {
  if (!input) return "";
  let str = input.toLowerCase().trim();

  // Normalize accented characters
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Replace specific Vietnamese characters
  str = str.replace(/[đĐ]/g, "d");

  // Remove invalid chars
  str = str.replace(/[^a-z0-9 -]/g, "");

  // Collapse whitespace and dashes
  str = str.replace(/\s+/g, "-").replace(/-+/g, "-");

  // Trim leading/trailing dashes
  return str.replace(/^-+|-+$/g, "");
}

export function resolveAutoImagePath(
  slugOrTitle: string,
  type: "location" | "panorama" | "news" = "location",
): string {
  const cleanSlug = slugifyVietnamese(slugOrTitle);
  if (!cleanSlug) {
    return "/images/locations/building-innovation.jpg";
  }

  switch (type) {
    case "panorama":
      return `/images/panoramas/${cleanSlug}-360.jpg`;
    case "news":
      return `/images/news/${cleanSlug}.jpg`;
    case "location":
    default:
      return `/images/locations/${cleanSlug}.jpg`;
  }
}
