import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { CriteriaDashboard } from "./components/CriteriaDashboard";
import { FichaPanel } from "./components/FichaPanel";
import { ManagementDashboard } from "./components/ManagementDashboard";
import { MentatCopilot } from "./components/MentatCopilot";
import { useProjectStore } from "./store/useProjectStore";
import { getCriterionDetail, getCriterionGroupSummary, getCriterionRoot } from "./lib/aggregations";
import { getManagementInsights } from "./lib/managementDashboard";
import type { BrechaKey } from "./types";

function App() {
  const {
    proyectos, currentProjectId, selectedEvidenceId, selectedBrecha, view,
    analystCriterion, analystSubcriterion, setView, setAnalystLocation, selectBrecha, selectEvidence
  } = useProjectStore();
  const project = proyectos.find((item) => item.id === currentProjectId) ?? proyectos[0];
  const insights = useMemo(() => getManagementInsights(project), [project]);
  const groups = useMemo(() => getCriterionGroupSummary(project.evidencias, project.brechas), [project]);
  const [mentatOpen, setMentatOpen] = useState(false);

  useEffect(() => {
    if (view !== "analista") return;
    const group = groups.find((item) => item.id === analystCriterion);
    if (analystCriterion && !group) {
      setAnalystLocation(groups[0]?.id ?? null, null);
      return;
    }
    if (analystSubcriterion && !group?.detalles.some((item) => item.id === analystSubcriterion)) {
      setAnalystLocation(analystCriterion, null);
    }
    if (selectedBrecha) {
      const exists = project.brechas.some((item) => item && item.evidenciaId === selectedBrecha.evidenciaId && item.criterio === selectedBrecha.criterio);
      if (!exists) {
        selectBrecha(null);
        return;
      }
      const root = getCriterionRoot(selectedBrecha.criterio);
      const detail = getCriterionDetail(selectedBrecha.criterio);
      if (analystCriterion !== root || analystSubcriterion !== detail) setAnalystLocation(root, detail);
    }
  }, [view, groups, analystCriterion, analystSubcriterion, selectedBrecha, project.brechas, setAnalystLocation, selectBrecha]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("vista", view);
    if (view === "analista") {
      const criterion = analystSubcriterion ?? analystCriterion;
      if (criterion) params.set("c", criterion);
      if (selectedBrecha) params.set("f", `${selectedBrecha.evidenciaId}|${selectedBrecha.criterio}`);
    }
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [view, analystCriterion, analystSubcriterion, selectedBrecha]);

  function openAnalyst(criterion: string, subcriterion?: string | null, brecha?: BrechaKey) {
    setAnalystLocation(criterion, subcriterion ?? null);
    if (brecha) selectBrecha(brecha);
    else selectBrecha(null);
    setView("analista");
  }

  const validSelectedEvidenceId = typeof selectedEvidenceId === "number" && project.evidencias.some((item) => item && item.id === selectedEvidenceId);

  return (
    <AppShell project={project} view={view} insights={insights} onViewChange={setView} onOpenMentat={() => setMentatOpen(true)}>
      {view === "analista" ? (
        <CriteriaDashboard project={project} onOpenAnalyst={openAnalyst} />
      ) : (
        <ManagementDashboard project={project} view={view} onViewChange={setView} onOpenAnalyst={openAnalyst} />
      )}
      <MentatCopilot project={project} open={mentatOpen} onOpenChange={setMentatOpen} />
      {view === "analista" && validSelectedEvidenceId && <FichaPanel project={project} evidenceId={selectedEvidenceId as number} />}
    </AppShell>
  );
}

export default App;
