import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function ConvenioResponsables({ convenioId }: { convenioId: string }) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [responsables, setResponsables] = useState<any[]>([]);
  const [nuevoResp, setNuevoResp] = useState("");

  useEffect(() => {
    const fetchUsuarios = async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").eq("role", "internal");
      setUsuarios(data || []);
    };

    const fetchResponsables = async () => {
      const { data } = await supabase
        .from("convenio_responsables")
        .select("id, user_id, profiles(full_name)")
        .eq("convenio_id", convenioId);
      setResponsables(data || []);
    };

    fetchUsuarios();
    fetchResponsables();
  }, [convenioId]);

  const agregarResponsable = async () => {
    if (!nuevoResp) return alert("Seleccione un responsable.");
    const { error } = await supabase.from("convenio_responsables").insert([
      { convenio_id: convenioId, user_id: nuevoResp },
    ]);
    if (error) alert("Error: " + error.message);
    else location.reload();
  };

  const eliminarResponsable = async (id: string) => {
    const { error } = await supabase.from("convenio_responsables").delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else location.reload();
  };

  return (
    <div className="mt-3">
      <h5>👥 Responsables Internos</h5>
      <ul className="list-group mb-3">
        {responsables.map((r) => (
          <li key={r.id} className="list-group-item d-flex justify-content-between align-items-center">
            {r.profiles?.full_name}
            <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarResponsable(r.id)}>
              🗑️
            </button>
          </li>
        ))}
      </ul>

      <div className="d-flex">
        <select
          className="form-select me-2"
          value={nuevoResp}
          onChange={(e) => setNuevoResp(e.target.value)}
        >
          <option value="">Seleccione usuario interno</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={agregarResponsable}>
          ➕ Agregar
        </button>
      </div>
    </div>
  );
}
