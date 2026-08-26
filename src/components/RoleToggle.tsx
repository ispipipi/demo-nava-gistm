import { useProjectStore } from "../store/useProjectStore";
import { Rol } from "../types";

const roles: Array<{ value: Rol; label: string }> = [
  { value: "analista", label: "Analista" },
  { value: "cliente", label: "Dashboard gerencial" }
];

export function RoleToggle() {
  const { role, setRole } = useProjectStore();

  return (
    <div className="segmented" aria-label="Selector de rol">
      {roles.map((item) => (
        <button key={item.value} className={role === item.value ? "active" : ""} onClick={() => setRole(item.value)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
