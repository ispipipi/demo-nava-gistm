import { BrechaPanel } from "./components/BrechaPanel";
import { ClientDashboard } from "./components/ClientDashboard";
import { CriteriaDashboard } from "./components/CriteriaDashboard";
import { FichaPanel } from "./components/FichaPanel";
import { MentatCopilot } from "./components/MentatCopilot";
import { TopBar } from "./components/TopBar";
import { useProjectStore } from "./store/useProjectStore";
import { getProjectPct } from "./lib/aggregations";
import { formatPct, getSemaphore } from "./lib/semaphore";

function App() {
  const { role, proyectos, currentProjectId, selectedEvidenceId, selectedBrecha } = useProjectStore();
  const project = proyectos.find((item) => item.id === currentProjectId) ?? proyectos[0];
  const projectPct = getProjectPct(project.brechas);
  const semaforo = getSemaphore(projectPct);

  return (
    <div className="min-h-screen bg-app text-ink">
      <TopBar project={project} />
      <main className="mx-auto flex w-[min(100%-32px,1480px)] flex-col gap-5 py-5">
        <section className="summary-band">
          <div>
            <p className="eyebrow">GISTM Tracker Nava</p>
            <h1>{role === "cliente" ? "Dashboard gerencial GISTM" : "Indicadores por criterio GISTM"}</h1>
            <p>
              {project.cliente} · evaluacion {project.fechaEvaluacion} · {project.evidencias.length} evidencias · {project.brechas.length} relaciones evidencia-criterio
            </p>
          </div>
          <div className="summary-score">
            <span className={`status-badge ${semaforo.className}`}>{semaforo.label}</span>
            <strong>{formatPct(projectPct)}</strong>
            <small>Cumplimiento total</small>
          </div>
        </section>

        {role === "cliente" ? <ClientDashboard project={project} /> : <CriteriaDashboard project={project} />}
      </main>
      <MentatCopilot project={project} />
      {role === "analista" && selectedBrecha !== null && <BrechaPanel project={project} brechaKey={selectedBrecha} />}
      {role === "analista" && selectedEvidenceId !== null && <FichaPanel project={project} evidenceId={selectedEvidenceId} />}
    </div>
  );
}

export default App;
