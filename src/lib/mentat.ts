import { getAllCriteria, getCriterionDetail, getCriterionGroupSummary, getCriterionPct, getCriterionRoot, getProjectPct } from "./aggregations";
import { getCriterionLabel } from "./criterionLabels";
import { formatPct } from "./semaphore";
import { Brecha, Proyecto } from "../types";

export type MentatTableBlock = {
  type: "table";
  title: string;
  columns: string[];
  rows: string[][];
};

export type MentatBarsBlock = {
  type: "bars";
  title: string;
  valueLabel: string;
  maxValue: number;
  items: Array<{
    label: string;
    value: number;
    displayValue: string;
    fill: string;
  }>;
};

export type MentatDataBlock = MentatTableBlock | MentatBarsBlock;

export type MentatReply = {
  text: string;
  source: string;
  blocks?: MentatDataBlock[];
};

const OPEN_PLANS = new Set(["Actualizar", "Modificar", "Recopilar/Elaborar", "No cumple", "Cumple con compromiso", "Cumple con plan"]);
function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,/g, ".");
}

function openBrechas(brechas: Brecha[]) {
  return brechas.filter((brecha) => brecha.plan !== null && OPEN_PLANS.has(brecha.plan));
}

function findCriterionQuery(query: string) {
  const normalized = normalize(query);
  const detail = normalized.match(/\b(?:principio|criterio|requisito|subcriterio|punto)?\s*(\d{1,2})\.(\d{1,2})\b/);
  if (detail) return { group: detail[1], detail: `${detail[1]}.${detail[2]}` };

  const group = normalized.match(/\b(?:principio|criterio)\s+(\d{1,2})\b/) ?? normalized.match(/\bp\s*(\d{1,2})\b/) ?? normalized.match(/\bc\s*(\d{1,2})\b/);
  if (group) return { group: group[1], detail: null };

  return null;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CL").format(value);
}

function pctBars(title: string, items: Array<{ label: string; pct: number | null }>): MentatBarsBlock {
  return {
    type: "bars",
    title,
    valueLabel: "% avance",
    maxValue: 100,
    items: items.map((item) => ({
      label: item.label,
      value: Math.round((item.pct ?? 0) * 100),
      displayValue: formatPct(item.pct),
      fill: item.pct === null ? "#94a3b8" : item.pct >= 0.75 ? "#176b58" : item.pct >= 0.5 ? "#d39a23" : item.pct >= 0.25 ? "#b5651d" : "#b42a3d"
    }))
  };
}

function planRows(brechas: Brecha[]) {
  const counts = new Map<string, number>();
  brechas.forEach((brecha) => counts.set(brecha.plan ?? "Sin plan", (counts.get(brecha.plan ?? "Sin plan") ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .map(([plan, count]) => [plan, formatNumber(count)]);
}

function evidenceLookup(project: Proyecto) {
  return new Map(project.evidencias.map((evidencia) => [evidencia.id, evidencia]));
}

function breachRows(project: Proyecto, brechas: Brecha[], limit = 8) {
  const evidencias = evidenceLookup(project);
  return brechas.slice(0, limit).map((brecha) => {
    const evidencia = evidencias.get(brecha.evidenciaId);
    return [
      brecha.criterio,
      `E${String(brecha.evidenciaId).padStart(2, "0")}`,
      evidencia?.descripcion ?? brecha.documento ?? "Sin evidencia",
      formatPct(typeof brecha.cumplimiento === "number" ? brecha.cumplimiento : null),
      brecha.plan ?? "Sin plan"
    ];
  });
}

function answerCriterion(project: Proyecto, criterion: { group: string; detail: string | null }): MentatReply {
  const summaries = getCriterionGroupSummary(project.evidencias, project.brechas, project);
  const group = summaries.find((item) => item.id === criterion.group);

  if (!group) {
    return {
      text: `No encontre datos para el principio ${criterion.group}. Este proyecto tiene disponibles los principios ${summaries.map((item) => item.id).join(", ")}.`,
      source: `Mentat · ${project.nombre}`
    };
  }

  if (criterion.detail) {
    const detail = group.detalles.find((item) => item.id === criterion.detail);
    if (!detail) {
      return {
        text: `No encontre brechas asociadas al requisito ${criterion.detail}. El principio ${criterion.group} incluye: ${group.detalles.map((item) => item.id).join(", ")}.`,
        source: "Mentat · hoja Brechas identificadas"
      };
    }

    const opened = openBrechas(detail.brechas);
    return {
      text: `El requisito ${detail.id} tiene ${formatPct(detail.pctPromedio)} de avance. Registra ${formatNumber(detail.brechas.length)} brechas/fichas asociadas, de las cuales ${formatNumber(opened.length)} quedan abiertas segun el plan de accion.`,
      source: "Mentat · hoja Brechas identificadas, columna C",
      blocks: [
        pctBars(`Avance requisito ${detail.id}`, [{ label: detail.id, pct: detail.pctPromedio }]),
        {
          type: "table",
          title: `Brechas asociadas a ${detail.id}`,
          columns: ["Criterio", "Ficha", "Evidencia", "Avance", "Plan"],
          rows: breachRows(project, detail.brechas)
        }
      ]
    };
  }

  return {
    text: `El principio ${group.id} (${getCriterionLabel(group.id)}) tiene ${formatPct(group.pctPromedio)} de avance. Incluye ${formatNumber(group.detalles.length)} requisitos, ${formatNumber(group.evidenciasCount)} fichas relacionadas y ${formatNumber(group.brechasAbiertas)} brechas abiertas.`,
    source: `Mentat · ${project.nombre}`,
    blocks: [
      pctBars(
        `Apertura principio ${group.id}`,
        group.detalles.map((detail) => ({ label: detail.id, pct: detail.pctPromedio }))
      ),
      {
        type: "table",
          title: `Resumen principio ${group.id}`,
          columns: ["Requisito", "Avance", "Brechas", "Abiertas"],
        rows: group.detalles.map((detail) => [
          detail.id,
          formatPct(detail.pctPromedio),
          formatNumber(detail.brechas.length),
          formatNumber(detail.brechasAbiertas)
        ])
      }
    ]
  };
}

function answerGlobal(project: Proyecto): MentatReply {
  const groups = getCriterionGroupSummary(project.evidencias, project.brechas, project);
  const pct = getProjectPct(project.brechas, project);
  const opened = openBrechas(project.brechas);
  const weakest = [...groups].sort((a, b) => (a.pctPromedio ?? 1) - (b.pctPromedio ?? 1)).slice(0, 5);

  return {
    text: `El avance total del proyecto es ${formatPct(pct)}. La base contiene ${formatNumber(project.evidencias.length)} evidencias y ${formatNumber(project.brechas.length)} relaciones evidencia-requisito; ${formatNumber(opened.length)} estan abiertas por plan de accion.`,
    source: `Mentat · resumen de ${project.nombre}`,
    blocks: [
      pctBars("Principios con menor avance", weakest.map((group) => ({ label: `P${group.id} · ${getCriterionLabel(group.id)}`, pct: group.pctPromedio }))),
      {
        type: "table",
        title: "Distribucion por plan de accion",
        columns: ["Plan", "Registros"],
        rows: planRows(project.brechas)
      }
    ]
  };
}

function answerOpenBreaches(project: Proyecto): MentatReply {
  const opened = openBrechas(project.brechas);
  const byCriterion = getAllCriteria(opened).map((criterio) => {
    const brechas = opened.filter((brecha) => brecha.criterio === criterio);
    return { criterio, count: brechas.length, pct: getCriterionPct(criterio, project.brechas) };
  });
  const top = byCriterion.sort((a, b) => b.count - a.count || a.criterio.localeCompare(b.criterio, "es", { numeric: true })).slice(0, 8);

  return {
    text: `Hay ${formatNumber(opened.length)} brechas abiertas. Los requisitos con mas registros abiertos aparecen abajo, priorizados por volumen.`,
    source: "Mentat · planes de accion distintos de Cumple/NA",
    blocks: [
      {
        type: "table",
        title: "Requisitos con mas brechas abiertas",
        columns: ["Criterio", "Abiertas", "Avance"],
        rows: top.map((item) => [item.criterio, formatNumber(item.count), formatPct(item.pct)])
      },
      {
        type: "table",
        title: "Primeras brechas abiertas",
        columns: ["Criterio", "Ficha", "Evidencia", "Avance", "Plan"],
        rows: breachRows(project, opened, 8)
      }
    ]
  };
}

function answerEvidence(project: Proyecto, query: string): MentatReply | null {
  const normalized = normalize(query);
  const match = normalized.match(/\b(?:ficha|evidencia|documento)\s*(\d{1,2})\b/);
  if (!match) return null;

  const evidenciaId = Number(match[1]);
  const evidencia = project.evidencias.find((item) => item.id === evidenciaId);
  if (!evidencia) {
    return {
      text: `No encontre la ficha ${String(evidenciaId).padStart(2, "0")} en este proyecto.`,
      source: "Mentat · evidencias Nava"
    };
  }

  const brechas = project.brechas.filter((brecha) => brecha.evidenciaId === evidenciaId);
  const opened = openBrechas(brechas);
  return {
    text: `La ficha ${String(evidencia.id).padStart(2, "0")} corresponde a "${evidencia.descripcion}". Tiene ${formatNumber(brechas.length)} requisitos asociados y ${formatNumber(opened.length)} brechas abiertas.`,
    source: "Mentat · evidencias y brechas Nava",
    blocks: [
      {
        type: "table",
        title: `Requisitos asociados a ficha ${String(evidencia.id).padStart(2, "0")}`,
        columns: ["Requisito", "Avance", "Plan", "Responsable"],
        rows: brechas.map((brecha) => [
          brecha.criterio,
          formatPct(typeof brecha.cumplimiento === "number" ? brecha.cumplimiento : null),
          brecha.plan ?? "Sin plan",
          brecha.responsableBrecha || evidencia.responsable || "Sin responsable"
        ])
      }
    ]
  };
}

function answerSearch(project: Proyecto, query: string): MentatReply | null {
  const normalized = normalize(query);
  const words = normalized.split(/[^a-z0-9]+/).filter((word) => word.length >= 4);
  if (words.length === 0) return null;

  const evidencias = evidenceLookup(project);
  const matches = project.brechas.filter((brecha) => {
    const evidencia = evidencias.get(brecha.evidenciaId);
    const haystack = normalize([
      brecha.criterio,
      brecha.plan ?? "",
      brecha.brechaPlan ?? "",
      brecha.documento ?? "",
      brecha.documentoRecibido ?? "",
      brecha.filtro ?? "",
      brecha.autor ?? "",
      brecha.revisor ?? "",
      brecha.responsableBrecha ?? "",
      evidencia?.descripcion ?? "",
      evidencia?.responsable ?? ""
    ].join(" "));
    return words.every((word) => haystack.includes(word));
  });

  if (matches.length === 0) return null;

  return {
    text: `Encontre ${formatNumber(matches.length)} registros relacionados con tu busqueda. Te muestro los primeros resultados para revisar rapido.`,
    source: `Mentat · búsqueda sobre evidencias y brechas de ${project.nombre}`,
    blocks: [
      {
        type: "table",
        title: "Resultados encontrados",
        columns: ["Criterio", "Ficha", "Evidencia", "Avance", "Plan"],
        rows: breachRows(project, matches, 8)
      }
    ]
  };
}

export function replyToMentat(query: string, project: Proyecto): MentatReply {
  const normalized = normalize(query);
  const criterion = findCriterionQuery(query);
  if (criterion) return answerCriterion(project, criterion);
  if (/(global|total|general|proyecto|avance)/.test(normalized)) return answerGlobal(project);
  if (/(abierta|abiertas|brecha|brechas|pendiente|pendientes)/.test(normalized)) return answerOpenBreaches(project);

  const evidenceAnswer = answerEvidence(project, query);
  if (evidenceAnswer) return evidenceAnswer;

  const searchAnswer = answerSearch(project, query);
  if (searchAnswer) return searchAnswer;

  return {
    text: "Puedo responder con los datos del proyecto activo. Prueba con: \"cual es el % de avance del principio 1\", \"que brechas tiene el requisito 2.2\", \"cuantas brechas abiertas hay\" o \"que tiene la ficha 09\".",
    source: "Mentat · ayuda"
  };
}
