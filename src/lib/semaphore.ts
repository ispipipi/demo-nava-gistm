import type { Semaforo } from "../types";

export type StyledSemaforo = Semaforo & {
  icon: string;
  fg: string;
  bg: string;
  bar: string;
};

export function getSemaphore(value: number | null): StyledSemaforo {
  if (value === null) {
    return { estado: "gris", label: "No aplica", className: "badge-gray", icon: "do_not_disturb_on", fg: "#4F5A57", bg: "#ECEEEC", bar: "#B4BCB8" };
  }
  if (value >= 0.75) return { estado: "verde", label: "Cumple", className: "badge-green", icon: "check_circle", fg: "#1F6B45", bg: "#E3F1E8", bar: "#2E7D57" };
  if (value >= 0.5) return { estado: "amarillo", label: "Modificar", className: "badge-yellow", icon: "change_history", fg: "#7A5600", bg: "#FAEFCF", bar: "#A87C0C" };
  if (value >= 0.25) return { estado: "naranjo", label: "Recopilar", className: "badge-orange", icon: "pending", fg: "#9A440F", bg: "#FCE7D6", bar: "#D9661E" };
  return { estado: "rojo", label: "Crítico", className: "badge-red", icon: "error", fg: "#A8231B", bg: "#FBE3E0", bar: "#B3261E" };
}

export function formatPct(value: number | null) {
  if (value === null) return "NA";
  return `${Math.round(value * 100)}%`;
}
