const mongoose = require("mongoose");

const barberSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "El nombre es obligatorio"], trim: true },
    specialty: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },      // false = eliminado
    isAvailable: { type: Boolean, default: true },   // false = ausente temporalmente
    unavailableReason: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Barber", barberSchema);