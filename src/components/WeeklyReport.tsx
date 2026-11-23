import { getManagementInsights, getOpenManagementTasks, type ManagementTask, type ManagementTaskStatus } from "../lib/managementDashboard";
import { getCriterionGroupSummary } from "../lib/aggregations";
import { getCriterionLabel } from "../lib/criterionLabels";
import { formatPct } from "../lib/semaphore";
import type { Proyecto } from "../types";
import { MaterialIcon } from "./ui/primitives";

function statusLabel(status: ManagementTaskStatus) {
  return ({ vencida: "Vencida", proxima: "Próxima · 21 días", programada: "Programada", "sin-fecha": "Sin fecha" })[status];
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Santiago" }).format(new Date(`${value}T12:00:00`));
}

function taskPriority(task: ManagementTask) {
  if (task.status === "vencida") return `Vencida ${Math.abs(task.daysToDue ?? 0)} días`;
  if (task.status === "proxima") return task.daysToDue === 0 ? "Vence hoy" : `Vence en ${task.daysToDue} días`;
  return statusLabel(task.status);
}

export function WeeklyReport({ project }: { project: Proyecto }) {
  const insights = getManagementInsights(project);
  const tasks = getOpenManagementTasks(project);
  const groups = getCriterionGroupSummary(project.evidencias, project.brechas, project)
    .filter((group) => group.detalles.length > 0);
  const generatedAt = new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "America/Santiago" }).format(new Date());
  const overdueCount = tasks.filter((task) => task.status === "vencida").length;
  const upcomingCount = tasks.filter((task) => task.status === "proxima").length;
  const noDateCount = tasks.filter((task) => task.status === "sin-fecha").length;

  return <div className="nava-view nava-weekly-report">
    <div className="nava-report-actions"><span><MaterialIcon name="info" />El PDF se genera desde la opción “Guardar como PDF” del diálogo de impresión.</span><button type="button" className="nava-button" onClick={() => window.print()}><MaterialIcon name="picture_as_pdf" />Imprimir / Guardar PDF</button></div>
    <header className="nava-report-header"><div><p className="nava-eyebrow">GISTM Tracker · Seguimiento gerencial</p><h1>Reporte semanal de cumplimiento</h1><p>Estado de planes, responsables y fechas de compromiso.</p></div><div className="nava-report-date"><span>Proyecto</span><strong>{project.nombre}</strong><span>Generado el {generatedAt}</span></div></header>
    <section className="nava-report-kpis" aria-label="Indicadores del reporte">
      <article><span>Cumplimiento global</span><strong>{formatPct(insights.totalPct)}</strong><small>{project.cliente}</small></article>
      <article><span>Planes abiertos</span><strong>{tasks.length}</strong><small>Relaciones criterio-evidencia</small></article>
      <article className={overdueCount ? "is-risk" : ""}><span>Vencidos</span><strong>{overdueCount}</strong><small>Requieren atención</small></article>
      <article className={upcomingCount ? "is-warning" : ""}><span>Próximos · 21 días</span><strong>{upcomingCount}</strong><small>Con fecha registrada</small></article>
      <article className={noDateCount ? "is-muted" : ""}><span>Sin fecha</span><strong>{noDateCount}</strong><small>Compromiso pendiente</small></article>
    </section>
    <section className="nava-panel nava-report-principles"><div className="nava-section-heading"><div><h2>Avance por principio</h2><p>Resumen del estado actual de la matriz.</p></div></div><div className="nava-report-principle-grid">{groups.map((group) => <article key={group.id}><span>P{group.id}</span><strong>{getCriterionLabel(group.id)}</strong><b>{formatPct(group.pctPromedio)}</b><small>{group.brechasAbiertas} planes abiertos</small></article>)}</div></section>
    <section className="nava-panel nava-report-tasks"><div className="nava-section-heading"><div><h2>Planes de acción por revisar</h2><p>{tasks.length} tareas · ordenadas por prioridad y fecha.</p></div></div>
      {tasks.length ? <div className="nava-report-table-wrap"><table className="nava-report-table"><thead><tr><th>Estado</th><th>Criterio</th><th>Evidencia</th><th>Responsable</th><th>Plan</th><th>Fecha compromiso</th></tr></thead><tbody>{tasks.map((task) => <tr key={task.id} className={`is-${task.status}`}><td><span className={`nava-report-status is-${task.status}`}>{taskPriority(task)}</span></td><td className="nava-mono">{task.criterio}</td><td>E{String(task.evidenciaId).padStart(2, "0")} · {task.evidencia}</td><td>{task.owner}</td><td>{task.plan}</td><td>{formatDate(task.dueDate)}</td></tr>)}</tbody></table></div> : <p className="nava-report-empty">No hay planes abiertos registrados para este proyecto.</p>}
    </section>
    <footer className="nava-report-footer">Corte generado el {generatedAt}. El informe refleja los datos disponibles al momento de imprimir y no contiene una serie histórica.</footer>
  </div>;
}
