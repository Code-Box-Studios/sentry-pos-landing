import "server-only";
import { apiFetch } from "./fetch";
export interface MediaAsset {
  url: string | null;
  configured: boolean;
  expiresIn: number;
}
export type MediaKind = "business" | "product";
function path(kind: MediaKind, id: string) {
  return kind === "business" ? `/portal/businesses/${id}/logo` : `/portal/products/${id}/image`;
}
export const getMedia = (kind: MediaKind, id: string) => apiFetch<MediaAsset>(path(kind, id));
export const uploadMedia = (kind: MediaKind, id: string, body: FormData) =>
  apiFetch<MediaAsset>(path(kind, id), { method: "POST", body });
export const removeMedia = (kind: MediaKind, id: string) =>
  apiFetch<MediaAsset>(path(kind, id), { method: "DELETE" });
