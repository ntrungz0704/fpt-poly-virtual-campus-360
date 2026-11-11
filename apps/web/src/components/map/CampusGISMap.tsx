"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  BuildingCode,
  CAMPUS_BUILDINGS,
  CampusBuildingItem,
  computeRouteDistanceMeters,
  formatDistanceEstimate,
  haversineDistanceMeters,
  QTSC_LANDMARKS,
  QTSC_ORIGIN_POINT,
} from "@/data/campus-data";
import { SearchInput } from "@/components/ui";
import { BuildingDetailDrawer } from "./BuildingDetailDrawer";
import {
  buildBuildingMarkerHtml,
  buildFixNearPopupHtml,
  buildLandmarkMarkerHtml,
  buildOriginMarkerHtml,
  getBuildingTheme,
} from "./qtscLeafletIcons";

type FilterCategory = "all" | "academic" | "lab" | "facility";

const CATEGORY_FILTERS: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "academic", label: "Giảng đường" },
  { id: "lab", label: "Lab & Studio" },
  { id: "facility", label: "Thể thao" },
];

const DEFAULT_BUILDING_CODE: BuildingCode = "INNOVATION";

function resolveBuildingCode(raw?: string): BuildingCode | null {
  if (!raw) return null;
  const norm = raw.trim().toUpperCase();
  if (norm === "INNOVATION" || norm === "LO24") return "INNOVATION";
  if (norm === "TOA-T" || norm === "T" || norm === "TOAT") return "TOA-T";
  if (norm === "TOA-F" || norm === "F" || norm === "TOAF") return "TOA-F";
  if (norm === "TOA-P" || norm === "P" || norm === "TOAP") return "TOA-P";
  if (norm === "SPORTS" || norm === "SPORT" || norm === "THE-THAO") return "SPORTS";
  return null;
}

export function CampusGISMap({
  initialBuildingParam,
}: {
  initialBuildingParam?: string;
}) {
  const router = useRouter();
  const initialResolved = resolveBuildingCode(initialBuildingParam);

  const [selectedCode, setSelectedCode] = useState<BuildingCode>(
    initialResolved ?? DEFAULT_BUILDING_CODE,
  );
  const [drawerBuilding, setDrawerBuilding] = useState<CampusBuildingItem | null>(
    null,
  );
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [gpsOrigin, setGpsOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "locating" | "active" | "fallback"
  >("idle");
  const [gpsNote, setGpsNote] = useState<string | null>(null);
  const [zoomDisplay, setZoomDisplay] = useState<number>(17);
  const [mapReady, setMapReady] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof LeafletNS | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const layersGroupRef = useRef<LeafletNS.LayerGroup | null>(null);
  const buildingMarkersRef = useRef<Map<BuildingCode, LeafletNS.Marker>>(new Map());
  const routeLayerRef = useRef<LeafletNS.Polyline | null>(null);

  const filteredBuildings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CAMPUS_BUILDINGS.filter((b) => {
      const catOk = activeCategory === "all" || b.category === activeCategory;
      const textOk =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.addressNote.toLowerCase().includes(q);
      return catOk && textOk;
    });
  }, [activeCategory, searchQuery]);

  const activeBuilding = useMemo(() => {
    if (filteredBuildings.length > 0) {
      return (
        filteredBuildings.find((b) => b.code === selectedCode) ??
        filteredBuildings[0]
      );
    }
    return (
      CAMPUS_BUILDINGS.find((b) => b.code === selectedCode) ??
      CAMPUS_BUILDINGS[0]
    );
  }, [filteredBuildings, selectedCode]);

  const activeOrigin = useMemo(() => {
    if (gpsStatus === "active" && gpsOrigin) {
      return {
        lat: gpsOrigin.lat,
        lng: gpsOrigin.lng,
        label: "Vị trí GPS của bạn",
        usingGps: true,
      };
    }
    return {
      lat: QTSC_ORIGIN_POINT.lat,
      lng: QTSC_ORIGIN_POINT.lng,
      label: QTSC_ORIGIN_POINT.label,
      usingGps: false,
    };
  }, [gpsOrigin, gpsStatus]);

  const activeRoutePoints = useMemo<[number, number][]>(() => {
    if (activeOrigin.usingGps) {
      return [
        [activeOrigin.lat, activeOrigin.lng],
        [activeBuilding.lat, activeBuilding.lng],
      ];
    }
    return activeBuilding.routeWaypoints;
  }, [activeBuilding, activeOrigin]);

  const distanceInfo = useMemo(() => {
    const meters = activeOrigin.usingGps
      ? Math.round(
          haversineDistanceMeters(
            { lat: activeOrigin.lat, lng: activeOrigin.lng },
            { lat: activeBuilding.lat, lng: activeBuilding.lng },
          ),
        )
      : computeRouteDistanceMeters(activeRoutePoints);
    return formatDistanceEstimate(meters, activeOrigin.usingGps);
  }, [activeBuilding.lat, activeBuilding.lng, activeOrigin, activeRoutePoints]);

  const fitCampusBounds = useCallback(
    (includeGpsOrigin = false) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;

      const points: [number, number][] = [
        [QTSC_ORIGIN_POINT.lat, QTSC_ORIGIN_POINT.lng],
        ...CAMPUS_BUILDINGS.map((b): [number, number] => [b.lat, b.lng]),
      ];
      if (includeGpsOrigin && gpsOrigin) {
        points.push([gpsOrigin.lat, gpsOrigin.lng]);
      }
      const bounds = L.latLngBounds(points);
      const w = window.innerWidth;
      map.fitBounds(bounds, {
        paddingTopLeft: w >= 1024 ? [290, 44] : w >= 768 ? [120, 40] : [28, 32],
        paddingBottomRight: w >= 1024 ? [44, 52] : [28, 38],
        maxZoom: 17,
      });
    },
    [gpsOrigin],
  );

  // Initialize Leaflet map instance (client-only)
  useEffect(() => {
    let cancelled = false;
    const container = mapContainerRef.current;
    const markersMap = buildingMarkersRef.current;
    if (!container || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !container) return;

      leafletRef.current = L;

      const map = L.map(container, {
        center: [10.8531, 106.628],
        zoom: 17,
        minZoom: 14,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const group = L.layerGroup().addTo(map);
      layersGroupRef.current = group;
      mapRef.current = map;

      map.on("zoomend", () => {
        setZoomDisplay(map.getZoom());
      });

      const initialPoints: [number, number][] = [
        [QTSC_ORIGIN_POINT.lat, QTSC_ORIGIN_POINT.lng],
        ...CAMPUS_BUILDINGS.map((b): [number, number] => [b.lat, b.lng]),
      ];
      const w = window.innerWidth;
      map.fitBounds(L.latLngBounds(initialPoints), {
        paddingTopLeft: w >= 1024 ? [290, 44] : w >= 768 ? [120, 40] : [28, 32],
        paddingBottomRight: w >= 1024 ? [44, 52] : [28, 38],
        maxZoom: 17,
      });
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersGroupRef.current = null;
        routeLayerRef.current = null;
        markersMap.clear();
      }
    };
  }, []);

  // Re-render markers, landmarks, dashed route polyline & desktop FixNear popup reactively
  useEffect(() => {
    if (!mapReady) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    const group = layersGroupRef.current;
    if (!L || !map || !group) return;

    group.clearLayers();
    buildingMarkersRef.current.clear();

    // 1. Subtle QTSC boundary footprint outline
    const qtscPerimeter: [number, number][] = [
      [10.8549, 106.6253],
      [10.8554, 106.6311],
      [10.8517, 106.6309],
      [10.8515, 106.6267],
    ];
    L.polygon(qtscPerimeter, {
      color: "#f97316",
      weight: 1.5,
      opacity: 0.4,
      dashArray: "6 6",
      fillColor: "#fff7ed",
      fillOpacity: 0.14,
      interactive: false,
    }).addTo(group);

    // 2. Traffic landmarks (e.g. Cầu vượt Quang Trung)
    for (const lm of QTSC_LANDMARKS) {
      L.marker([lm.lat, lm.lng], {
        icon: L.divIcon({
          className: "qtsc-div-icon",
          html: buildLandmarkMarkerHtml(lm),
          iconSize: [0, 0],
        }),
        interactive: false,
        zIndexOffset: -50,
      }).addTo(group);
    }

    // 3. Origin marker (Cổng chính QTSC or Live GPS user dot)
    L.marker([activeOrigin.lat, activeOrigin.lng], {
      icon: L.divIcon({
        className: "qtsc-div-icon",
        html: buildOriginMarkerHtml(activeOrigin.label, activeOrigin.usingGps),
        iconSize: [0, 0],
      }),
      zIndexOffset: 250,
    }).addTo(group);

    // 4. Dashed blue route polyline (FixNear style)
    const poly = L.polyline(activeRoutePoints, {
      color: "#2563eb",
      weight: 4,
      opacity: 0.85,
      dashArray: "8, 8",
      lineCap: "round",
      lineJoin: "round",
    }).addTo(group);
    routeLayerRef.current = poly;

    // 5. Separated building markers with distinct icons
    for (const b of filteredBuildings) {
      const isSelected = b.code === activeBuilding.code;
      const marker = L.marker([b.lat, b.lng], {
        icon: L.divIcon({
          className: "qtsc-div-icon",
          html: buildBuildingMarkerHtml(b, isSelected),
          iconSize: [0, 0],
        }),
        zIndexOffset: isSelected ? 600 : 300,
      }).addTo(group);

      const bMeters = activeOrigin.usingGps
        ? Math.round(
            haversineDistanceMeters(
              { lat: activeOrigin.lat, lng: activeOrigin.lng },
              { lat: b.lat, lng: b.lng },
            ),
          )
        : computeRouteDistanceMeters(b.routeWaypoints);
      const bDistance = formatDistanceEstimate(bMeters, activeOrigin.usingGps);

      const popupHtml = buildFixNearPopupHtml(
        b,
        bDistance.combinedText,
        activeOrigin.label,
      );
      marker.bindPopup(popupHtml, {
        className: "qtsc-leaflet-popup",
        offset: [0, -24],
        maxWidth: 280,
        closeButton: true,
        autoPan: true,
      });

      marker.on("click", () => {
        setSelectedCode(b.code);
      });

      marker.on("popupopen", (ev) => {
        const el = ev.popup.getElement();
        if (!el) return;
        const clickHandler = (targetEv: Event) => {
          const btn = (targetEv.target as HTMLElement | null)?.closest(
            "[data-map-action]",
          ) as HTMLElement | null;
          if (!btn) return;
          const action = btn.getAttribute("data-map-action");
          if (action === "tour") {
            router.push(`/campus?scene=${encodeURIComponent(b.defaultSceneId)}`);
          } else if (action === "details") {
            setDrawerBuilding(b);
          }
        };
        el.onclick = clickHandler;
      });

      buildingMarkersRef.current.set(b.code, marker);
    }

    // Auto-open popup for active marker on desktop (>= 1024px) for FixNear look
    if (window.innerWidth >= 1024) {
      const activeMarker = buildingMarkersRef.current.get(activeBuilding.code);
      if (activeMarker) {
        activeMarker.openPopup();
      }
    }
  }, [
    activeBuilding,
    activeOrigin,
    activeRoutePoints,
    filteredBuildings,
    mapReady,
    router,
  ]);

  const handleRequestGps = () => {
    if (gpsStatus === "active") {
      setGpsStatus("idle");
      setGpsOrigin(null);
      setGpsNote("Đã chuyển điểm xuất phát về Cổng chính QTSC.");
      fitCampusBounds(false);
      return;
    }

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGpsStatus("fallback");
      setGpsNote("Trình duyệt chưa hỗ trợ GPS — đang đo từ Cổng chính QTSC.");
      return;
    }

    setGpsStatus("locating");
    setGpsNote(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextOrigin = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setGpsOrigin(nextOrigin);
        setGpsStatus("active");
        setGpsNote(null);

        const L = leafletRef.current;
        const map = mapRef.current;
        if (L && map) {
          const bounds = L.latLngBounds([
            [nextOrigin.lat, nextOrigin.lng],
            [activeBuilding.lat, activeBuilding.lng],
          ]);
          map.fitBounds(bounds, { padding: [56, 56], maxZoom: 17 });
        }
      },
      () => {
        setGpsStatus("fallback");
        setGpsNote("Chưa bật quyền GPS — đang tính lộ trình từ Cổng chính QTSC.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleSelectBuildingFromList = (building: CampusBuildingItem) => {
    setSelectedCode(building.code);
    const map = mapRef.current;
    if (map) {
      map.panTo([building.lat, building.lng], { animate: true });
    }
  };

  const activeTheme = getBuildingTheme(activeBuilding.mapIconKey);

  return (
    <section className="flex flex-col w-full h-full bg-slate-50 text-slate-900 select-auto">
      {/* FixNear-style Clean Top Status + Filter Bar */}
      <div className="shrink-0 z-20 bg-white border-b border-slate-200 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
        {/* Status Row */}
        <div className="px-3 sm:px-5 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Link
              href="/locations"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[15px]"
              >
                arrow_back
              </span>
              <span className="hidden sm:inline">Danh sách địa điểm</span>
              <span className="sm:hidden">Địa điểm</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1.5 min-w-0 text-xs">
              <span className="text-slate-500 hidden md:inline">Đang xem:</span>
              <span className="font-bold text-orange-600 truncate max-w-[180px] sm:max-w-[260px]">
                {activeBuilding.shortName}
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[13px] text-orange-500"
                >
                  location_on
                </span>
                QTSC · Quận 12
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Green Estimate Pill (FixNear inspired) */}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="hidden md:inline">
                {activeOrigin.usingGps ? "GPS của bạn" : "Từ Cổng QTSC"}:
              </span>
              <span className="font-bold text-emerald-950">
                {distanceInfo.combinedText}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRequestGps}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] sm:text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[15px] text-sky-600"
              >
                my_location
              </span>
              <span>
                {gpsStatus === "locating"
                  ? "Đang dò..."
                  : activeOrigin.usingGps
                    ? "Về Cổng QTSC"
                    : "Dùng GPS"}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Zero-Overflow Wrapping Filter Row */}
        <div className="px-3 sm:px-5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div className="w-full sm:w-72">
            <SearchInput
              placeholder="Tìm Tòa T, Tòa F, QTSC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_FILTERS.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Leaflet Interactive Street Map Stage */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-[#f1efe9]">
        <div
          ref={mapContainerRef}
          aria-label="Bản đồ tương tác FPT Polytechnic CVPM Quang Trung"
          className="w-full h-full z-0"
        />

        {gpsNote && (
          <div className="absolute top-3 left-14 right-14 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[460] flex items-center justify-between gap-2 rounded-full bg-slate-900/90 text-white px-3.5 py-1.5 text-[11px] font-medium shadow-md max-w-[340px]">
            <span className="truncate">{gpsNote}</span>
            <button
              type="button"
              onClick={() => setGpsNote(null)}
              aria-label="Đóng thông báo GPS"
              className="text-slate-300 hover:text-white shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Building Switch Pills top-right on desktop for instant jump */}
        {!drawerBuilding && (
          <div className="hidden lg:flex absolute top-3 right-3 z-[450] flex-col gap-1.5 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-lg max-w-[210px]">
            <span className="px-2 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cụm tòa nhà ({filteredBuildings.length})
            </span>
            {filteredBuildings.map((b) => {
              const isSel = b.code === activeBuilding.code;
              const t = getBuildingTheme(b.mapIconKey);
              return (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => handleSelectBuildingFromList(b)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                    isSel
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: t.bgHex }}
                  />
                  <span className="truncate">{b.shortName}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Top-Left FixNear-Style Map Zoom Controls */}
        <div className="absolute top-3 left-3 z-[450] flex flex-col bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Phóng to bản đồ"
            className="w-9 h-9 flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[19px]">
              add
            </span>
          </button>
          <div className="h-px bg-slate-200" />
          <button
            type="button"
            onClick={() => fitCampusBounds(activeOrigin.usingGps)}
            aria-label="Toàn cảnh khuôn viên QTSC"
            title="Thu gọn vừa toàn bộ QTSC"
            className="w-9 h-8 flex items-center justify-center text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Z{zoomDisplay}
          </button>
          <div className="h-px bg-slate-200" />
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Thu nhỏ bản đồ"
            className="w-9 h-9 flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[19px]">
              remove
            </span>
          </button>
        </div>

        {/* Desktop FixNear Bottom-Left Floating Card */}
        <div className="hidden md:block absolute bottom-4 left-4 z-[450] w-[332px] rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-[0_18px_40px_-14px_rgba(15,23,42,0.22)] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: activeTheme.bgHex }}
              />
              <span>Ước tính {distanceInfo.combinedText}</span>
            </span>

            <span className="text-[11px] font-semibold text-slate-400">
              {activeBuilding.code}
            </span>
          </div>

          <h2 className="mt-2.5 font-headline-sm text-[16px] font-bold leading-snug text-slate-900">
            {activeBuilding.name}
          </h2>

          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[15px] text-rose-500 shrink-0 mt-0.5"
            >
              location_on
            </span>
            <span>{activeBuilding.addressNote}</span>
          </p>

          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[14px] text-sky-600 shrink-0"
            >
              route
            </span>
            <span>
              Đường đi nét đứt từ{" "}
              <strong className="text-slate-700">{activeOrigin.label}</strong>
            </span>
          </p>

          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeBuilding.lat},${activeBuilding.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-sky-700 hover:bg-sky-50 transition-colors"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[16px]"
              >
                map
              </span>
              <span>Google Maps ↗</span>
            </a>

            <Link
              href={`/campus?scene=${encodeURIComponent(activeBuilding.defaultSceneId)}`}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-orange-500 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition-colors"
            >
              <span>Mở Tour 360°</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setDrawerBuilding(activeBuilding)}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 min-h-[34px] rounded-xl bg-slate-100 hover:bg-slate-200/80 text-[11.5px] font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[15px]"
            >
              info
            </span>
            <span>Xem thông tin phòng & ảnh tòa nhà</span>
          </button>
        </div>

        {/* Desktop Compact Legend Pill (above attribution) */}
        {!drawerBuilding && (
          <div className="hidden lg:flex absolute bottom-7 right-3 z-[450] items-center gap-3 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 px-3.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              Innovation / P
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Tòa T / F
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              Thể thao
            </span>
            <span className="inline-flex items-center gap-1.5 text-blue-700">
              <span className="w-4 border-t-2 border-dashed border-blue-600" />
              Lộ trình
            </span>
          </div>
        )}
      </div>

      {/* Mobile Dedicated Bottom Sheet Bar (Zero map/attribution overlap on 360-767px) */}
      <div className="md:hidden shrink-0 bg-white border-t border-slate-200 px-3 py-2.5 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] z-20">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeTheme.bgHex }}
              />
              <h2 className="text-xs font-bold text-slate-900 truncate">
                {activeBuilding.name}
              </h2>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 truncate">
              {activeBuilding.addressNote}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerBuilding(activeBuilding)}
            className="shrink-0 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700"
          >
            Chi tiết
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activeBuilding.lat},${activeBuilding.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 min-h-[38px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-sky-700"
          >
            <span>Google Maps ↗</span>
          </a>
          <Link
            href={`/campus?scene=${encodeURIComponent(activeBuilding.defaultSceneId)}`}
            className="inline-flex items-center justify-center gap-1 min-h-[38px] rounded-xl bg-orange-500 text-xs font-bold text-white"
          >
            <span>Mở Tour 360° →</span>
          </Link>
        </div>
      </div>

      <BuildingDetailDrawer
        building={drawerBuilding}
        distanceSummary={distanceInfo.combinedText}
        originLabel={activeOrigin.label}
        onClose={() => setDrawerBuilding(null)}
      />
    </section>
  );
}
