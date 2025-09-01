import { useEffect, useMemo, useState } from "react"

const API = import.meta.env.VITE_API_URL

export default function App() {
  const hoy = useMemo(() => new Date().toISOString().slice(0,10), [])
  const [usuarios, setUsuarios] = useState([])
  const [formUsuario, setFormUsuario] = useState({ nombre:"", email:"" })
  const [fecha, setFecha] = useState(hoy)
  const [hora, setHora] = useState("09:00")
  const [usuarioId, setUsuarioId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [turnos, setTurnos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState("")

  async function cargarUsuarios(){
    const r = await fetch(`${API}/api/usuarios`)
    setUsuarios(await r.json())
  }
  async function cargarTurnos(f){
    const r = await fetch(`${API}/api/turnos?fecha=${f}`)
    setTurnos(await r.json())
  }
  useEffect(()=>{ cargarUsuarios(); cargarTurnos(fecha) },[])
  useEffect(()=>{ cargarTurnos(fecha) },[fecha])

  async function crearUsuario(e){
    e.preventDefault()
    setMsg("")
    const r = await fetch(`${API}/api/usuarios`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(formUsuario)
    })
    if(r.ok){ setFormUsuario({nombre:"",email:""}); cargarUsuarios(); setMsg("Usuario creado ✅") }
    else{ const j = await r.json(); setMsg(j.error || "Error") }
  }

  async function crearTurno(e){
    e.preventDefault()
    setMsg("")
    if(!usuarioId) return setMsg("Elegí un usuario")
    setCargando(true)
    const r = await fetch(`${API}/api/turnos`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({usuarioId:Number(usuarioId), fecha, hora, motivo})
    })
    setCargando(false)
    if(r.ok){ setMotivo(""); cargarTurnos(fecha); setMsg("Turno creado ✅") }
    else{ const j = await r.json(); setMsg(j.error || "Error") }
  }

  async function borrarTurno(id){
    if(!confirm("¿Borrar turno?")) return
    const r = await fetch(`${API}/api/turnos/${id}`,{method:"DELETE"})
    if(r.status===204){ cargarTurnos(fecha); setMsg("Turno borrado 🗑️") }
    else { const j = await r.json(); setMsg(j.error || "Error") }
  }

  return (
    <div style={{maxWidth:900, margin:"20px auto", fontFamily:"system-ui, sans-serif"}}>
      <h1>Turnos</h1>

      <section style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20}}>
        <form onSubmit={crearUsuario} style={{border:"1px solid #ddd", padding:12, borderRadius:8}}>
          <h2>Alta de usuario</h2>
          <input required placeholder="Nombre" value={formUsuario.nombre}
                 onChange={e=>setFormUsuario(v=>({...v,nombre:e.target.value}))}
                 style={{display:"block", width:"100%", marginBottom:8}} />
          <input required type="email" placeholder="Email" value={formUsuario.email}
                 onChange={e=>setFormUsuario(v=>({...v,email:e.target.value}))}
                 style={{display:"block", width:"100%", marginBottom:8}} />
          <button>Crear</button>
        </form>

        <form onSubmit={crearTurno} style={{border:"1px solid #ddd", padding:12, borderRadius:8}}>
          <h2>Nuevo turno</h2>
          <label>Usuario</label>
          <select value={usuarioId} onChange={e=>setUsuarioId(e.target.value)}
                  style={{display:"block", width:"100%", marginBottom:8}}>
            <option value="">Seleccioná…</option>
            {usuarios.map(u=> <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>)}
          </select>
          <label>Fecha</label>
          <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
                 style={{display:"block", width:"100%", marginBottom:8}} />
          <label>Hora</label>
          <input type="time" value={hora} onChange={e=>setHora(e.target.value)}
                 style={{display:"block", width:"100%", marginBottom:8}} />
          <label>Motivo (opcional)</label>
          <input placeholder="Control" value={motivo} onChange={e=>setMotivo(e.target.value)}
                 style={{display:"block", width:"100%", marginBottom:8}} />
          <button disabled={cargando}>{cargando? "Guardando…":"Crear turno"}</button>
        </form>
      </section>

      <p style={{color:"#444"}}>{msg}</p>

      <section style={{marginTop:20}}>
        <h2>Turnos del día</h2>
        <table width="100%" border="1" cellPadding="6" style={{borderCollapse:"collapse"}}>
          <thead>
            <tr><th>Hora</th><th>Paciente</th><th>Motivo</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {turnos.length===0 && <tr><td colSpan={4} style={{textAlign:"center"}}>Sin turnos</td></tr>}
            {turnos.map(t=> {
              const dt = new Date(t.inicio)
              const hora = dt.toTimeString().slice(0,5)
              return (
                <tr key={t.id}>
                  <td>{hora}</td>
                  <td>{t.usuario?.nombre}</td>
                  <td>{t.motivo || "-"}</td>
                  <td><button onClick={()=>borrarTurno(t.id)}>Borrar</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
