export type PlanAccion =
  | "Cumple"
  | "Cumple con compromiso"
  | "Cumple con plan"
  | "Actualizar"
  | "Modificar"
  | "Recopilar/Elaborar"
  | "No cumple"
  | "NA";
export type SemaforoEstado = "verde" | "amarillo" | "naranjo" | "rojo" | "gris";
export type Rol = "analista" | "cliente";
export type Cumplimiento = number | "NA";

export type TipoEvidencia = "ADM/RRHH" | "GOB" | "POL" | "S&A" | "TEC" | "TKB";

export type EvidenciaTemplate = {
  id: number;
  descripcion: string;
  tipo: TipoEvidencia;
  nivelDocumento?: string;
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
  excelRow?: number;
  evidenciaId: number;
  documento?: string;
  criterio: string;
  cumplimiento: Cumplimiento;
  plan: PlanAccion | null;
  brechaPlan?: string;
  responsableBrecha?: string;
  fechaCompromiso?: string;
  referenciaDocumental?: string;
};

export type BrechaKey = {
  evidenciaId: number;
  criterio: string;
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

export type CriterioDetalleResumen = {
  id: string;
  grupo: string;
  pctPromedio: number | null;
  brechas: Brecha[];
  evidencias: Evidencia[];
  brechasAbiertas: number;
};

export type CriterioGrupoResumen = {
  id: string;
  nombre: string;
  pctPromedio: number | null;
  detalles: CriterioDetalleResumen[];
  evidenciasCount: number;
  brechasAbiertas: number;
};
