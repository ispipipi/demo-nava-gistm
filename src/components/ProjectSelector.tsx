import { FormEvent, useState } from "react";
import { useProjectStore } from "../store/useProjectStore";

export function ProjectSelector() {
  const { proyectos, currentProjectId, setCurrentProject, createProject } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [cliente, setCliente] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const cleanName = cliente.trim();
    if (!cleanName) return;
    createProject(cleanName);
    setCliente("");
    setOpen(false);
  }

  return (
    <div className="project-selector">
      <select value={currentProjectId} onChange={(event) => setCurrentProject(event.target.value)} aria-label="Proyecto activo">
        {proyectos.map((project) => (
          <option key={project.id} value={project.id}>
            {project.nombre}
          </option>
        ))}
      </select>
      <button className="primary-action" onClick={() => setOpen(true)}>
        + Nuevo proyecto
      </button>
      {open && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-card" onSubmit={submit}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Nuevo proyecto GISTM</p>
                <h2>Crear matriz en blanco</h2>
              </div>
              <button type="button" className="icon-action" onClick={() => setOpen(false)} aria-label="Cerrar">
                ×
              </button>
            </div>
            <label className="field-label">
              Cliente minero
              <input value={cliente} onChange={(event) => setCliente(event.target.value)} placeholder="Ej: Minera Norte" autoFocus />
            </label>
            <p className="helper-text">Se generan las evidencias base y sus relaciones con principios GISTM en 0%.</p>
            <div className="modal-actions">
              <button type="button" className="secondary-action" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="primary-action" type="submit">
                Crear proyecto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
