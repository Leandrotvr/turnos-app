import { useEffect, useMemo, useState } from "react"

const API = import.meta.env.VITE_API_URL

const CTA_EMAIL = "leandrotvr@gmail.com"
const CTA_SUBJECT = encodeURIComponent("Consulta – Desarrollo / Soporte / Automatización")
const CTA_BODY = encodeURIComponent("Hola Leandro, vi tu demo y quisiera conversar sobre un proyecto.")
const CTA_MAILTO = `mailto:${CTA_EMAIL}?subject=${CTA_SUBJECT}&body=${CTA_BODY}`

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

  async function cargarUsuarios(){ const r = await fetch(`${API}/api/usuarios`); setUsuarios(await r.json()) }
  async function cargarTurnos(f){ const r = await fetch(`${API}/api/turnos?fecha=${f}`); setTurnos(await r.json()) }
  useEffect(()=>{ cargarUsuarios(); cargarTurnos(fecha) },[])
  useEffect(()=>{ cargarTurnos(fecha) },[fecha])

  async function crearUsuario(e){
    e.preventDefault()
    setMsg("")
    try{
      const r = await fetch(`${API}/api/usuarios`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(formUsuario)
      })
      if(r.ok){ setFormUsuario({nombre:"",email:""}); cargarUsuarios(); setMsg("Usuario creado ✅") }
      else { const j = await r.json().catch(()=>({})); setMsg(j.error || `Error ${r.status}`) }
    } catch(err){ setMsg("Error de red (CORS o conexión)."); console.error(err) }
  }

  async function crearTurno(e){
    e.preventDefault()
    setMsg("")
    if(!usuarioId) return setMsg("Elegí un usuario")
    setCargando(true)
    try{
      const r = await fetch(`${API}/api/turnos`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({usuarioId:Number(usuarioId), fecha, hora, motivo})
      })
      if(r.ok){ setMotivo(""); await cargarTurnos(fecha); setMsg("Turno creado ✅") }
      else { const j = await r.json().catch(()=>({})); setMsg(j.error || `Error ${r.status}`) }
    } catch(err){ setMsg("Error de red (CORS o conexión)."); console.error(err) }
    finally{ setCargando(false) }
  }

  async function borrarTurno(id){
    if(!confirm("¿Borrar turno?")) return
    const r = await fetch(`${API}/api/turnos/${id}`,{method:"DELETE"})
    if(r.status===204){ cargarTurnos(fecha); setMsg("Turno borrado 🗑️") }
    else { const j = await r.json().catch(()=>({})); setMsg(j.error || `Error ${r.status}`) }
  }

  return (
    <div style={{maxWidth:900, margin:"20px auto", fontFamily:"system-ui, sans-serif", position:"relative"}}>

      {/* Banner superior con CTA y enlaces a demos */}
      <div style={{background:"#FFF3CD", border:"1px solid #FFEEBA", padding:10, borderRadius:8, marginBottom:15, textAlign:"center", lineHeight:1.4}}>
        <strong>¿Te gusta este sistema?</strong> Puedo implementar soluciones así para tu negocio.
        <br/>
        <span style={{fontSize:13}}>
          Desarrollo Web · Asistencia Virtual · Soporte al Cliente · Data Entry · Automatización —{" "}
          <a href={CTA_MAILTO} style={{color:"#0B5ED7", fontWeight:"bold"}}>¡Contratame!</a>
        </span>
        <div style={{fontSize:12, marginTop:6}}>
          Demo principal 👉 <a href="https://turnos-client.onrender.com/" target="_blank" style={{color:"#0B5ED7"}}>turnos-client.onrender.com</a>
        </div>
      </div>

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
          <thead><tr><th>Hora</th><th>Paciente</th><th>Motivo</th><th>Acciones</th></tr></thead>
          <tbody>
            {turnos.length===0 && <tr><td colSpan={4} style={{textAlign:"center"}}>Sin turnos</td></tr>}
            {turnos.map(t=> {
              const dt = new Date(t.inicio)
              const hh = dt.toTimeString().slice(0,5)
              return (
                <tr key={t.id}>
                  <td>{hh}</td>
                  <td>{t.usuario?.nombre}</td>
                  <td>{t.motivo || "-"}</td>
                  <td><button onClick={()=>borrarTurno(t.id)}>Borrar</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {/* Botón flotante (CTA) */}
      <a href={CTA_MAILTO}
         style={{
           position:"fixed", right:20, bottom:20, background:"#198754",
           color:"#fff", padding:"12px 16px", borderRadius:999, textDecoration:"none",
           boxShadow:"0 2px 8px rgba(0,0,0,.25)", fontWeight:"bold"
         }}>
        🚀 Contratame
      </a>

      {/* Footer profesional */}
      <footer style={{marginTop:40, textAlign:"center", color:"#666", fontSize:13}}>
        Desarrollado por <strong>Leandro</strong> — leandrotvr@gmail.com —{" "}
        <a href="https://turnos-client.onrender.com/" target="_blank" style={{color:"#0B5ED7"}}>Demo</a> ·{" "}
        <a href="https://turnos-api-49rk.onrender.com/health" target="_blank" style={{color:"#0B5ED7"}}>API Health</a>
      </footer>
    </div>
  )
}