import { Proyecto } from "../types";
import { ManagementDashboard } from "./ManagementDashboard";
import { useProjectStore } from "../store/useProjectStore";

export function ClientDashboard({ project }: { project: Proyecto }) {
  const setView = useProjectStore((state) => state.setView);
  const setAnalystLocation = useProjectStore((state) => state.setAnalystLocation);
  const selectBrecha = useProjectStore((state) => state.selectBrecha);
  function openAnalyst(criterion: string, subcriterion?: string | null, brecha?: { evidenciaId: number; criterio: string }) {
    setAnalystLocation(criterion, subcriterion ?? null);
    selectBrecha(brecha ?? null);
    setView("analista");
  }
  return <ManagementDashboard project={project} view="resumen" onViewChange={setView} onOpenAnalyst={openAnalyst} />;
}
