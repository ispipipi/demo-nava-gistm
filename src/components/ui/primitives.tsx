import { useRef, type ReactNode } from "react";
import { getSemaphore } from "../../lib/semaphore";

export function MaterialIcon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbol ${className}`} aria-hidden="true">{name}</span>;
}

export function StatusBadge({ value, label }: { value: number | null; label?: string }) {
  const status = getSemaphore(value);
  return (
    <span className="nava-status" style={{ color: status.fg, backgroundColor: status.bg }}>
      <MaterialIcon name={status.icon} />
      {label ?? status.label}
    </span>
  );
}

export function KpiCard({ label, value, detail, icon, tone = "neutral", active = false, onClick }: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: string;
  tone?: "neutral" | "positive" | "warning" | "risk";
  active?: boolean;
  onClick?: () => void;
}) {
  const content = <><span className="nava-kpi__label">{icon && <MaterialIcon name={icon} />}{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</>;
  return onClick
    ? <button type="button" className={`nava-kpi nava-kpi--${tone} nava-kpi--action${active ? " is-active" : ""}`} onClick={onClick}>{content}</button>
    : <div className={`nava-kpi nava-kpi--${tone}`}>{content}</div>;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; count?: number }>;
  onChange: (value: T) => void;
}) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  function moveSelection(index: number, direction: -1 | 1) {
    const next = (index + direction + options.length) % options.length;
    onChange(options[next].value);
    buttonRefs.current[next]?.focus();
  }
  return (
    <div className="nava-segmented" role="tablist" aria-label={label}>
      {options.map((option, index) => (
        <button key={option.value} ref={(node) => { buttonRefs.current[index] = node; }} type="button" role="tab" aria-selected={value === option.value} tabIndex={value === option.value ? 0 : -1} className={value === option.value ? "is-active" : ""} onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); moveSelection(index, 1); } else if (event.key === "ArrowLeft") { event.preventDefault(); moveSelection(index, -1); } }} onClick={() => onChange(option.value)}>
          {option.label}{option.count !== undefined && <span>{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function FilterChips<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; count?: number }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="nava-filter-chips" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} className={value === option.value ? "is-active" : ""} onClick={() => onChange(option.value)}>
          {value === option.value && <MaterialIcon name="check" />}{option.label}{option.count !== undefined && <span>{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function DataNotice({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "info" }) {
  return (
    <div className={`nava-data-notice nava-data-notice--${tone}`} role="note">
      <MaterialIcon name={tone === "warning" ? "science" : "info"} />
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({ title, detail, action, onAction, positive = false }: {
  title: string;
  detail?: string;
  action?: string;
  onAction?: () => void;
  positive?: boolean;
}) {
  return (
    <div className={`nava-empty-state${positive ? " is-positive" : ""}`}>
      <MaterialIcon name={positive ? "task_alt" : "search_off"} />
      <strong>{title}</strong>
      {detail && <p>{detail}</p>}
      {action && onAction && <button type="button" className="nava-button nava-button--secondary" onClick={onAction}>{action}</button>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="nava-empty-state nava-error-state" role="alert">
      <MaterialIcon name="cloud_off" />
      <strong>No pudimos cargar los datos</strong>
      <button type="button" className="nava-button" onClick={onRetry}>Reintentar</button>
    </div>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return <div className="nava-skeleton" aria-busy="true" aria-label="Cargando contenido">{Array.from({ length: lines }, (_, index) => <span key={index} />)}</div>;
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; onClick?: () => void }> }) {
  return (
    <nav className="nava-breadcrumbs" aria-label="Migas de pan">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 && <MaterialIcon name="chevron_right" />}
          {item.onClick ? <button type="button" onClick={item.onClick}>{item.label}</button> : <strong aria-current="page">{item.label}</strong>}
        </span>
      ))}
    </nav>
  );
}
