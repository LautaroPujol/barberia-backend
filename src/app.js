const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const logger = require("./config/logger");
const errorHandler = require("./middleware/errorHandler");
const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");

const app = express();
app.set('trust proxy', 1);

// ── Seguridad: headers HTTP ──────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// ── Logging de requests ──────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ── Body parser ───────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // limita el tamaño del body

// ── Sanitización: evita inyección en MongoDB ─────────────
app.use(mongoSanitize());

// ── Rate limiting global ─────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // max 100 requests por IP cada 15 min
  message: { message: "Demasiadas solicitudes. Intentá de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);

// ── Rate limiting estricto para login ────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 100,
  message: { message: "Demasiados intentos de login. Intentá de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/admin/login", loginLimiter);

// ── Rate limiting para reservas ──────────────────────────
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: process.env.NODE_ENV === "production" ? 5 : 100,
  message: { message: "Demasiadas reservas. Intentá de nuevo en una hora." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/appointments", bookingLimiter);

// ── Health check ──────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ── Rutas ─────────────────────────────────────────────────
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

// ── Error handler (siempre al final) ─────────────────────
app.use(errorHandler);

module.exports = app;