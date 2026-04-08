const { body, validationResult } = require("express-validator");

// Middleware que chequea los resultados de validación
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Datos inválidos",
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Reglas para crear un turno
const appointmentRules = [
  body("clientName")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 60 }).withMessage("El nombre debe tener entre 2 y 60 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage("El nombre solo puede contener letras"),
  body("clientPhone")
    .trim()
    .notEmpty().withMessage("El teléfono es obligatorio")
    .isLength({ min: 8, max: 20 }).withMessage("Teléfono inválido"),
  body("serviceId")
    .notEmpty().withMessage("El servicio es obligatorio")
    .isMongoId().withMessage("Servicio inválido"),
  body("barberId")
    .notEmpty().withMessage("El barbero es obligatorio")
    .isMongoId().withMessage("Barbero inválido"),
  body("date")
    .notEmpty().withMessage("La fecha es obligatoria")
    .isISO8601().withMessage("Fecha inválida")
    .custom(value => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) throw new Error("No podés reservar en una fecha pasada");
      return true;
    }),
  body("timeSlot")
    .notEmpty().withMessage("El horario es obligatorio")
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage("Formato de hora inválido"),
];

// Reglas para login de admin
const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("Email inválido")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("La contraseña es obligatoria")
    .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
];

// Reglas para crear/editar barbero
const barberRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 50 }).withMessage("El nombre debe tener entre 2 y 50 caracteres"),
  body("specialty")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("La especialidad es demasiado larga"),
];

// Reglas para crear/editar servicio
const serviceRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 60 }).withMessage("El nombre debe tener entre 2 y 60 caracteres"),
  body("duration")
    .notEmpty().withMessage("La duración es obligatoria")
    .isInt({ min: 5, max: 480 }).withMessage("La duración debe ser entre 5 y 480 minutos"),
  body("price")
    .notEmpty().withMessage("El precio es obligatorio")
    .isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
];

module.exports = { validate, appointmentRules, loginRules, barberRules, serviceRules };