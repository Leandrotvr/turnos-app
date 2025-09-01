import { z } from "zod";

export const usuarioSchema = z.object({
  nombre: z.string().min(1, "nombre requerido").max(80),
  email: z.string().email("email inválido"),
});

export const turnoSchema = z.object({
  usuarioId: z.number().int().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "formato YYYY-MM-DD"),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "formato HH:MM"),
  motivo: z.string().max(200).optional(),
});

export function parseBody(schema) {
  return (req, res, next) => {
    const body = { ...req.body };
    for (const k of Object.keys(body)) if (/Id$/.test(k)) body[k] = Number(body[k]);
    const result = schema.safeParse(body);
    if (!result.success) {
      return res.status(400).json({ error: "validación", detalles: result.error.flatten() });
    }
    req.valid = result.data;
    next();
  };
}