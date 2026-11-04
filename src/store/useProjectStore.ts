import { create } from "zustand";
import { persist } from "zustand/middleware";
import evidenciasTemplateData from "../data/evidenciasTemplate.json";
import evidenciaCriterioTemplateData from "../data/evidenciaCriterioTemplate.json";
import p25006RealData from "../data/p25006.real.json";
import mmgLasBambasData from "../data/mmg-las-bambas.real.json";
import temaCriteriosData from "../data/temaCriterios.json";
import {
  Brecha,
  BrechaKey,
  Evidencia,
  EvidenciaCriterioTemplate,
  EvidenciaTemplate,
  Proyecto,
  Rol,
  Tema
} from "../types";

export type AppView = "resumen" | "avance" | "warnings" | "documentos" | "criterios" | "analista";
export type WarningFilter = "todos" | "vencida" | "proxima";
export type DocumentAvailabilityFilter = "todos" | "Si" | "No" | "NA" | "sin-informar" | "pendientes";
export type ProgressSeries = "ambas" | "real" | "esperado";

type DashboardFilters = {
  warnings: { status: WarningFilter; owner: string };
  documents: { owner: string; availability: DocumentAvailabilityFilter };
  curve: { series: ProgressSeries };
};

type ProjectState = {
  role: Rol;
  proyectos: Proyecto[];
  currentProjectId: string;
  selectedEvidenceId: number | null;
  selectedBrecha: BrechaKey | null;
  view: AppView;
  analystCriterion: string | null;
  analystSubcriterion: string | null;
  dashboardFilters: DashboardFilters;
  collapsedThemes: string[];
  temas: Tema[];
  setRole: (role: Rol) => void;
  setView: (view: AppView) => void;
  setAnalystLocation: (criterion: string | null, subcriterion?: string | null) => void;
  setDashboardFilters: (patch: Partial<DashboardFilters>) => void;
  setCurrentProject: (projectId: string) => void;
  createProject: (cliente: string) => void;
  selectEvidence: (evidenceId: number | null) => void;
  selectBrecha: (brecha: BrechaKey | null) => void;
  toggleTheme: (themeId: string) => void;
  updateEvidence: (projectId: string, evidenceId: number, patch: Partial<Evidencia>) => void;
  updateBrecha: (projectId: string, evidenciaId: number, criterio: string, patch: Partial<Brecha>) => void;
  resetDemo: () => void;
};

const evidenciasTemplate = evidenciasTemplateData as EvidenciaTemplate[];
const evidenciaCriterioTemplate = evidenciaCriterioTemplateData as EvidenciaCriterioTemplate[];
const p25006Real = p25006RealData as {
  project: Pick<Proyecto, "id" | "nombre" | "cliente" | "fechaEvaluacion">;
  evidencias: Evidencia[];
  brechas: Brecha[];
};
const mmgLasBambasReal = mmgLasBambasData as {
  project: Pick<Proyecto, "id" | "nombre" | "cliente" | "fechaEvaluacion" | "fechaCorte" | "principiosActivos" | "metodoAgregacion" | "serieTemporalDisponible" | "fechasCompromisoSinteticas">;
  evidencias: Evidencia[];
  brechas: Brecha[];
};
const temas = temaCriteriosData as Tema[];

const defaultDashboardFilters: DashboardFilters = {
  warnings: { status: "todos", owner: "Todos" },
  documents: { owner: "Todos", availability: "todos" },
  curve: { series: "ambas" }
};

function readInitialNavigation() {
  if (typeof window === "undefined") return { view: "resumen" as AppView, criterion: null, subcriterion: null, brecha: null };
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get("vista") as AppView | null;
  const view: AppView = requestedView && ["resumen", "avance", "warnings", "documentos", "criterios", "analista"].includes(requestedView)
    ? requestedView
    : "resumen";
  const code = params.get("c") ?? "";
  const validCode = /^\d{1,2}(?:\.\d{1,2})?$/.test(code) ? code : null;
  const [criterion, subcriterion] = validCode ? [validCode.split(".")[0], validCode.includes(".") ? validCode : null] : [null, null];
  const evidenceParam = params.get("f") ?? "";
  const separator = evidenceParam.indexOf("|");
  const evidenceId = separator > 0 ? Number(evidenceParam.slice(0, separator)) : NaN;
  const criterio = separator > 0 ? evidenceParam.slice(separator + 1) : "";
  const brecha = Number.isInteger(evidenceId) && evidenceId > 0 && criterio ? { evidenciaId: evidenceId, criterio } : null;
  return { view, criterion, subcriterion, brecha };
}

function relationTemplates() {
  return evidenciaCriterioTemplate.flatMap((item) =>
    item.criterios.map((criterio) => ({
      evidenciaId: item.evidenciaId,
      criterio,
      documento: evidenciasTemplate.find((evidencia) => evidencia.id === item.evidenciaId)?.descripcion ?? ""
    }))
  );
}

function buildBlankProject(cliente: string): Proyecto {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    nombre: `GISTM - ${cliente}`,
    cliente,
    fechaEvaluacion: now.slice(0, 10),
    createdAt: now,
    evidencias: evidenciasTemplate.map((item) => ({ ...item, responsable: "", disponible: "", referenciaDocumental: "" })),
    brechas: relationTemplates().map((item) => ({
      ...item,
      cumplimiento: 0,
      plan: null,
      brechaPlan: "",
      responsableBrecha: "",
      fechaCompromiso: "",
      referenciaDocumental: ""
    }))
  };
}

function buildP25006Project(): Proyecto {
  return {
    ...p25006Real.project,
    createdAt: "2026-01-30T12:00:00.000Z",
    evidencias: p25006Real.evidencias,
    brechas: p25006Real.brechas
  };
}

function buildMmgLasBambasProject(): Proyecto {
  return {
    ...mmgLasBambasReal.project,
    createdAt: "2026-11-03T12:00:00.000Z",
    evidencias: mmgLasBambasReal.evidencias,
    brechas: mmgLasBambasReal.brechas
  };
}

function initialState() {
  const navigation = readInitialNavigation();
  return {
    role: navigation.view === "analista" ? ("analista" as Rol) : ("cliente" as Rol),
    proyectos: [buildMmgLasBambasProject(), buildP25006Project()],
    currentProjectId: "mmg-lb-tsf1",
    selectedEvidenceId: null as number | null,
    selectedBrecha: navigation.view === "analista" ? navigation.brecha : null,
    view: navigation.view,
    analystCriterion: navigation.criterion,
    analystSubcriterion: navigation.subcriterion,
    dashboardFilters: defaultDashboardFilters,
    collapsedThemes: [],
    temas
  };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      ...initialState(),
      setRole: (role) => set({ role, view: role === "analista" ? "analista" : "resumen", selectedEvidenceId: null, selectedBrecha: null }),
      setView: (view) => set({ view, role: view === "analista" ? "analista" : "cliente" }),
      setAnalystLocation: (criterion, subcriterion = null) => set({ analystCriterion: criterion, analystSubcriterion: subcriterion }),
      setDashboardFilters: (patch) => set((state) => ({
        dashboardFilters: {
          warnings: { ...state.dashboardFilters.warnings, ...patch.warnings },
          documents: { ...state.dashboardFilters.documents, ...patch.documents },
          curve: { ...state.dashboardFilters.curve, ...patch.curve }
        }
      })),
      setCurrentProject: (projectId) => set({ currentProjectId: projectId, selectedEvidenceId: null, selectedBrecha: null }),
      createProject: (cliente) => {
        const project = buildBlankProject(cliente);
        set((state) => ({
          proyectos: [project, ...state.proyectos],
          currentProjectId: project.id,
          selectedEvidenceId: null,
          selectedBrecha: null,
          role: "cliente",
          view: "resumen",
          analystCriterion: null,
          analystSubcriterion: null
        }));
      },
      selectEvidence: (evidenceId) => set({ selectedEvidenceId: evidenceId, selectedBrecha: null }),
      selectBrecha: (brecha) => set({ selectedBrecha: brecha, selectedEvidenceId: null }),
      toggleTheme: (themeId) =>
        set((state) => ({
          collapsedThemes: state.collapsedThemes.includes(themeId)
            ? state.collapsedThemes.filter((item) => item !== themeId)
            : [...state.collapsedThemes, themeId]
        })),
      updateEvidence: (projectId, evidenceId, patch) =>
        set((state) => ({
          proyectos: state.proyectos.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  evidencias: project.evidencias.map((evidencia) => (evidencia.id === evidenceId ? { ...evidencia, ...patch } : evidencia))
                }
              : project
          )
        })),
      updateBrecha: (projectId, evidenciaId, criterio, patch) =>
        set((state) => ({
          proyectos: state.proyectos.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  brechas: project.brechas.map((brecha) =>
                    brecha.evidenciaId === evidenciaId && brecha.criterio === criterio ? { ...brecha, ...patch } : brecha
                  )
                }
              : project
          )
        })),
      resetDemo: () => set(initialState())
    }),
    {
      name: "nava-gistm-demo-v7-project-edits",
      partialize: (state) => ({ proyectos: state.proyectos, currentProjectId: state.currentProjectId })
    }
  )
);
