import { Proyecto } from "../types";
import { ManagementDashboard } from "./ManagementDashboard";
import { useProjectStore } from "../store/useProjectStore";
import { getProjectForRole } from "../lib/principleRelease";

export function ClientDashboard({ project }: { project: Proyecto }) {
  const setView = useProjectStore((state) => state.setView);
  const setAnalystLocation = useProjectStore((state) => state.setAnalystLocation);
  const selectBrecha = useProjectStore((state) => state.selectBrecha);
  function openAnalyst(criterion: string, subcriterion?: string | null, brecha?: { evidenciaId: number; criterio: string }) {
    setAnalystLocation(criterion, subcriterion ?? null);
    selectBrecha(brecha ?? null);
    setView("analista");
  }
  return <ManagementDashboard project={getProjectForRole(project, "cliente")} role="cliente" view="resumen" onViewChange={setView} onOpenAnalyst={openAnalyst} />;
}
