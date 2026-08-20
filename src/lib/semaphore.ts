import { Semaforo } from "../types";

export function getSemaphore(value: number | null): Semaforo {
  if (value === null) {
    return { estado: "gris", label: "No aplica", className: "badge-gray" };
  }
  if (value >= 0.75) return { estado: "verde", label: "Cumple", className: "badge-green" };
  if (value >= 0.5) return { estado: "amarillo", label: "Modificar", className: "badge-yellow" };
  if (value >= 0.25) return { estado: "naranjo", label: "Recopilar", className: "badge-orange" };
  return { estado: "rojo", label: "Critico", className: "badge-red" };
}

export function formatPct(value: number | null) {
  if (value === null) return "NA";
  return `${Math.round(value * 100)}%`;
}
