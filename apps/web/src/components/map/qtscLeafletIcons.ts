import type {
  CampusBuildingItem,
  CampusLandmarkItem,
  MapBuildingIconKey,
} from "@/data/campus-data";

interface IconTheme {
  bgHex: string;
  haloRgba: string;
  accentTextHex: string;
  svgInner: string;
}

const ICON_THEMES: Record<MapBuildingIconKey, IconTheme> = {
  innovation: {
    bgHex: "#f97316",
    haloRgba: "rgba(249, 115, 22, 0.28)",
    accentTextHex: "#c2410c",
    // Multi-story headquarters / innovation building icon
    svgInner: `<path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M6 12H4a2 2 0 0 0-2 2v7h4"/><path d="M18 9h2a2 2 0 0 1 2 2v10h-4"/><path d="M10 7h4"/><path d="M10 11h4"/><path d="M10 15h4"/><path d="M10 21v-3h4v3"/>`,
  },
  "it-building": {
    bgHex: "#2563eb",
    haloRgba: "rgba(37, 99, 235, 0.28)",
    accentTextHex: "#1d4ed8",
    // IT lab monitor + code terminal icon
    svgInner: `<rect width="18" height="12" x="3" y="4" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/><path d="m9.5 8.5-2 1.5 2 1.5"/><path d="m14.5 8.5 2 1.5-2 1.5"/>`,
  },
  "design-studio": {
    bgHex: "#4f46e5",
    haloRgba: "rgba(79, 70, 229, 0.28)",
    accentTextHex: "#4338ca",
    // Design palette / creative pen tool icon
    svgInner: `<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".75" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".75" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".75" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".75" fill="currentColor"/>`,
  },
  "academic-hall": {
    bgHex: "#d97706",
    haloRgba: "rgba(217, 119, 6, 0.28)",
    accentTextHex: "#b45309",
    // Academic graduation / seminar building icon
    svgInner: `<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>`,
  },
  sports: {
    bgHex: "#059669",
    haloRgba: "rgba(5, 150, 105, 0.28)",
    accentTextHex: "#047857",
    // Sports arena / cup icon
    svgInner: `<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>`,
  },
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getBuildingTheme(key: MapBuildingIconKey): IconTheme {
  return ICON_THEMES[key];
}

export function buildBuildingMarkerHtml(
  building: CampusBuildingItem,
  isSelected: boolean,
): string {
  const theme = getBuildingTheme(building.mapIconKey);
  const circleSize = isSelected ? 44 : 38;
  const iconSize = isSelected ? 21 : 18;
  const ringStyle = isSelected
    ? `box-shadow: 0 0 0 5px ${theme.haloRgba}, 0 8px 18px rgba(15, 23, 42, 0.28);`
    : `box-shadow: 0 5px 14px rgba(15, 23, 42, 0.22);`;

  const badgeBg = isSelected ? "#0f172a" : "#ffffff";
  const badgeText = isSelected ? "#ffffff" : "#0f172a";
  const badgeBorder = isSelected ? "#0f172a" : "#cbd5e1";

  return `
    <div style="width:max-content;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-58%);cursor:pointer;user-select:none;">
      <div style="
        width:${circleSize}px;
        height:${circleSize}px;
        border-radius:9999px;
        background:${theme.bgHex};
        border:3px solid #ffffff;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#ffffff;
        transition:transform 0.16s ease;
        ${ringStyle}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
          ${theme.svgInner}
        </svg>
      </div>
      <div style="
        margin-top:4px;
        padding:2px 8px;
        border-radius:9999px;
        background:${badgeBg};
        color:${badgeText};
        border:1px solid ${badgeBorder};
        font-family:var(--font-plus-jakarta-sans),Inter,system-ui,sans-serif;
        font-size:11px;
        font-weight:700;
        line-height:1.25;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(15,23,42,0.14);
      ">
        ${escapeHtml(building.shortName)}
      </div>
    </div>
  `;
}

export function buildOriginMarkerHtml(label: string, usingGps: boolean): string {
  const shortTag = usingGps ? "Vị trí của bạn" : label.includes("QTSC") ? "Cổng QTSC" : label;
  return `
    <div style="width:max-content;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);user-select:none;">
      <div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
        <div class="qtsc-origin-pulse" style="
          position:absolute;
          inset:0;
          border-radius:9999px;
          background:rgba(37, 99, 235, 0.35);
        "></div>
        <div style="
          position:relative;
          width:18px;
          height:18px;
          border-radius:9999px;
          background:#2563eb;
          border:3px solid #ffffff;
          box-shadow:0 3px 10px rgba(37, 99, 235, 0.45);
        "></div>
      </div>
      <div style="
        margin-top:2px;
        padding:2px 8px;
        border-radius:9999px;
        background:#1e3a8a;
        color:#ffffff;
        border:1px solid #93c5fd;
        font-family:Inter,system-ui,sans-serif;
        font-size:10px;
        font-weight:700;
        white-space:nowrap;
        box-shadow:0 2px 6px rgba(15,23,42,0.22);
      ">
        ${escapeHtml(shortTag)}
      </div>
    </div>
  `;
}

export function buildLandmarkMarkerHtml(landmark: CampusLandmarkItem): string {
  return `
    <div style="width:max-content;display:flex;align-items:center;gap:4px;transform:translate(-50%,-50%);padding:3px 9px;border-radius:9999px;background:rgba(255,255,255,0.92);border:1px solid #cbd5e1;color:#334155;font-family:Inter,system-ui,sans-serif;font-size:10.5px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(15,23,42,0.12);user-select:none;">
      <span style="display:inline-block;width:7px;height:7px;border-radius:9999px;background:#f97316;"></span>
      <span>${escapeHtml(landmark.label)}</span>
    </div>
  `;
}

export function buildFixNearPopupHtml(
  building: CampusBuildingItem,
  combinedDistance: string,
  originLabel: string,
): string {
  return `
    <div style="padding:12px 14px;min-width:236px;max-width:268px;font-family:var(--font-inter),Inter,system-ui,sans-serif;color:#0f172a;">
      <div style="padding-right:22px;font-family:var(--font-plus-jakarta-sans),Inter,sans-serif;font-size:14.5px;font-weight:800;line-height:1.3;color:#0f172a;">
        ${escapeHtml(building.name)}
      </div>
      <div style="margin-top:5px;font-size:12px;line-height:1.4;color:#475569;">
        ${escapeHtml(building.addressNote)}
      </div>
      <div style="margin-top:8px;font-size:12.5px;font-weight:700;color:#ea580c;">
        Ước tính: ${escapeHtml(combinedDistance)}
      </div>
      <div style="margin-top:3px;font-size:11px;color:#64748b;">
        Lộ trình từ ${escapeHtml(originLabel)} · ${escapeHtml(building.statusNote)}
      </div>
      <div style="margin-top:12px;display:flex;align-items:center;gap:8px;">
        <button
          type="button"
          data-map-action="tour"
          style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:36px;padding:6px 12px;border-radius:10px;background:#f97316;color:#ffffff;font-size:12px;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 10px rgba(249,115,22,0.28);"
        >
          <span>Mở Tour 360°</span>
          <span aria-hidden="true">↗</span>
        </button>
        <button
          type="button"
          data-map-action="details"
          style="display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:6px 12px;border-radius:10px;background:#ffffff;color:#0f172a;font-size:12px;font-weight:600;border:1px solid #cbd5e1;cursor:pointer;"
        >
          Chi tiết
        </button>
      </div>
    </div>
  `;
}
