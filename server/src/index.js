import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { parseBody, usuarioSchema, turnoSchema } from "./validation.js";

const prisma = new PrismaClient();
const app = express();

const allowlist = new Set([
  "https://turnos-client.onrender.com",
  "http://localhost:5173"
]);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowlist.has(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET","POST","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false,
  maxAge: 86400
}));
app.use(express.json());

// Construye Date en -03:00 (AR)
function construirInicio(fecha, hora) {
  const iso = `${fecha}T${hora}:00-03:00`;
  const d = new Date(iso);
  if (isNaN(d)) throw new Error("fecha/hora invÃƒÂ¡lidas");
  return d;
}

function rangoDia(fecha) {
  const start = new Date(`${fecha}T00:00:00-03:00`);
  const end = new Date(`${fecha}T23:59:59.999-03:00`);
  return { start, end };
}

app.get("/health", (_req, res) => res.json({ ok: true }));

// Usuarios
app.post("/api/usuarios", parseBody(usuarioSchema), async (req, res) => {
  const { nombre, email } = req.valid;
  try {
    const u = await prisma.usuario.create({ data: { nombre, email } });
    res.status(201).json(u);
  } catch (e) {
    if (e.code === "P2002") return res.status(409).json({ error: "email ya existe" });
    console.error(e);
    res.status(500).json({ error: "error interno" });
  }
});

app.get("/api/usuarios", async (_req, res) => {
  const usuarios = await prisma.usuario.findMany({ orderBy: { id: "asc" } });
  res.json(usuarios);
});

// Turnos
app.post("/api/turnos", parseBody(turnoSchema), async (req, res) => {
  const { usuarioId, fecha, hora, motivo } = req.valid;
  try {
    const inicio = construirInicio(fecha, hora);
    const existente = await prisma.turno.findUnique({ where: { inicio } });
    if (existente) return res.status(409).json({ error: "turno ocupado" });

    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) return res.status(404).json({ error: "usuario no existe" });

    const creado = await prisma.turno.create({
      data: { usuarioId, inicio, motivo },
      include: { usuario: true },
    });
    res.status(201).json(creado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "error interno" });
  }
});

app.get("/api/turnos", async (req, res) => {
  const { fecha } = req.query;
  try {
    const where = fecha
      ? (() => {
          const { start, end } = rangoDia(String(fecha));
          return { inicio: { gte: start, lte: end } };
        })()
      : {};

    const turnos = await prisma.turno.findMany({
      where,
      include: { usuario: true },
      orderBy: { inicio: "asc" },
    });
    res.json(turnos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "error interno" });
  }
});

app.delete("/api/turnos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "id invÃƒÂ¡lido" });
  try {
    await prisma.turno.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ error: "no existe" });
    console.error(e);
    res.status(500).json({ error: "error interno" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API turnos escuchando en :${PORT}`));