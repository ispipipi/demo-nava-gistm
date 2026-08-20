import { create } from "zustand";
import { persist } from "zustand/middleware";
import evidenciasTemplateData from "../data/evidenciasTemplate.json";
import evidenciaCriterioTemplateData from "../data/evidenciaCriterioTemplate.json";
import p25006SeedData from "../data/p25006.brechas.json";
import temaCriteriosData from "../data/temaCriterios.json";
import {
  Brecha,
  Cumplimiento,
  Evidencia,
  EvidenciaCriterioTemplate,
  EvidenciaTemplate,
  PlanAccion,
  Proyecto,
  Rol,
  Tema
} from "../types";
import { clampPct } from "../lib/aggregations";

type SeedItem = {
  evidenciaId: number;
  baseCumplimiento: Cumplimiento;
  plan: PlanAccion;
  responsable: string;
  disponible: "Si" | "No" | "NA";
};

type ProjectState = {
  role: Rol;
  proyectos: Proyecto[];
  currentProjectId: string;
  selectedEvidenceId: number | null;
  collapsedThemes: string[];
  temas: Tema[];
  setRole: (role: Rol) => void;
  setCurrentProject: (projectId: string) => void;
  createProject: (cliente: string) => void;
  selectEvidence: (evidenceId: number | null) => void;
  toggleTheme: (themeId: string) => void;
  updateEvidence: (projectId: string, evidenceId: number, patch: Partial<Evidencia>) => void;
  updateBrecha: (projectId: string, evidenciaId: number, criterio: string, patch: Partial<Brecha>) => void;
  resetDemo: () => void;
};

const evidenciasTemplate = evidenciasTemplateData as EvidenciaTemplate[];
const evidenciaCriterioTemplate = evidenciaCriterioTemplateData as EvidenciaCriterioTemplate[];
const p25006Seed = p25006SeedData as SeedItem[];
const temas = temaCriteriosData as Tema[];

function relationTemplates() {
  return evidenciaCriterioTemplate.flatMap((item) =>
    item.criterios.map((criterio) => ({
      evidenciaId: item.evidenciaId,
      criterio
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
      responsableBrecha: "",
      fechaCompromiso: "",
      referenciaDocumental: ""
    }))
  };
}

function pctForSeed(seed: SeedItem | undefined, evidenciaId: number, criterionIndex: number): Cumplimiento {
  if (seed?.baseCumplimiento === "NA") return "NA";
  if (!seed) {
    const wave = ((evidenciaId * 17 + criterionIndex * 11) % 84) / 100;
    return clampPct(0.12 + wave);
  }
  const adjustment = criterionIndex === 0 ? 0.06 : criterionIndex === 1 ? -0.03 : -0.1;
  return clampPct(seed.baseCumplimiento + adjustment);
}

function buildP25006Project(): Proyecto {
  const seedByEvidence = new Map(p25006Seed.map((item) => [item.evidenciaId, item]));
  const seedProject = buildBlankProject("Cliente P25-006");
  return {
    ...seedProject,
    id: "p25-006",
    nombre: "Cliente P25-006",
    fechaEvaluacion: "2026-01-30",
    createdAt: "2026-01-30T12:00:00.000Z",
    evidencias: seedProject.evidencias.map((evidencia) => {
      const seed = seedByEvidence.get(evidencia.id);
      return {
        ...evidencia,
        responsable: seed?.responsable ?? defaultOwner(evidencia.tipo),
        disponible: seed?.disponible ?? (evidencia.id % 9 === 0 ? "No" : "Si"),
        referenciaDocumental: evidencia.id % 7 === 0 ? "Repositorio Nava / carpeta GISTM / pendiente de version final" : "Repositorio Nava / evidencia cargada"
      };
    }),
    brechas: seedProject.brechas.map((brecha) => {
      const seed = seedByEvidence.get(brecha.evidenciaId);
      const relationIndex = evidenciaCriterioTemplate
        .find((item) => item.evidenciaId === brecha.evidenciaId)
        ?.criterios.findIndex((criterio) => criterio === brecha.criterio) ?? 0;
      const cumplimiento = pctForSeed(seed, brecha.evidenciaId, relationIndex);
      const plan = cumplimiento === "NA" ? "NA" : seed?.plan ?? planForPct(cumplimiento);
      return {
        ...brecha,
        cumplimiento,
        plan,
        responsableBrecha: plan === "Cumple" || plan === "NA" ? "" : seed?.responsable ?? defaultOwnerByCriterion(brecha.criterio),
        fechaCompromiso: plan === "Cumple" || plan === "NA" ? "" : dueDateForEvidence(brecha.evidenciaId),
        referenciaDocumental: plan === "Cumple" ? "Documento validado en carpeta de proyecto" : "Pendiente de cierre / version en revision"
      };
    })
  };
}

function defaultOwner(tipo: string) {
  const owners: Record<string, string> = {
    GOB: "Gobernanza Mina",
    "ADM/RRHH": "Gestion Personas",
    POL: "Relacionamiento Comunitario",
    "S&A": "Medio Ambiente",
    TEC: "Operacion Relaves",
    TKB: "Control Documental"
  };
  return owners[tipo] ?? "Equipo Nava";
}

function defaultOwnerByCriterion(criterio: string) {
  if (criterio.startsWith("9.") || criterio.startsWith("10.")) return "Emergencias";
  if (criterio.startsWith("13.") || criterio.startsWith("14.")) return "Comunicaciones";
  if (criterio.startsWith("7.") || criterio.startsWith("8.")) return "Operacion Relaves";
  return "Equipo Nava";
}

function planForPct(value: number): PlanAccion {
  if (value >= 0.75) return "Cumple";
  if (value >= 0.5) return "Actualizar";
  return "Recopilar-Elaborar";
}

function dueDateForEvidence(evidenciaId: number) {
  const date = new Date("2026-03-15T12:00:00.000Z");
  date.setDate(date.getDate() + evidenciaId * 2);
  return date.toISOString().slice(0, 10);
}

function initialState() {
  return {
    role: "analista" as Rol,
    proyectos: [buildP25006Project()],
    currentProjectId: "p25-006",
    selectedEvidenceId: null,
    collapsedThemes: [],
    temas
  };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      ...initialState(),
      setRole: (role) => set({ role, selectedEvidenceId: role === "cliente" ? null : undefined }),
      setCurrentProject: (projectId) => set({ currentProjectId: projectId, selectedEvidenceId: null }),
      createProject: (cliente) => {
        const project = buildBlankProject(cliente);
        set((state) => ({
          proyectos: [project, ...state.proyectos],
          currentProjectId: project.id,
          selectedEvidenceId: null,
          role: "analista"
        }));
      },
      selectEvidence: (evidenceId) => set({ selectedEvidenceId: evidenceId }),
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
      name: "nava-gistm-demo-v1"
    }
  )
);
