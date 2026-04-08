const express = require("express");
const router = express.Router();
const { getAvailableSlots, createAppointment, getAppointment, cancelAppointment } = require("../controllers/appointmentController");
const { appointmentRules, validate } = require("../middleware/validate");
const Barber = require("../models/Barber");
const Service = require("../models/Service");

// Turnos
router.get("/appointments/available", getAvailableSlots);
router.post("/appointments", appointmentRules, validate, createAppointment);
router.get("/appointments/:id", getAppointment);
router.patch("/appointments/:id/cancel", cancelAppointment);

// Barberos y servicios públicos
router.get("/barbers", async (req, res, next) => {
  try {
    const barbers = await Barber.find({ isActive: true, isAvailable: true }).sort({ name: 1 });
    res.json(barbers);
  } catch (error) { next(error); }
});

router.get("/services", async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ name: 1 });
    res.json(services);
  } catch (error) { next(error); }
});

module.exports = router;