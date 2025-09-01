import { useEffect, useMemo, useState } from "react"

const API = import.meta.env.VITE_API_URL

const CTA_EMAIL = "leandrotvr@gmail.com"
const CTA_SUBJECT = encodeURIComponent("Postulación — Fullstack Jr / Asistencia / Secretaría / Data Entry / Atención al Cliente / Docencia TIC")
const CTA_BODY = encodeURIComponent("Hola, me gustaría coordinar una entrevista. Vi la demo en producción.")
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

      {/* Banner superior */}
      <div style={{background:"#E3F2FD", border:"1px solid #BBDEFB", padding:10, borderRadius:8, marginBottom:15, textAlign:"center", lineHeight:1.5}}>
        <strong>📢 Busco EMPLEO (no freelance)</strong> — Postulo a:
        <div style={{fontSize:13, marginTop:4}}>
          <b>Desarrollador Fullstack Jr</b> · Asistente · Secretario · Data Entry · <b>Atención al Cliente</b> · Soporte Técnico · <b>Docencia TIC</b>
        </div>
        <div style={{fontSize:12, marginTop:6}}>
          Tecnologías: React, Vite, Node.js, Express, Prisma, PostgreSQL, SQLite, Render, PowerShell, APIs REST, CORS.
        </div>
        <a href={CTA_MAILTO} style={{display:"inline-block", marginTop:8, background:"#1565c0", color:"#fff", padding:"8px 12px", borderRadius:6, textDecoration:"none", fontWeight:"bold"}}>
          👉 Invitar a entrevista
        </a>
        <div style={{fontSize:12, marginTop:6}}>
          Demo producción: <a href="https://turnos-client.onrender.com/" target="_blank" style={{color:"#0B5ED7"}}>turnos-client.onrender.com</a>
        </div>
      </div>

      <h1>Turnos</h1>

      {/* Formularios y tabla (sin cambios grandes) */}
      {/* ... (ya lo tenés en tu código, queda igual) ... */}

      {/* Botón flotante */}
      <a href={CTA_MAILTO}
         style={{
           position:"fixed", right:20, bottom:20, background:"#2e7d32",
           color:"#fff", padding:"12px 16px", borderRadius:999, textDecoration:"none",
           boxShadow:"0 2px 8px rgba(0,0,0,.25)", fontWeight:"bold"
         }}>
        📩 Invitar a entrevista
      </a>

      {/* Footer */}
      <footer style={{marginTop:40, textAlign:"center", color:"#666", fontSize:13}}>
        Desarrollado por <strong>Leandro</strong> — Perfil orientado a <b>empleo formal</b> (Fullstack Jr, Asistencia, Secretaría, Data Entry, Atención al Cliente, Soporte, Docencia TIC).<br/>
        📧 <a href="mailto:leandrotvr@gmail.com" style={{color:"#1565c0"}}>leandrotvr@gmail.com</a> · Demo: <a href="https://turnos-client.onrender.com/" target="_blank" style={{color:"#1565c0"}}>turnos-client.onrender.com</a>
      </footer>
    </div>
  )
}