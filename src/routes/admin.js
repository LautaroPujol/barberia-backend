const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { loginRules, barberRules, serviceRules, validate } = require("../middleware/validate");
const {
  login, getDashboard, getAllAppointments, updateAppointmentStatus,
  getBarbers, createBarber, updateBarber, toggleBarberAvailability, deleteBarber,
  getServices, createService, updateService, deleteService,
  getMonthlyStats,
} = require("../controllers/adminController");

// Auth (pública pero con rate limit aplicado en app.js)
router.post("/login", loginRules, validate, login);

// Todo lo siguiente requiere token
router.use(protect);

// Dashboard y stats
router.get("/dashboard", getDashboard);
router.get("/stats/monthly", getMonthlyStats);

// Turnos
router.get("/appointments", getAllAppointments);
router.patch("/appointments/:id/status", updateAppointmentStatus);

// Barberos
router.get("/barbers", getBarbers);
router.post("/barbers", barberRules, validate, createBarber);
router.patch("/barbers/:id", barberRules, validate, updateBarber);
router.patch("/barbers/:id/availability", toggleBarberAvailability);
router.delete("/barbers/:id", deleteBarber);

// Servicios
router.get("/services", getServices);
router.post("/services", serviceRules, validate, createService);
router.patch("/services/:id", serviceRules, validate, updateService);
router.delete("/services/:id", deleteService);

module.exports = router;