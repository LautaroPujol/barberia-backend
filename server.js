require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");
const Admin = require("./src/models/Admin");
const Barber = require("./src/models/Barber");
const Service = require("./src/models/Service");

const PORT = process.env.PORT || 3001;

const seedDatabase = async () => {
  // Crear admin por defecto si no existe ninguno
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    await Admin.create({
      email: process.env.ADMIN_EMAIL || "admin@barberco.com",
      password: process.env.ADMIN_PASSWORD || "Admin1234!",
      name: "Administrador",
    });
    console.log("👤 Admin creado:", process.env.ADMIN_EMAIL);
  }

  // Crear barberos de ejemplo si no hay ninguno
  const barberCount = await Barber.countDocuments();
  if (barberCount === 0) {
    await Barber.insertMany([
      { name: "Rodrigo M.", specialty: "Clásico & Fade", avatar: "R" },
      { name: "Nicolás V.", specialty: "Barba & Diseño", avatar: "N" },
      { name: "Sebastián L.", specialty: "Tintura & Moderno", avatar: "S" },
    ]);
    console.log("💈 Barberos de ejemplo creados");
  }

  // Crear servicios de ejemplo si no hay ninguno
  const serviceCount = await Service.countDocuments();
  if (serviceCount === 0) {
    await Service.insertMany([
      { name: "Corte de Cabello", duration: 30, price: 3500, icon: "✂" },
      { name: "Barba", duration: 20, price: 2500, icon: "🪒" },
      { name: "Corte + Barba", duration: 50, price: 5500, icon: "✦" },
      { name: "Tintura", duration: 60, price: 8000, icon: "◈" },
    ]);
    console.log("📋 Servicios de ejemplo creados");
  }
};

const start = async () => {
  await connectDB();
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Rutas disponibles:`);
    console.log(`   GET  /api/services`);
    console.log(`   GET  /api/barbers`);
    console.log(`   GET  /api/appointments/available`);
    console.log(`   POST /api/appointments`);
    console.log(`   POST /api/admin/login`);
    console.log(`   GET  /api/admin/dashboard  (requiere token)`);
  });
};

start();