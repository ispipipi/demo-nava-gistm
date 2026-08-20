export type PlanAccion = "Cumple" | "Cumple con compromiso" | "Actualizar" | "Recopilar-Elaborar" | "NA";
export type SemaforoEstado = "verde" | "amarillo" | "naranjo" | "rojo" | "gris";
export type Rol = "analista" | "cliente";
export type Cumplimiento = number | "NA";

export type TipoEvidencia = "ADM/RRHH" | "GOB" | "POL" | "S&A" | "TEC" | "TKB";

export type EvidenciaTemplate = {
  id: number;
  descripcion: string;
  tipo: TipoEvidencia;
};

export type Evidencia = EvidenciaTemplate & {
  responsable?: string;
  disponible?: "Si" | "No" | "NA" | "";
  referenciaDocumental?: string;
};

export type EvidenciaCriterioTemplate = {
  evidenciaId: number;
  criterios: string[];
};

export type Brecha = {
  evidenciaId: number;
  criterio: string;
  cumplimiento: Cumplimiento;
  plan: PlanAccion | null;
  responsableBrecha?: string;
  fechaCompromiso?: string;
  referenciaDocumental?: string;
};

export type Tema = {
  id: string;
  nombre: string;
  descripcion: string;
  criterioPrefixes: string[];
};

export type Proyecto = {
  id: string;
  nombre: string;
  cliente: string;
  fechaEvaluacion: string;
  evidencias: Evidencia[];
  brechas: Brecha[];
  createdAt: string;
};

export type Semaforo = {
  estado: SemaforoEstado;
  label: string;
  className: string;
};

export type TemaResumen = Tema & {
  pctPromedio: number | null;
  criterios: Array<{ criterio: string; pct: number | null }>;
  evidenciasCount: number;
  brechasAbiertas: number;
};
