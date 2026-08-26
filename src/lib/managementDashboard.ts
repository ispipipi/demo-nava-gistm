import { averageCumplimiento, getCriterionGroupSummary, getProjectPct } from "./aggregations";
import type { Brecha, Evidencia, Proyecto } from "../types";

export type WarningStatus = "vencida" | "proxima";

export type ManagementWarning = {
  id: string;
  criterio: string;
  evidenciaId: number;
  evidencia: string;
  owner: string;
  plan: string;
  dueDate: string;
  daysToDue: number;
  status: WarningStatus;
};

export type DocumentOwnerSummary = {
  owner: string;
  total: number;
  disponibles: number;
  pendientes: number;
  noAplica: number;
  pctPromedio: number | null;
};

export type ProgressPoint = {
  label: string;
  expected: number;
  real: number | null;
};

export type ManagementInsights = {
  totalPct: number | null;
  expectedPct: number;
  gapPct: number | null;
  openBrechas: number;
  overdueCount: number;
  upcomingCount: number;
  pendingDocuments: number;
  warnings: ManagementWarning[];
  documentOwners: DocumentOwnerSummary[];
  progressCurve: ProgressPoint[];
  weakCriteria: Array<{ id: string; nombre: string; pct: number | null; abiertas: number }>;
};

const OPEN_PLANS = new Set(["Actualizar", "Modificar", "Recopilar/Elaborar", "No cumple", "Cumple con compromiso", "Cumple con plan"]);

const OWNER_BY_TYPE: Record<string, string> = {
  "ADM/RRHH": "Administracion y RRHH",
  GOB: "Gobernanza",
  POL: "Politicas y procedimientos",
  "S&A": "Seguridad y assurance",
  TEC: "Equipo tecnico",
  TKB: "Base de conocimiento"
};

const MONTH_LABELS = ["Ene", "Mar", "May", "Jul", "Sep", "Dic"];

function openBrechas(brechas: Brecha[]) {
  return brechas.filter((brecha) => brecha.plan !== null && OPEN_PLANS.has(brecha.plan));
}

function parseDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: Date, to: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.ceil((end - start) / dayMs);
}

function getOwner(evidencia?: Evidencia, brecha?: Brecha) {
  return brecha?.responsableBrecha || evidencia?.responsable || OWNER_BY_TYPE[evidencia?.tipo ?? ""] || "Sin responsable";
}

function getDemoDueDate(today: Date, brecha: Brecha, index: number) {
  if (brecha.fechaCompromiso) return brecha.fechaCompromiso;
  const root = Number(String(brecha.criterio).split(".")[0]) || 1;
  const offset = ((brecha.evidenciaId * 7 + root * 11 + index * 5) % 45) - 14;
  return toIsoDate(addDays(today, offset));
}

function buildProgressCurve(project: Proyecto, totalPct: number | null, today: Date) {
  const start = parseDate(project.fechaEvaluacion) ?? new Date(today.getFullYear(), 0, 30);
  const end = new Date(start.getFullYear(), 11, 30);
  const totalDays = Math.max(1, daysBetween(start, end));
  const currentExpected = Math.min(1, Math.max(0, daysBetween(start, today) / totalDays));
  const realCurrent = totalPct ?? 0;

  return MONTH_LABELS.map((label, index) => {
    const pointDate = new Date(start.getFullYear(), [0, 2, 4, 6, 8, 11][index], 30);
    const expected = Math.min(1, Math.max(0, daysBetween(start, pointDate) / totalDays));
    const isPast = pointDate.getTime() <= today.getTime();
    const real =
      isPast || index === 0
        ? Math.min(1, realCurrent * Math.pow(currentExpected === 0 ? 0 : expected / currentExpected, 1.08))
        : null;
    return {
      label,
      expected,
      real: index === 0 ? 0 : real
    };
  });
}

function buildDocumentOwners(project: Proyecto): DocumentOwnerSummary[] {
  const groups = new Map<string, Evidencia[]>();
  project.evidencias.forEach((evidencia) => {
    const owner = getOwner(evidencia);
    const current = groups.get(owner) ?? [];
    current.push(evidencia);
    groups.set(owner, current);
  });

  const rows: DocumentOwnerSummary[] = [];
  groups.forEach((evidencias, owner) => {
    const evidenceIds = new Set(evidencias.map((evidencia) => evidencia.id));
    const brechas = project.brechas.filter((brecha) => evidenceIds.has(brecha.evidenciaId));
    rows.push({
      owner,
      total: evidencias.length,
      disponibles: evidencias.filter((evidencia) => evidencia.disponible === "Si").length,
      pendientes: evidencias.filter((evidencia) => evidencia.disponible === "No" || evidencia.disponible === "").length,
      noAplica: evidencias.filter((evidencia) => evidencia.disponible === "NA").length,
      pctPromedio: averageCumplimiento(brechas.map((brecha) => brecha.cumplimiento))
    });
  });

  return rows.sort((a, b) => b.pendientes - a.pendientes || a.owner.localeCompare(b.owner, "es"));
}

export function getManagementInsights(project: Proyecto, now = new Date()): ManagementInsights {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const evidenciasById = new Map(project.evidencias.map((evidencia) => [evidencia.id, evidencia]));
  const open = openBrechas(project.brechas);
  const warnings: ManagementWarning[] = [];

  open.forEach((brecha, index) => {
    const dueDate = getDemoDueDate(today, brecha, index);
    const parsed = parseDate(dueDate);
    if (!parsed) return;
    const daysToDue = daysBetween(today, parsed);
    if (daysToDue > 21) return;
    const evidencia = evidenciasById.get(brecha.evidenciaId);
    warnings.push({
      id: `${brecha.evidenciaId}-${brecha.criterio}`,
      criterio: brecha.criterio,
      evidenciaId: brecha.evidenciaId,
      evidencia: evidencia?.descripcion ?? brecha.documento ?? "Evidencia sin nombre",
      owner: getOwner(evidencia, brecha),
      plan: brecha.plan ?? "Sin plan",
      dueDate,
      daysToDue,
      status: daysToDue < 0 ? "vencida" : "proxima"
    });
  });

  warnings.sort((a, b) => a.daysToDue - b.daysToDue);

  const totalPct = getProjectPct(project.brechas);
  const progressCurve = buildProgressCurve(project, totalPct, today);
  const start = parseDate(project.fechaEvaluacion) ?? new Date(today.getFullYear(), 0, 30);
  const end = new Date(start.getFullYear(), 11, 30);
  const expectedPct = Math.min(1, Math.max(0, daysBetween(start, today) / Math.max(1, daysBetween(start, end))));
  const groups = getCriterionGroupSummary(project.evidencias, project.brechas);
  const visibleWarnings = warnings.slice(0, 9);

  return {
    totalPct,
    expectedPct,
    gapPct: totalPct === null ? null : totalPct - expectedPct,
    openBrechas: open.length,
    overdueCount: visibleWarnings.filter((warning) => warning.status === "vencida").length,
    upcomingCount: visibleWarnings.filter((warning) => warning.status === "proxima").length,
    pendingDocuments: project.evidencias.filter((evidencia) => evidencia.disponible === "No" || evidencia.disponible === "").length,
    warnings: visibleWarnings,
    documentOwners: buildDocumentOwners(project),
    progressCurve,
    weakCriteria: [...groups]
      .sort((a, b) => (a.pctPromedio ?? 1) - (b.pctPromedio ?? 1))
      .slice(0, 5)
      .map((group) => ({ id: group.id, nombre: group.nombre, pct: group.pctPromedio, abiertas: group.brechasAbiertas }))
  };
}
