import type { Proyecto, Rol } from "../types";

export function getProjectForRole(project: Proyecto, role: Rol): Proyecto {
  if (role !== "cliente") return project;

  const releasedPrinciples = new Set(
    Object.entries(project.liberacionesPrincipio ?? {})
      .filter(([, release]) => release.liberado)
      .map(([principleId]) => principleId)
  );
  const releasedBrechas = project.brechas.filter((brecha) => {
    const principleId = brecha.criterio.match(/^(\d{1,2})/)?.[1];
    return principleId ? releasedPrinciples.has(principleId) : false;
  });
  const releasedEvidenceIds = new Set(releasedBrechas.map((brecha) => brecha.evidenciaId));

  return {
    ...project,
    principiosActivos: (project.principiosActivos ?? []).filter((principleId) => releasedPrinciples.has(principleId)),
    criteriosNava: (project.criteriosNava ?? []).filter((criterion) => {
      const principleId = criterion.match(/^(\d{1,2})/)?.[1];
      return principleId ? releasedPrinciples.has(principleId) : false;
    }),
    brechas: releasedBrechas,
    evidencias: project.evidencias.filter((evidence) => releasedEvidenceIds.has(evidence.id))
  };
}
