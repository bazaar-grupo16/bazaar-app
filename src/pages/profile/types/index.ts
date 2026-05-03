export type Tab = "publicaciones" | "favoritos";
export type PublicationsSubTab = "activas" | "inactivas" | "sin-stock";

export interface Stat {
  label: string;
  value: string;
  color: string;
}
