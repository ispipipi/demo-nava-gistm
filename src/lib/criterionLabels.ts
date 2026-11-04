export const criterionLabels: Record<string, string> = {
  "1": "Base de conocimiento",
  "2": "Personas y comunidades",
  "3": "Gobernanza",
  "4": "Responsabilidades",
  "5": "Gestión de riesgos",
  "6": "Mejora continua",
  "7": "Diseño técnico",
  "8": "Operación",
  "9": "Emergencias",
  "10": "Respuesta y preparación",
  "11": "Revisión y assurance",
  "12": "Cierre",
  "13": "Divulgación",
  "14": "Trazabilidad",
  "15": "Aseguramiento externo"
};

export function getCriterionLabel(id: string) {
  return criterionLabels[id] ?? `Criterio ${id}`;
}
