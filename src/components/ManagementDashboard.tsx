import { useMemo, useState } from "react";
import { getManagementInsights } from "../lib/managementDashboard";
import type { ProgressPoint } from "../lib/managementDashboard";
import { formatPct, getSemaphore } from "../lib/semaphore";
import type { Proyecto } from "../types";
import { TemaCard } from "./TemaCard";
import { getTemaResumen } from "../lib/aggregations";
import { useProjectStore } from "../store/useProjectStore";

function pct(value: number | null) {
  return formatPct(value);
}

function signedPct(value: number | null) {
  if (value === null) return "NA";
  const rounded = Math.round(value * 100);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

function ProgressChart({ points }: { points: ProgressPoint[] }) {
  const width = 620;
  const height = 250;
  const padding = { top: 22, right: 22, bottom: 42, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const x = (index: number) => padding.left + (chartWidth / Math.max(1, points.length - 1)) * index;
  const y = (value: number) => padding.top + chartHeight - chartHeight * value;
  const expectedPath = points.map((point, index) => `${x(index)},${y(point.expected)}`).join(" ");
  const realPoints = points.filter((point) => point.real !== null);
  const realPath = realPoints.map((point) => `${x(points.indexOf(point))},${y(point.real ?? 0)}`).join(" ");

  return (
    <div className="management-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Curva avance real versus esperado">
        {[0, 0.25, 0.5, 0.75, 1].map((line) => (
          <g key={line}>
            <line x1={padding.left} x2={width - padding.right} y1={y(line)} y2={y(line)} />
            <text x={12} y={y(line) + 4}>{Math.round(line * 100)}%</text>
          </g>
        ))}
        <polyline className="expected-line" points={expectedPath} />
        <polyline className="real-line" points={realPath} />
        {points.map((point, index) => (
          <g key={point.label}>
            <text className="month-label" x={x(index)} y={height - 13}>{point.label}</text>
            <circle className="expected-dot" cx={x(index)} cy={y(point.expected)} r="4" />
            {point.real !== null && <circle className="real-dot" cx={x(index)} cy={y(point.real)} r="5" />}
          </g>
        ))}
      </svg>
      <div className="chart-legend">
        <span><i className="legend-real" />Avance real</span>
        <span><i className="legend-expected" />Avance esperado</span>
      </div>
    </div>
  );
}

export function ManagementDashboard({ project }: { project: Proyecto }) {
  const temas = useProjectStore((state) => state.temas);
  const insights = useMemo(() => getManagementInsights(project), [project]);
  const resumen = useMemo(() => getTemaResumen(temas, project.evidencias, project.brechas), [temas, project]);
  const [ownerFilter, setOwnerFilter] = useState("Todos");
  const semaforo = getSemaphore(insights.totalPct);
  const filteredOwners =
    ownerFilter === "Todos" ? insights.documentOwners : insights.documentOwners.filter((owner) => owner.owner === ownerFilter);

  return (
    <section className="management-dashboard">
      <div className="management-hero">
        <div>
          <p className="eyebrow">Dashboard gerencial</p>
          <h2>Resumen ejecutivo de avance y riesgo</h2>
          <p>KPIs de cumplimiento, alertas de compromisos y estado documental para reuniones de seguimiento.</p>
        </div>
        <div className="management-kpi-strip">
          <div>
            <span className={`status-badge ${semaforo.className}`}>{semaforo.label}</span>
            <strong>{pct(insights.totalPct)}</strong>
            <small>Avance real</small>
          </div>
          <div>
            <strong>{pct(insights.expectedPct)}</strong>
            <small>Avance esperado</small>
          </div>
          <div>
            <strong className={insights.gapPct !== null && insights.gapPct < 0 ? "risk-text" : "ok-text"}>{signedPct(insights.gapPct)}</strong>
            <small>Brecha vs plan</small>
          </div>
          <div>
            <strong>{insights.openBrechas}</strong>
            <small>Brechas abiertas</small>
          </div>
        </div>
      </div>

      <div className="management-grid">
        <section className="management-panel chart-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Curva de avance</p>
              <h2>Real vs esperado</h2>
            </div>
            <span className="status-badge badge-gray">Proyeccion demo</span>
          </div>
          <ProgressChart points={insights.progressCurve} />
        </section>

        <section className="management-panel warning-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Warnings</p>
              <h2>Compromisos críticos</h2>
            </div>
            <span className="status-badge badge-red">{insights.overdueCount} vencidos</span>
          </div>
          <div className="warning-summary">
            <div>
              <strong>{insights.overdueCount}</strong>
              <small>Vencidos</small>
            </div>
            <div>
              <strong>{insights.upcomingCount}</strong>
              <small>Proximos 21 dias</small>
            </div>
          </div>
          <div className="warning-list">
            {insights.warnings.map((warning) => (
              <article key={warning.id} className={`warning-item warning-${warning.status}`}>
                <span>{warning.status === "vencida" ? "Vencida" : "Proxima"}</span>
                <strong>{warning.criterio} · E{String(warning.evidenciaId).padStart(2, "0")}</strong>
                <p>{warning.evidencia}</p>
                <small>{warning.owner} · {warning.plan} · {formatDate(warning.dueDate)}</small>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="management-grid lower">
        <section className="management-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Documentos</p>
              <h2>Status por responsable</h2>
            </div>
            <select className="owner-filter" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} aria-label="Filtrar por responsable">
              <option>Todos</option>
              {insights.documentOwners.map((owner) => (
                <option key={owner.owner}>{owner.owner}</option>
              ))}
            </select>
          </div>
          <div className="document-owner-list">
            {filteredOwners.map((owner) => (
              <article key={owner.owner} className="document-owner-row">
                <div>
                  <strong>{owner.owner}</strong>
                  <small>{owner.total} documentos · {owner.pendientes} pendientes · {owner.noAplica} NA</small>
                </div>
                <div className="document-bars" aria-label={`Estado documental ${owner.owner}`}>
                  <span style={{ width: `${(owner.disponibles / owner.total) * 100}%` }} />
                  <i style={{ width: `${(owner.pendientes / owner.total) * 100}%` }} />
                </div>
                <b>{pct(owner.pctPromedio)}</b>
              </article>
            ))}
          </div>
        </section>

        <section className="management-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Foco gerencial</p>
              <h2>Criterios con menor avance</h2>
            </div>
            <span className="status-badge badge-orange">Top 5</span>
          </div>
          <div className="weak-criteria-list">
            {insights.weakCriteria.map((criterion) => (
              <article key={criterion.id}>
                <span>C{criterion.id}</span>
                <div>
                  <strong>{criterion.nombre}</strong>
                  <small>{criterion.abiertas} brechas abiertas</small>
                </div>
                <b>{pct(criterion.pct)}</b>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="management-panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Resumen GISTM</p>
            <h2>Lectura ejecutiva por tema</h2>
          </div>
          <span className="status-badge badge-gray">{insights.pendingDocuments} documentos pendientes</span>
        </div>
        <div className="tema-grid compact">
          {resumen.map((tema) => (
            <TemaCard key={tema.id} tema={tema} />
          ))}
        </div>
      </section>
    </section>
  );
}
