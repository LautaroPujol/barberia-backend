const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    // Datos del cliente
    clientName: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    clientPhone: {
      type: String,
      required: [true, "El teléfono es obligatorio"],
      trim: true,
    },

    // Servicio y barbero
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "El servicio es obligatorio"],
    },
    barber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Barber",
      required: [true, "El barbero es obligatorio"],
    },

    // Fecha y hora
    date: {
      type: Date,
      required: [true, "La fecha es obligatoria"],
    },
    timeSlot: {
      type: String, // "09:00", "09:30", etc.
      required: [true, "El horario es obligatorio"],
    },

    // Estado del turno
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "confirmed",
    },

    // Recordatorio enviado por WhatsApp
    reminderSent: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Índice para evitar turnos duplicados (mismo barbero, fecha y horario)
appointmentSchema.index({ barber: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model("Appointment", appointmentSchema);