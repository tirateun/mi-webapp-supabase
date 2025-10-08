import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsProps {
  user: any;
  role: string;
}

export default function Agreements({ user, role }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [internalResponsible, setInternalResponsible] = useState("");
  const [externalResponsible, setExternalResponsible] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [durationYears, setDurationYears] = useState(1);
  const [convenio, setConvenio] = useState("marco");
  const [pais, setPais] = useState("Perú");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const countries = [
    "Perú","Argentina","Bolivia","Brasil","Chile","Colombia","Ecuador","México",
    "Uruguay","Paraguay","Venezuela","España","Estados Unidos","Canadá","Francia",
    "Alemania","Italia","Japón","China","Corea del Sur","India","Reino Unido",
    "Australia","Sudáfrica"
  ];

  const fetchAgreements = async () => {
    let query = supabase.from("agreements").select(`
      id,name,institution,internal_responsible,external_responsible,
      signature_date,duration_years,expiration_date,convenio,pais
    `);

    if (role !== "admin") {
      query = query.or(
        `internal_responsible.eq.${user.id},external_responsible.eq.${user.id}`
      );
    }

    const { data, error } = await query;
    if (!error) setAgreements(data || []);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name", { ascending: true });
    if (!error) setProfiles(data || []);
  };

  useEffect(() => {
    fetchAgreements();
    fetchProfiles();
  }, []);

  const handleAddAgreement = async () => {
    setLoading(true);
    const { error } = await supabase.from("agreements").insert([
      {
        name,
        institution,
        internal_responsible: internalResponsible,
        external_responsible: externalResponsible,
        signature_date: signatureDate,
        duration_years: durationYears,
        convenio,
        pais,
      },
    ]);

    if (!error) {
      await fetchAgreements();
      setName("");
      setInstitution("");
      setInternalResponsible("");
      setExternalResponsible("");
      setSignatureDate("");
      setDurationYears(1);
      setConvenio("marco");
      setPais("Perú");
    }
    setLoading(false);
  };

  const handleDeleteAgreement = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;
    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (!error) fetchAgreements();
  };

  return (
    <div id="convenios">
      <h2>📑 Lista de Convenios</h2>

      {role === "admin" && (
        <div style={{marginTop:"20px",padding:"20px",border:"1px solid #ccc",borderRadius:"10px",maxWidth:"600px"}}>
          <h3>➕ Agregar Convenio</h3>
          <input type="text" placeholder="Nombre del convenio" value={name} onChange={(e)=>setName(e.target.value)} style={{margin:"5px",padding:"8px",width:"100%"}}/>
          <input type="text" placeholder="Institución" value={institution} onChange={(e)=>setInstitution(e.target.value)} style={{margin:"5px",padding:"8px",width:"100%"}}/>

          <label>Responsable Interno:</label>
          <select value={internalResponsible} onChange={(e)=>setInternalResponsible(e.target.value)} style={{margin:"5px",padding:"8px",width:"100%"}}>
            <option value="">Seleccione responsable interno</option>
            {profiles.filter(p=>p.role==="internal").map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>

          <label>Responsable Externo:</label>
          <select value={externalResponsible} onChange={(e)=>setExternalResponsible(e.target.value)} style={{margin:"5px",padding:"8px",width:"100%"}}>
            <option value="">Seleccione responsable externo</option>
            {profiles.filter(p=>p.role==="external").map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>

          <label>Fecha de Firma:</label>
          <input type="date" value={signatureDate} onChange={(e)=>setSignatureDate(e.target.value)} style={{margin:"5px",padding:"8px",width:"100%"}}/>

          <label>Años de duración:</label>
          <input type="number" value={durationYears} onChange={(e)=>setDurationYears(parseInt(e.target.value))} min={1} max={20} style={{margin:"5px",padding:"8px",width:"100%"}}/>

          <label>Tipo de Convenio:</label>
          <select value={convenio} onChange={(e)=>setConvenio(e.target.value)} style={{margin:"5px",padding:"8px",width:"100%"}}>
            <option value="marco">Marco</option>
            <option value="especifico">Específico</option>
          </select>

          <label>País:</label>
          <select value={pais} onChange={(e)=>setPais(e.target.value)} style={{margin:"5px",padding:"8px",width:"100%"}}>
            {countries.map(c=><option key={c} value={c}>{c}</option>)}
          </select>

          <button onClick={handleAddAgreement} disabled={loading} style={{marginTop:"10px",padding:"10px",background:"#3b82f6",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",width:"100%"}}>
            {loading?"Guardando...":"Guardar"}
          </button>
        </div>
      )}

      <h3 style={{marginTop:"30px"}}>Convenios Registrados</h3>
      <table style={{width:"100%",borderCollapse:"collapse",marginTop:"10px"}}>
        <thead>
          <tr style={{background:"#f1f1f1"}}>
            <th>Nombre</th>
            <th>Institución</th>
            <th>Resp. Interno</th>
            <th>Resp. Externo</th>
            <th>Fecha Firma</th>
            <th>Años</th>
            <th>Vencimiento</th>
            <th>Convenio</th>
            <th>País</th>
            {role==="admin" && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {agreements.length===0?
            <tr><td colSpan={10} style={{textAlign:"center",padding:"10px"}}>No hay convenios registrados.</td></tr>
          :
            agreements.map(a=>(
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.institution}</td>
                <td>{a.internal_responsible}</td>
                <td>{a.external_responsible}</td>
                <td>{a.signature_date}</td>
                <td>{a.duration_years}</td>
                <td>{a.expiration_date}</td>
                <td>{a.convenio}</td>
                <td>{a.pais}</td>
                {role==="admin" && (
                  <td>
                    <button onClick={()=>handleDeleteAgreement(a.id)} style={{background:"red",color:"white",border:"none",borderRadius:"6px",padding:"5px 10px",cursor:"pointer"}}>
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}
















