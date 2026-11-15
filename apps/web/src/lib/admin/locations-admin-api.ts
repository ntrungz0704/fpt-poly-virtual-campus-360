import type { CampusLocationItem } from "@/data/campus-data";
import { apiRequest } from "../auth/api-client";

export interface AdminUpsertLocationPayload {
  name: string;
  code: string;
  buildingCode: string;
  floor?: string;
  category?: "lab" | "studio" | "common";
  shortDesc?: string;
  sceneId?: string | null;
  status?: "published" | "draft";
}

/**
 * Fetch all locations for Admin CMS.
 * GET /api/v1/admin/locations
 */
export async function fetchAdminLocations(): Promise<CampusLocationItem[]> {
  return apiRequest<CampusLocationItem[]>("/admin/locations", { auth: true });
}

/**
 * Create a new location in PostgreSQL.
 * POST /api/v1/admin/locations
 */
export async function createAdminLocation(
  payload: AdminUpsertLocationPayload,
): Promise<CampusLocationItem> {
  return apiRequest<CampusLocationItem>("/admin/locations", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

/**
 * Update an existing location in PostgreSQL.
 * PATCH /api/v1/admin/locations/:id
 */
export async function updateAdminLocation(
  id: string,
  payload: AdminUpsertLocationPayload,
): Promise<CampusLocationItem> {
  return apiRequest<CampusLocationItem>(
    `/admin/locations/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: payload,
      auth: true,
    },
  );
}

export interface BuildingStructureItem {
  code: string;
  name: string;
  floors: Array<{ id: string; code: string; name: string }>;
}

/**
 * Fetch dynamic building and floor structure from PostgreSQL.
 * GET /api/v1/admin/locations/structure
 */
export async function fetchCampusStructure(): Promise<BuildingStructureItem[]> {
  return apiRequest<BuildingStructureItem[]>("/admin/locations/structure", {
    auth: true,
  });
}

/**
 * Soft delete a location in PostgreSQL.
 * DELETE /api/v1/admin/locations/:id
 */
export async function deleteAdminLocation(
  id: string,
): Promise<{ success: boolean; id: string }> {
  return apiRequest<{ success: boolean; id: string }>(
    `/admin/locations/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}
