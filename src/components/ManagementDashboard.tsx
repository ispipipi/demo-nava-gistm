import { useMemo, type ReactNode } from "react";
import { getCriterionGroupSummary, getEvidencePct, getTemaResumen } from "../lib/aggregations";
import { getCriterionLabel } from "../lib/criterionLabels";
import { getManagementInsights, type ManagementWarning, type ProgressPoint } from "../lib/managementDashboard";
import { formatPct, getSemaphore } from "../lib/semaphore";
import { useProjectStore, type AppView, type DocumentAvailabilityFilter, type ProgressSeries, type WarningFilter } from "../store/useProjectStore";
import type { BrechaKey, Evidencia, Proyecto } from "../types";
import { DataNotice, EmptyState, FilterChips, KpiCard, MaterialIcon, SegmentedControl, StatusBadge } from "./ui/primitives";

const ownerByType: Record<string, string> = {
  "ADM/RRHH": "Administración y RRHH", GOB: "Gobernanza", POL: "Políticas y procedimientos",
  "S&A": "Seguridad y assurance", TEC: "Equipo técnico", TKB: "Base de conocimiento"
};
const availabilityOptions: Array<{ value: DocumentAvailabilityFilter; label: string }> = [
  { value: "todos", label: "Todos" }, { value: "pendientes", label: "Pendientes" }, { value: "Si", label: "Disponible" }, { value: "No", label: "No disponible" },
  { value: "NA", label: "No aplica" }, { value: "sin-informar", label: "Sin informar" }
];

type ManagementView = Exclude<AppView, "analista">;

function pct(value: number | null) { return formatPct(value); }
function signedPct(value: number | null) {
  if (value === null) return "NA";
  const rounded = Math.round(value * 100);
  return `${rounded > 0 ? "+" : ""}${rounded} pts`;
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}
function evidenceOwner(evidence: Evidencia) {
  return evidence.responsable?.trim() || ownerByType[evidence.tipo] || "Sin responsable";
}
function evidenceAvailability(evidence: Evidencia): DocumentAvailabilityFilter {
  return evidence.disponible === "Si" || evidence.disponible === "No" || evidence.disponible === "NA" ? evidence.disponible : "sin-informar";
}
function matchesAvailability(evidence: Evidencia, filter: DocumentAvailabilityFilter) {
  if (filter === "todos") return true;
  if (filter === "pendientes") return evidenceAvailability(evidence) === "No" || evidenceAvailability(evidence) === "sin-informar";
  return evidenceAvailability(evidence) === filter;
}
function getDayLabel(warning: ManagementWarning) {
  if (warning.daysToDue < 0) return `Hace ${Math.abs(warning.daysToDue)} d`;
  if (warning.daysToDue === 0) return "Vence hoy";
  return `En ${warning.daysToDue} d`;
}

function PageHeading({ eyebrow, title, description, trailing }: { eyebrow: string; title: string; description: string; trailing?: ReactNode }) {
  return <div className="nava-page-heading"><div><p className="nava-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{trailing}</div>;
}

function StatusBanner({ headline, detail, icon = "insights" }: { headline: string; detail: string; icon?: string }) {
  return <div className="nava-status-banner"><span className="nava-status-banner__icon"><MaterialIcon name={icon} /></span><div><p>Estado del proyecto</p><strong>{headline}</strong><span>{detail}</span></div></div>;
}

function SectionHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="nava-section-heading"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action}</div>;
}

function ProgressChart({ points, expectedPct, expanded = false, series = "ambas" }: { points: ProgressPoint[]; expectedPct: number; expanded?: boolean; series?: ProgressSeries }) {
  const width = 760;
  const height = expanded ? 240 : 190;
  const padding = { top: 20, right: 24, bottom: 34, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const x = (index: number) => padding.left + (chartWidth / Math.max(1, points.length - 1)) * index;
  const y = (value: number) => padding.top + chartHeight - chartHeight * Math.max(0, Math.min(1, value));
  const todayX = padding.left + chartWidth * Math.max(0, Math.min(1, expectedPct));
  const expectedPath = points.map((point, index) => `${x(index)},${y(point.expected)}`).join(" ");
  const realPoints = points.map((point, index) => ({ point, index })).filter(({ point }) => point.real !== null);
  const realPath = realPoints.map(({ point, index }) => `${x(index)},${y(point.real ?? 0)}`).join(" ");
  return (
    <div className={`nava-chart${expanded ? " nava-chart--expanded" : ""}`}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Curva de avance real versus esperado">
        <rect className="nava-chart__future" x={todayX} y={padding.top} width={Math.max(0, width - padding.right - todayX)} height={chartHeight} />
        {[0, 0.25, 0.5, 0.75, 1].map((line) => <g key={line}><line className="nava-chart__grid" x1={padding.left} x2={width - padding.right} y1={y(line)} y2={y(line)} /><text className="nava-chart__axis" x={4} y={y(line) + 4}>{Math.round(line * 100)}%</text></g>)}
        {series !== "real" && <polyline className="nava-chart__expected" points={expectedPath} />}
        {series !== "esperado" && <polyline className="nava-chart__real" points={realPath} />}
        <line className="nava-chart__today" x1={todayX} x2={todayX} y1={padding.top} y2={height - padding.bottom} />
        <text className="nava-chart__today-label" x={Math.min(todayX + 6, width - 46)} y={padding.top + 12}>Hoy</text>
        {points.map((point, index) => <g key={point.label}><text className="nava-chart__month" x={x(index)} y={height - 10}>{point.label}</text>{series !== "real" && <circle className="nava-chart__expected-dot" cx={x(index)} cy={y(point.expected)} r="3.5" />}{series !== "esperado" && point.real !== null && <circle className="nava-chart__real-dot" cx={x(index)} cy={y(point.real)} r="4.5" />}</g>)}
      </svg>
      <div className="nava-chart__legend">{series !== "esperado" && <span><i className="nava-chart__legend-real" />Real</span>}{series !== "real" && <span><i className="nava-chart__legend-expected" />Esperado</span>}<span><i className="nava-chart__legend-today" />Hoy</span></div>
    </div>
  );
}

function WarningCard({ warning, onOpen }: { warning: ManagementWarning; onOpen: (warning: ManagementWarning) => void }) {
  const overdue = warning.status === "vencida";
  return <button type="button" className={`nava-warning-row${overdue ? " is-overdue" : " is-upcoming"}`} onClick={() => onOpen(warning)}>
    <span className={`nava-deadline-badge${overdue ? " is-overdue" : ""}`}><MaterialIcon name={overdue ? "error" : "schedule"} />{overdue ? "Vencido" : "Próximo"}</span>
    <span className="nava-warning-row__main"><strong>{warning.criterio} · E{String(warning.evidenciaId).padStart(2, "0")}</strong><small>{warning.evidencia}</small></span>
    <span className="nava-warning-row__owner">{warning.owner}</span>
    <span className="nava-warning-row__plan">{warning.plan}</span>
    <span className="nava-warning-row__date"><strong>{getDayLabel(warning)}</strong><small>{formatDate(warning.dueDate)}</small></span>
    <MaterialIcon name="chevron_right" />
  </button>;
}

function ManagementDashboard({ project, view, onViewChange, onOpenAnalyst }: {
  project: Proyecto;
  view: ManagementView;
  onViewChange: (view: AppView) => void;
  onOpenAnalyst: (criterion: string, subcriterion?: string | null, brecha?: BrechaKey) => void;
}) {
  const filters = useProjectStore((state) => state.dashboardFilters);
  const setFilters = useProjectStore((state) => state.setDashboardFilters);
  const insights = useMemo(() => getManagementInsights(project), [project]);
  const groups = useMemo(() => getCriterionGroupSummary(project.evidencias, project.brechas), [project]);
  const themes = useProjectStore((state) => state.temas);
  const temaSummary = useMemo(() => getTemaResumen(themes, project.evidencias, project.brechas), [themes, project]);
  const evidenceOwners = useMemo(() => Array.from(new Set(project.evidencias.map(evidenceOwner))).sort((a, b) => a.localeCompare(b, "es")), [project.evidencias]);
  const overdueCount = insights.warnings.filter((item) => item.status === "vencida").length;
  const upcomingCount = insights.warnings.filter((item) => item.status === "proxima").length;
  const warningOwnerOptions = ["Todos", ...Array.from(new Set(insights.warnings.map((item) => item.owner))).sort((a, b) => a.localeCompare(b, "es"))];
  const filteredWarnings = insights.warnings.filter((item) => (filters.warnings.status === "todos" || item.status === filters.warnings.status) && (filters.warnings.owner === "Todos" || item.owner === filters.warnings.owner));
  const filteredEvidence = project.evidencias.filter((item) => (filters.documents.owner === "Todos" || evidenceOwner(item) === filters.documents.owner) && matchesAvailability(item, filters.documents.availability));
  const evidenceStatuses = availabilityOptions.map((item) => ({ ...item, count: project.evidencias.filter((evidence) => (filters.documents.owner === "Todos" || evidenceOwner(evidence) === filters.documents.owner) && matchesAvailability(evidence, item.value)).length }));
  const availableCount = project.evidencias.filter((item) => evidenceAvailability(item) === "Si").length;
  const unavailableCount = project.evidencias.filter((item) => evidenceAvailability(item) === "No").length;
  const naCount = project.evidencias.filter((item) => evidenceAvailability(item) === "NA").length;
  const unreportedCount = project.evidencias.filter((item) => evidenceAvailability(item) === "sin-informar").length;
  const semaforo = getSemaphore(insights.totalPct);
  const gapPoints = Math.abs(Math.round((insights.gapPct ?? 0) * 100));
  const stateHeadline = insights.gapPct === null ? "Sin avance suficiente para comparar" : insights.gapPct >= 0 ? "Avance sobre el plan esperado" : "Avance bajo el plan esperado";
  const stateDetail = insights.gapPct === null ? "Revisa los datos disponibles del proyecto." : `El avance real está ${gapPoints} ${gapPoints === 1 ? "punto" : "puntos"} ${insights.gapPct >= 0 ? "sobre" : "bajo"} el avance esperado.`;

  function setWarningStatus(status: WarningFilter) { setFilters({ warnings: { ...filters.warnings, status } }); }
  function setWarningOwner(owner: string) { setFilters({ warnings: { ...filters.warnings, owner } }); }
  function setDocumentOwner(owner: string) { setFilters({ documents: { ...filters.documents, owner } }); }
  function setDocumentAvailability(availability: DocumentAvailabilityFilter) { setFilters({ documents: { ...filters.documents, availability } }); }
  function setProgressSeries(series: ProgressSeries) { setFilters({ curve: { series } }); }
  function openWarning(warning: ManagementWarning) {
    onOpenAnalyst(warning.criterio.split(".")[0], warning.criterio.split(" - ")[0], { evidenciaId: warning.evidenciaId, criterio: warning.criterio });
  }
  function selectPriorityWarnings(status: WarningFilter) { setWarningStatus(status); setWarningOwner("Todos"); onViewChange("warnings"); }

  const warningsPreview = insights.warnings.slice(0, 4);
  const banner = <StatusBanner headline={stateHeadline} detail={stateDetail} icon={insights.gapPct !== null && insights.gapPct < 0 ? "trending_down" : "trending_up"} />;
  const warningsContent = <>
    <DataNotice>Fechas de ejemplo para compromisos sin fecha registrada. La vista muestra hasta 9 warnings de la matriz del demo.</DataNotice>
    <div className="nava-shortcut-grid" aria-label="Accesos rápidos a warnings">
      <KpiCard label="Todos" value={insights.warnings.length} detail="Compromisos a revisar" icon="notifications" active={filters.warnings.status === "todos"} onClick={() => setWarningStatus("todos")} />
      <KpiCard label="Vencidos" value={overdueCount} detail="Requieren atención" icon="error" tone="risk" active={filters.warnings.status === "vencida"} onClick={() => setWarningStatus("vencida")} />
      <KpiCard label="Próximos" value={upcomingCount} detail="Dentro de 21 días" icon="schedule" tone="warning" active={filters.warnings.status === "proxima"} onClick={() => setWarningStatus("proxima")} />
    </div>
    <div className="nava-filter-row"><label className="nava-select-label">Responsable<select value={filters.warnings.owner} onChange={(event) => setWarningOwner(event.target.value)} aria-label="Filtrar warnings por responsable">{warningOwnerOptions.map((owner) => <option key={owner}>{owner}</option>)}</select></label>{(filters.warnings.status !== "todos" || filters.warnings.owner !== "Todos") && <span className="nava-active-filter"><MaterialIcon name="filter_alt" />Filtro activo: {filters.warnings.status === "todos" ? "Todos los estados" : filters.warnings.status === "vencida" ? "Vencidos" : "Próximos"}{filters.warnings.owner !== "Todos" ? ` · ${filters.warnings.owner}` : ""}<button type="button" onClick={() => { setWarningStatus("todos"); setWarningOwner("Todos"); }}>Limpiar</button></span>}<span className="nava-result-count">{filteredWarnings.length} de {insights.warnings.length}</span></div>
    {filteredWarnings.length ? <div className="nava-warning-table">{filteredWarnings.map((warning) => <WarningCard key={warning.id} warning={warning} onOpen={openWarning} />)}</div> : <EmptyState title="Sin resultados" detail="No hay warnings para los filtros seleccionados." action="Limpiar filtros" onAction={() => { setWarningStatus("todos"); setWarningOwner("Todos"); }} positive={filters.warnings.status === "proxima" && upcomingCount === 0} />}
  </>;

  const documentFilter = <SegmentedControl label="Filtrar documentos por disponibilidad" value={filters.documents.availability} options={evidenceStatuses} onChange={(value) => setDocumentAvailability(value)} />;
  const documentContent = <>
    <DataNotice tone="info">El Excel no informa responsable en todas las fichas. Cuando falta, se muestra el área asociada al tipo de evidencia.</DataNotice>
    <div className="nava-owner-filter"><span>Área / responsable</span><FilterChips label="Filtrar documentos por responsable" value={filters.documents.owner} options={[{ value: "Todos", label: "Todos", count: project.evidencias.length }, ...evidenceOwners.map((owner) => ({ value: owner, label: owner, count: project.evidencias.filter((item) => evidenceOwner(item) === owner).length }))]} onChange={setDocumentOwner} /></div>
    <div className="nava-filter-row"><div className="nava-filter-row__scroll">{documentFilter}</div>{(filters.documents.availability !== "todos" || filters.documents.owner !== "Todos") && <span className="nava-active-filter"><MaterialIcon name="filter_alt" />Filtro activo: {availabilityOptions.find((item) => item.value === filters.documents.availability)?.label ?? "Todos"}{filters.documents.owner !== "Todos" ? ` · ${filters.documents.owner}` : ""}<button type="button" onClick={() => { setDocumentOwner("Todos"); setDocumentAvailability("todos"); }}>Limpiar</button></span>}<span className="nava-result-count">{filteredEvidence.length} de {project.evidencias.length} documentos</span></div>
    {filteredEvidence.length ? <div className="nava-document-table-wrap"><table className="nava-document-table"><thead><tr><th>ID</th><th>Documento</th><th>Tipo</th><th>Nivel</th><th>Disponible</th><th>Área / responsable</th><th>Cumplimiento</th></tr></thead><tbody>{filteredEvidence.map((evidence) => {
      const availability = evidenceAvailability(evidence);
      const evidencePct = getEvidencePct(evidence.id, project.brechas);
      const style = availability === "Si" ? "available" : availability === "No" ? "unavailable" : availability === "NA" ? "not-applicable" : "unreported";
      const label = availability === "Si" ? "Disponible" : availability === "No" ? "No disponible" : availability === "NA" ? "No aplica" : "Sin informar";
      return <tr key={evidence.id}><td data-label="ID" className="nava-mono">E{String(evidence.id).padStart(2, "0")}</td><td data-label="Documento" className="nava-document-name">{evidence.descripcion}</td><td data-label="Tipo">{evidence.tipo}</td><td data-label="Nivel">{evidence.nivelDocumento ?? "—"}</td><td data-label="Disponible"><span className={`nava-document-status is-${style}`}><MaterialIcon name={availability === "Si" ? "check_circle" : availability === "No" ? "cancel" : availability === "NA" ? "do_not_disturb_on" : "help"} />{label}</span></td><td data-label="Área / responsable">{evidenceOwner(evidence)}</td><td data-label="Cumplimiento" className="nava-num">{pct(evidencePct)}</td></tr>;
    })}</tbody></table></div> : <EmptyState title="Sin resultados" detail="No hay documentos para los filtros seleccionados." action="Limpiar filtros" onAction={() => { setDocumentOwner("Todos"); setDocumentAvailability("todos"); }} />}
  </>;

  if (view === "resumen") return <div className="nava-view">
    <PageHeading eyebrow="Dashboard gerencial" title="Estado de cumplimiento GISTM" description={`${project.cliente} · Evaluación ${formatDate(project.fechaEvaluacion)} · ${project.evidencias.length} evidencias · ${project.brechas.length} relaciones evidencia-criterio`} trailing={<StatusBadge value={insights.totalPct} />} />
    <section className="nava-summary-status"><div className="nava-summary-status__message"><span className="nava-summary-status__icon"><MaterialIcon name={semaforo.icon} /></span><div><p>Lectura ejecutiva</p><h2>{stateHeadline}</h2><span>{stateDetail}</span></div></div><div className="nava-summary-status__shortcuts">
      <KpiCard label="Vencidos" value={insights.overdueCount} detail="Ver warnings" icon="error" tone="risk" onClick={() => selectPriorityWarnings("vencida")} />
      <KpiCard label="Brechas abiertas" value={insights.openBrechas} detail="Ver criterios críticos" icon="flag" tone="warning" onClick={() => onViewChange("criterios")} />
      <KpiCard label="Documentos pendientes" value={insights.pendingDocuments} detail="Ver documentos" icon="folder_open" onClick={() => { setDocumentAvailability("pendientes"); onViewChange("documentos"); }} />
    </div></section>
    <section className="nava-section"><SectionHeading title="Avance por criterio" detail="15 criterios GISTM · selección para abrir el detalle en Analista" action={<button className="nava-text-action" type="button" onClick={() => onViewChange("criterios")}>Ver críticos <MaterialIcon name="arrow_forward" /></button>} /><div className="nava-criterion-map">{groups.map((group) => { const status = getSemaphore(group.pctPromedio); return <button className="nava-criterion-tile" key={group.id} type="button" onClick={() => onOpenAnalyst(group.id)}><span className="nava-criterion-tile__top"><span>C{group.id}</span><MaterialIcon name={status.icon} /></span><strong>{getCriterionLabel(group.id)}</strong><span className="nava-criterion-tile__stats"><b>{pct(group.pctPromedio)}</b><span>{group.brechasAbiertas} abiertas</span></span><span className="nava-criterion-tile__bar"><i style={{ width: `${Math.max(0, Math.min(100, (group.pctPromedio ?? 0) * 100))}%`, backgroundColor: status.bar }} /></span></button>; })}</div></section>
    <div className="nava-summary-grid"><section className="nava-panel"><SectionHeading title="Curva de avance" detail="Real vs esperado · 2026" action={<button className="nava-text-action" type="button" onClick={() => onViewChange("avance")}>Ver detalle <MaterialIcon name="arrow_forward" /></button>} /><DataNotice>El tramo real se proyecta desde el avance actual; no representa un historial mensual.</DataNotice><KpiLine insights={insights} /><ProgressChart points={insights.progressCurve} expectedPct={insights.expectedPct} /></section><section className="nava-panel"><SectionHeading title="Warnings" detail="Compromisos vencidos y próximos" action={<button className="nava-text-action" type="button" onClick={() => onViewChange("warnings")}>Ver todos <MaterialIcon name="arrow_forward" /></button>} /><DataNotice>Fechas de ejemplo para compromisos sin fecha registrada.</DataNotice><div className="nava-warning-summary"><KpiCard label="Vencidos" value={insights.overdueCount} icon="error" tone="risk" onClick={() => selectPriorityWarnings("vencida")} /><KpiCard label="Próximos 21 días" value={insights.upcomingCount} icon="schedule" tone="warning" onClick={() => selectPriorityWarnings("proxima")} /></div><div className="nava-warning-preview">{warningsPreview.length ? warningsPreview.map((warning) => <WarningCard key={warning.id} warning={warning} onOpen={openWarning} />) : <EmptyState title="Sin warnings" detail="No hay compromisos vencidos ni próximos." positive />}</div></section></div>
  </div>;

  if (view === "avance") return <div className="nava-view"><PageHeading eyebrow="Gerencia · Seguimiento" title="Curva de avance" description="Avance real comparado con el esperado del plan." /><StatusBanner headline={stateHeadline} detail={stateDetail} icon="monitoring" /><section className="nava-shortcut-grid nava-shortcut-grid--curve" aria-label="Series visibles en la curva">
    <KpiCard label="Ambas series" value="Real + esperado" detail="Comparación completa" icon="stacked_line_chart" active={filters.curve.series === "ambas"} onClick={() => setProgressSeries("ambas")} />
    <KpiCard label="Avance real" value={pct(insights.totalPct)} detail="Ver solo real" icon="show_chart" tone="positive" active={filters.curve.series === "real"} onClick={() => setProgressSeries("real")} />
    <KpiCard label="Avance esperado" value={pct(insights.expectedPct)} detail="Ver solo plan" icon="trending_up" active={filters.curve.series === "esperado"} onClick={() => setProgressSeries("esperado")} />
  </section><section className="nava-panel"><SectionHeading title="Avance real vs esperado" detail="Corte y proyección según la fecha del sistema" />{filters.curve.series !== "ambas" && <span className="nava-active-filter"><MaterialIcon name="filter_alt" />Serie activa: {filters.curve.series === "real" ? "Avance real" : "Avance esperado"}<button type="button" onClick={() => setProgressSeries("ambas")}>Restablecer</button></span>}<DataNotice>El avance esperado se calcula linealmente desde la evaluación. El tramo real se proyecta desde el avance actual; no es una serie histórica.</DataNotice><KpiLine insights={insights} /><ProgressChart points={insights.progressCurve} expectedPct={insights.expectedPct} series={filters.curve.series} expanded /></section><section className="nava-panel nava-milestone-panel"><SectionHeading title="Lectura por hito" detail="Valores usados en la curva" /><MilestoneTable points={insights.progressCurve} /></section></div>;

  if (view === "warnings") return <div className="nava-view"><PageHeading eyebrow="Gerencia · Alertas" title="Warnings de compromisos" description="Brechas abiertas vencidas o con vencimiento en los próximos 21 días." /><StatusBanner headline={`${overdueCount} vencidos · ${upcomingCount} próximos`} detail="Selecciona una fila para abrir la brecha correspondiente en Analista." icon="notifications" /><section className="nava-panel"><SectionHeading title="Compromisos por revisar" detail="Ordenados por fecha de vencimiento" />{warningsContent}</section></div>;

  if (view === "documentos") return <div className="nava-view"><PageHeading eyebrow="Gerencia · Evidencias" title="Estado documental" description="Disponibilidad de las evidencias y su cumplimiento, filtrados por área o responsable." /><StatusBanner headline={`${unavailableCount + unreportedCount} documentos por revisar`} detail={`${availableCount} disponibles · ${unavailableCount} no disponibles · ${naCount} no aplican · ${unreportedCount} sin informar`} icon="folder_open" /><div className="nava-shortcut-grid nava-document-kpis" aria-label="Accesos rápidos a estados documentales">
    <KpiCard label="Todos" value={project.evidencias.length} detail="Ver matriz completa" icon="folder_open" active={filters.documents.availability === "todos"} onClick={() => setDocumentAvailability("todos")} />
    <KpiCard label="Pendientes" value={unavailableCount + unreportedCount} detail="No disponibles o sin informar" icon="pending_actions" tone="warning" active={filters.documents.availability === "pendientes"} onClick={() => setDocumentAvailability("pendientes")} />
    <KpiCard label="Disponibles" value={availableCount} detail="Evidencias disponibles" icon="check_circle" tone="positive" active={filters.documents.availability === "Si"} onClick={() => setDocumentAvailability("Si")} />
  </div><section className="nava-panel"><SectionHeading title="Evidencias por responsable" detail="El avance es el promedio de las brechas asociadas a cada evidencia." />{documentContent}</section></div>;

  const temaByCriterion = new Map(temaSummary.flatMap((tema) => tema.criterios.map((item) => [item.criterio.split(".")[0], tema] as const)));
  return <div className="nava-view"><PageHeading eyebrow="Gerencia · Foco" title="Criterios críticos" description="Criterios con menor avance y mayor cantidad de brechas abiertas." /><StatusBanner headline="Prioridad de seguimiento" detail="Selecciona un criterio para abrirlo en Analista y revisar sus brechas asociadas." icon="flag" /><section className="nava-shortcut-grid nava-critical-shortcuts" aria-label="Acceso a los tres criterios de menor avance">{insights.weakCriteria.slice(0, 3).map((criterion) => <KpiCard key={criterion.id} label={`Criterio ${criterion.id}`} value={pct(criterion.pct)} detail={`${criterion.abiertas} brechas abiertas · abrir`} icon="flag" tone={criterion.pct !== null && criterion.pct < 0.5 ? "risk" : "warning"} onClick={() => onOpenAnalyst(criterion.id)} />)}</section><section className="nava-panel"><SectionHeading title="Menor avance" detail="Top 5 según el cumplimiento calculado de la matriz" /><div className="nava-critical-list">{insights.weakCriteria.map((criterion, index) => { const group = groups.find((item) => item.id === criterion.id); const status = getSemaphore(criterion.pct); const theme = temaByCriterion.get(criterion.id); return <button key={criterion.id} type="button" className="nava-critical-row" onClick={() => onOpenAnalyst(criterion.id)}><span className="nava-critical-row__rank">{String(index + 1).padStart(2, "0")}</span><span className="nava-critical-row__code">C{criterion.id}</span><span className="nava-critical-row__main"><strong>{getCriterionLabel(criterion.id) || criterion.nombre}</strong><small>{group?.detalles.length ?? 0} subcriterios · {theme?.nombre ?? "Criterio GISTM"}</small></span><span className="nava-critical-row__bar"><i style={{ width: `${Math.max(0, Math.min(100, (criterion.pct ?? 0) * 100))}%`, backgroundColor: status.bar }} /></span><StatusBadge value={criterion.pct} /><span className="nava-critical-row__open">{criterion.abiertas}<small>abiertas</small></span><MaterialIcon name="chevron_right" /></button>; })}</div></section><section className="nava-section"><SectionHeading title="Todos los criterios" detail="Clic para abrir el criterio 1–15 en Analista" /><div className="nava-criterion-map">{groups.map((group) => <button key={group.id} className="nava-criterion-tile" type="button" onClick={() => onOpenAnalyst(group.id)}><span className="nava-criterion-tile__top"><span>C{group.id}</span><MaterialIcon name={getSemaphore(group.pctPromedio).icon} /></span><strong>{getCriterionLabel(group.id)}</strong><span className="nava-criterion-tile__stats"><b>{pct(group.pctPromedio)}</b><span>{group.brechasAbiertas} abiertas</span></span></button>)}</div></section></div>;
}

function KpiLine({ insights }: { insights: ReturnType<typeof getManagementInsights> }) {
  return <div className="nava-kpi-line"><KpiCard label="Avance real" value={pct(insights.totalPct)} detail="Promedio GISTM" tone="positive" /><KpiCard label="Esperado" value={pct(insights.expectedPct)} detail="Plan lineal" /><KpiCard label="Desviación" value={signedPct(insights.gapPct)} detail="Real vs plan" tone={insights.gapPct !== null && insights.gapPct < 0 ? "risk" : "positive"} /><KpiCard label="Brechas abiertas" value={insights.openBrechas} detail="De las relaciones evaluadas" /></div>;
}

function MilestoneTable({ points }: { points: ProgressPoint[] }) {
  return <div className="nava-milestone-table"><table><thead><tr><th>Hito</th><th>Avance real</th><th>Avance esperado</th></tr></thead><tbody>{points.map((point) => <tr key={point.label}><td>{point.label} 2026</td><td>{pct(point.real)}</td><td>{pct(point.expected)}</td></tr>)}</tbody></table></div>;
}

export { ManagementDashboard };
