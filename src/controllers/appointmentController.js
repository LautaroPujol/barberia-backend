const Appointment = require("../models/Appointment");
const { sendConfirmation, sendCancellation } = require("../services/whatsapp");

// GET /api/appointments/available?barberId=xxx&date=2025-07-10
const getAvailableSlots = async (req, res, next) => {
  try {
    const { barberId, date } = req.query;

    const ALL_SLOTS = [
      "09:00","09:30","10:00","10:30","11:00","11:30",
      "14:00","14:30","15:00","15:30","16:00","16:30",
      "17:00","17:30","18:00","18:30",
    ];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const takenAppointments = await Appointment.find({
      barber: barberId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" },
    }).select("timeSlot");

    const takenSlots = takenAppointments.map((a) => a.timeSlot);
    const availableSlots = ALL_SLOTS.filter((s) => !takenSlots.includes(s));

    res.json({ availableSlots, takenSlots });
  } catch (error) {
    next(error);
  }
};

// POST /api/appointments
const createAppointment = async (req, res, next) => {
  try {
    const { clientName, clientPhone, serviceId, barberId, date, timeSlot, notes } = req.body;

    const appointment = await Appointment.create({
      clientName,
      clientPhone,
      service: serviceId,
      barber: barberId,
      date: new Date(date),
      timeSlot,
      notes,
    });

    // Poblar datos para la notificación
    await appointment.populate(["service", "barber"]);

    // Enviar WhatsApp de confirmación (no bloqueante)
    sendConfirmation({
      clientName,
      clientPhone,
      serviceName: appointment.service.name,
      barberName: appointment.barber.name,
      date: appointment.date,
      timeSlot,
    }).catch((err) => console.error("⚠️ Error WhatsApp:", err.message));

    res.status(201).json({
      message: "Turno reservado con éxito",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/:id
const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(["service", "barber"]);
    if (!appointment) return res.status(404).json({ message: "Turno no encontrado" });
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/appointments/:id/cancel
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(["service", "barber"]);
    if (!appointment) return res.status(404).json({ message: "Turno no encontrado" });
    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "El turno ya está cancelado" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    // Notificar por WhatsApp
    sendCancellation({
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
    }).catch((err) => console.error("⚠️ Error WhatsApp:", err.message));

    res.json({ message: "Turno cancelado", appointment });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAvailableSlots, createAppointment, getAppointment, cancelAppointment };