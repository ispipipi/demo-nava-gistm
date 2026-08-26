import { Proyecto } from "../types";
import { ManagementDashboard } from "./ManagementDashboard";

export function ClientDashboard({ project }: { project: Proyecto }) {
  return <ManagementDashboard project={project} />;
}
