export const criterionLabels: Record<string, string> = {
  "1": "Respect the rights of project-affected people and meaningfully engage them at all phases of the tailings facility lifecycle, including closure.",
  "2": "Develop and maintain an interdisciplinary knowledge base to support safe tailings management throughout the tailings facility lifecycle, including closure.",
  "3": "Use all elements of the knowledge base - social, environmental, local economic and technical - to inform decisions throughout the tailings facility lifecycle, including closure.",
  "4": "Develop plans and design criteria for the tailings facility to minimise risk for all phases of its lifecycle, including closure and post closure.",
  "5": "Develop a robust design that integrates the knowledge base and minimises the risk of failure to people and the environment for all phases of the tailings facility lifecycle, including closure and post-closure.",
  "6": "Plan, build and operate the tailings facility to manage risk at all phases of the tailings facility lifecycle, including closure and post-closure.",
  "7": "Design, implement and operate monitoring systems to manage risk at all phases of the facility lifecycle, including closure.",
  "8": "Establish policies, systems and accountabilities to support the safety and integrity of the tailings facility.",
  "9": "Appoint and empower an Engineer of Record.",
  "10": "Establish and implement levels of review as part of a strong quality and risk management system for all phases of the tailings facility lifecycle, including closure.",
  "11": "Develop an organisational culture that promotes learning, communication and early problem recognition.",
  "12": "Establish a process for reporting and addressing concerns and implement whistleblower protections.",
  "13": "Prepare for emergency response to tailings facility failures.",
  "14": "Prepare for long term recovery in the event of catastrophic failure.",
  "15": "Publicly disclose and provide access to information about the tailings facility to support public accountability."
};

export function getCriterionLabel(id: string) {
  return criterionLabels[id] ?? `Principio ${id}`;
}
