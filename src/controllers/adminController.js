const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Appointment = require("../models/Appointment");
const Barber = require("../models/Barber");
const Service = require("../models/Service");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/admin/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Email o contraseña incorrectos" });
    }
    res.json({
      token: generateToken(admin._id),
      admin: { id: admin._id, email: admin.email, name: admin.name, isMain: admin.isMain },
    });
  } catch (error) { next(error); }
};

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalToday, totalMonth, totalCancelled, upcomingAppointments, monthlyStats] = await Promise.all([
      Appointment.countDocuments({ date: { $gte: today, $lte: endOfToday }, status: { $ne: "cancelled" } }),
      Appointment.countDocuments({ date: { $gte: startOfMonth }, status: { $ne: "cancelled" } }),
      Appointment.countDocuments({ status: "cancelled" }),
      Appointment.find({ date: { $gte: today }, status: "confirmed" })
        .populate(["service", "barber"])
        .sort({ date: 1, timeSlot: 1 })
        .limit(10),
      Appointment.aggregate([
        { $match: { date: { $gte: startOfMonth }, status: { $ne: "cancelled" } } },
        { $lookup: { from: "services", localField: "service", foreignField: "_id", as: "serviceData" } },
        { $unwind: "$serviceData" },
        { $group: { _id: null, total: { $sum: "$serviceData.price" } } },
      ]),
    ]);

    res.json({
      totalToday, totalMonth, totalCancelled,
      monthlyRevenue: monthlyStats[0]?.total || 0,
      upcomingAppointments,
    });
  } catch (error) { next(error); }
};

// GET /api/admin/appointments
const getAllAppointments = async (req, res, next) => {
  try {
    const { date, status, barberId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    if (status) filter.status = status;
    if (barberId) filter.barber = barberId;

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate(["service", "barber"])
        .sort({ date: 1, timeSlot: 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Appointment.countDocuments(filter),
    ]);

    res.json({ appointments, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

// PATCH /api/admin/appointments/:id/status
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id, { status }, { new: true, runValidators: true }
    ).populate(["service", "barber"]);
    if (!appointment) return res.status(404).json({ message: "Turno no encontrado" });
    res.json({ message: "Estado actualizado", appointment });
  } catch (error) { next(error); }
};

// DELETE /api/admin/appointments/cancelled — limpia cancelados de hace más de X días
const cleanCancelledAppointments = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const result = await Appointment.deleteMany({
      status: "cancelled",
      updatedAt: { $lt: cutoffDate },
    });

    res.json({
      message: `Se eliminaron ${result.deletedCount} turnos cancelados de hace más de ${days} días`,
      deletedCount: result.deletedCount,
    });
  } catch (error) { next(error); }
};

// --- Barberos ---
const getBarbers = async (req, res, next) => {
  try {
    const barbers = await Barber.find({ isActive: true }).sort({ name: 1 });
    res.json(barbers);
  } catch (error) { next(error); }
};

const createBarber = async (req, res, next) => {
  try {
    const barber = await Barber.create(req.body);
    res.status(201).json(barber);
  } catch (error) { next(error); }
};

const updateBarber = async (req, res, next) => {
  try {
    const barber = await Barber.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!barber) return res.status(404).json({ message: "Barbero no encontrado" });
    res.json(barber);
  } catch (error) { next(error); }
};

const toggleBarberAvailability = async (req, res, next) => {
  try {
    const { isAvailable, unavailableReason } = req.body;
    const barber = await Barber.findByIdAndUpdate(
      req.params.id,
      { isAvailable, unavailableReason: isAvailable ? "" : (unavailableReason || "No disponible") },
      { new: true }
    );
    if (!barber) return res.status(404).json({ message: "Barbero no encontrado" });
    res.json({ message: `Barbero marcado como ${isAvailable ? "disponible" : "no disponible"}`, barber });
  } catch (error) { next(error); }
};

const deleteBarber = async (req, res, next) => {
  try {
    await Barber.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Barbero eliminado" });
  } catch (error) { next(error); }
};

// --- Servicios ---
const getServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ name: 1 });
    res.json(services);
  } catch (error) { next(error); }
};

const createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (error) { next(error); }
};

const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ message: "Servicio no encontrado" });
    res.json(service);
  } catch (error) { next(error); }
};

const deleteService = async (req, res, next) => {
  try {
    await Service.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Servicio eliminado" });
  } catch (error) { next(error); }
};

// --- Admins ---
// Solo el admin principal puede crear/ver/eliminar otros admins
const getAdmins = async (req, res, next) => {
  try {
    if (!req.admin.isMain) return res.status(403).json({ message: "Solo el administrador principal puede gestionar usuarios" });
    const admins = await Admin.find().select("-password").sort({ createdAt: 1 });
    res.json(admins);
  } catch (error) { next(error); }
};

const createAdminUser = async (req, res, next) => {
  try {
    if (!req.admin.isMain) return res.status(403).json({ message: "Solo el administrador principal puede crear usuarios" });
    const { email, password, name } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(409).json({ message: "Ya existe un administrador con ese email" });
    const admin = await Admin.create({ email, password, name, isMain: false });
    res.status(201).json({ message: "Administrador creado", admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (error) { next(error); }
};

const deleteAdminUser = async (req, res, next) => {
  try {
    if (!req.admin.isMain) return res.status(403).json({ message: "Solo el administrador principal puede eliminar usuarios" });
    if (req.params.id === req.admin._id.toString()) return res.status(400).json({ message: "No podés eliminarte a vos mismo" });
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: "Administrador eliminado" });
  } catch (error) { next(error); }
};

// GET /api/admin/stats/monthly
const getMonthlyStats = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const stats = await Appointment.aggregate([
      { $match: { date: { $gte: sixMonthsAgo }, status: { $ne: "cancelled" } } },
      { $lookup: { from: "services", localField: "service", foreignField: "_id", as: "serviceData" } },
      { $unwind: "$serviceData" },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          turnos: { $sum: 1 },
          ingresos: { $sum: "$serviceData.price" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json(stats);
  } catch (error) { next(error); }
};

module.exports = {
  login, getDashboard, getAllAppointments, updateAppointmentStatus, cleanCancelledAppointments,
  getBarbers, createBarber, updateBarber, toggleBarberAvailability, deleteBarber,
  getServices, createService, updateService, deleteService,
  getAdmins, createAdminUser, deleteAdminUser,
  getMonthlyStats,
};