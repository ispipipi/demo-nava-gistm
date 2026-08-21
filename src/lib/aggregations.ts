import { Brecha, CriterioGrupoResumen, Evidencia, Tema, TemaResumen } from "../types";

export function averageCumplimiento(values: Array<number | "NA" | null | undefined>) {
  const numeric = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (numeric.length === 0) return null;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

export function getEvidencePct(evidenciaId: number, brechas: Brecha[]) {
  return averageCumplimiento(brechas.filter((item) => item.evidenciaId === evidenciaId).map((item) => item.cumplimiento));
}

export function getCriterionPct(criterio: string, brechas: Brecha[]) {
  return averageCumplimiento(brechas.filter((item) => item.criterio === criterio).map((item) => item.cumplimiento));
}

export function getAllCriteria(brechas: Brecha[]) {
  return Array.from(new Set(brechas.map((item) => item.criterio))).sort((a, b) => a.localeCompare(b, "es"));
}

export function getThemeForCriterion(criterio: string, temas: Tema[]) {
  return temas.find((tema) => tema.criterioPrefixes.some((prefix) => criterio.startsWith(prefix))) ?? temas[temas.length - 1];
}

export function getDominantThemeForEvidence(evidenciaId: number, brechas: Brecha[], temas: Tema[]) {
  const firstCriterion = brechas.find((item) => item.evidenciaId === evidenciaId)?.criterio;
  return firstCriterion ? getThemeForCriterion(firstCriterion, temas) : temas[0];
}

export function getProjectPct(brechas: Brecha[]) {
  return averageCumplimiento(getAllCriteria(brechas).map((criterio) => getCriterionPct(criterio, brechas)));
}

export function getTemaResumen(temas: Tema[], evidencias: Evidencia[], brechas: Brecha[]): TemaResumen[] {
  const criteria = getAllCriteria(brechas);
  return temas.map((tema) => {
    const criterios = criteria
      .filter((criterio) => tema.criterioPrefixes.some((prefix) => criterio.startsWith(prefix)))
      .map((criterio) => ({ criterio, pct: getCriterionPct(criterio, brechas) }));
    const evidenciaIds = new Set(
      brechas
        .filter((item) => criterios.some((criterio) => criterio.criterio === item.criterio))
        .map((item) => item.evidenciaId)
    );
    const brechasAbiertas = brechas.filter(
      (item) =>
        item.plan &&
        item.plan !== "Cumple" &&
        item.plan !== "NA" &&
        criterios.some((criterio) => criterio.criterio === item.criterio)
    ).length;
    return {
      ...tema,
      criterios,
      pctPromedio: averageCumplimiento(criterios.map((item) => item.pct)),
      evidenciasCount: evidencias.filter((item) => evidenciaIds.has(item.id)).length,
      brechasAbiertas
    };
  });
}

export function clampPct(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function getCriterionRoot(criterio: string) {
  return criterio.split(".")[0] ?? criterio;
}

export function getCriterionDetail(criterio: string) {
  return criterio.split(" - ")[0] ?? criterio;
}

export function getCriterionGroupSummary(evidencias: Evidencia[], brechas: Brecha[]): CriterioGrupoResumen[] {
  const evidenciasById = new Map(evidencias.map((evidencia) => [evidencia.id, evidencia]));

  return Array.from({ length: 15 }, (_, index) => {
    const grupo = String(index + 1);
    const groupBrechas = brechas.filter((brecha) => getCriterionRoot(brecha.criterio) === grupo);
    const detailIds = Array.from(new Set(groupBrechas.map((brecha) => getCriterionDetail(brecha.criterio)))).sort((a, b) =>
      a.localeCompare(b, "es", { numeric: true })
    );
    const detalles = detailIds.map((detailId) => {
      const detailBrechas = groupBrechas.filter((brecha) => getCriterionDetail(brecha.criterio) === detailId);
      const detailEvidenceIds = Array.from(new Set(detailBrechas.map((brecha) => brecha.evidenciaId)));
      const detailEvidencias = detailEvidenceIds
        .map((id) => evidenciasById.get(id))
        .filter((evidencia): evidencia is Evidencia => Boolean(evidencia));
      return {
        id: detailId,
        grupo,
        pctPromedio: averageCumplimiento(detailBrechas.map((brecha) => brecha.cumplimiento)),
        brechas: detailBrechas,
        evidencias: detailEvidencias,
        brechasAbiertas: detailBrechas.filter((brecha) => brecha.plan && brecha.plan !== "Cumple" && brecha.plan !== "NA").length
      };
    });
    const evidenceIds = new Set(groupBrechas.map((brecha) => brecha.evidenciaId));

    return {
      id: grupo,
      nombre: `Criterio ${grupo}`,
      pctPromedio: averageCumplimiento(groupBrechas.map((brecha) => brecha.cumplimiento)),
      detalles,
      evidenciasCount: evidenceIds.size,
      brechasAbiertas: groupBrechas.filter((brecha) => brecha.plan && brecha.plan !== "Cumple" && brecha.plan !== "NA").length
    };
  });
}
