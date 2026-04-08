const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Error interno del servidor";

  // Error de duplicado en MongoDB (ej: turno ya ocupado)
  if (err.code === 11000) {
    statusCode = 409;
    message = "Este horario ya está reservado. Por favor elegí otro.";
  }

  // Error de validación de Mongoose
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(", ");
  }

  // Error de CastError (ID inválido)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "ID inválido";
  }

  // JWT expirado
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Tu sesión expiró. Ingresá de nuevo.";
  }

  // Logueamos errores 500 con stack trace
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${statusCode}`, {
      error: err.message,
      stack: err.stack,
      body: req.body,
      ip: req.ip,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} → ${statusCode}: ${message}`);
  }

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;