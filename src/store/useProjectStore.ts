import { create } from "zustand";
import { persist } from "zustand/middleware";
import evidenciasTemplateData from "../data/evidenciasTemplate.json";
import evidenciaCriterioTemplateData from "../data/evidenciaCriterioTemplate.json";
import p25006RealData from "../data/p25006.real.json";
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

type ProjectState = {
  role: Rol;
  proyectos: Proyecto[];
  currentProjectId: string;
  selectedEvidenceId: number | null;
  selectedBrecha: BrechaKey | null;
  collapsedThemes: string[];
  temas: Tema[];
  setRole: (role: Rol) => void;
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
const temas = temaCriteriosData as Tema[];

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

function initialState() {
  return {
    role: "cliente" as Rol,
    proyectos: [buildP25006Project()],
    currentProjectId: "p25-006",
    selectedEvidenceId: null,
    selectedBrecha: null,
    collapsedThemes: [],
    temas
  };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      ...initialState(),
      setRole: (role) => set({ role, selectedEvidenceId: role === "cliente" ? null : undefined, selectedBrecha: role === "cliente" ? null : undefined }),
      setCurrentProject: (projectId) => set({ currentProjectId: projectId, selectedEvidenceId: null, selectedBrecha: null }),
      createProject: (cliente) => {
        const project = buildBlankProject(cliente);
        set((state) => ({
          proyectos: [project, ...state.proyectos],
          currentProjectId: project.id,
          selectedEvidenceId: null,
          selectedBrecha: null,
          role: "cliente"
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
      name: "nava-gistm-demo-v4-management-menu"
    }
  )
);
