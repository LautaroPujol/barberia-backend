const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Formatea número argentino para WhatsApp: "11 1234-5678" → "whatsapp:+5491112345678"
const formatArgentinePhone = (phone) => {
  const digits = phone.replace(/\D/g, "");
  // Si ya tiene código de país
  if (digits.startsWith("54")) return `whatsapp:+${digits}`;
  // Si empieza con 0 (ej: 011...)
  if (digits.startsWith("0")) return `whatsapp:+54${digits.slice(1)}`;
  // Número local (ej: 1112345678)
  return `whatsapp:+54${digits}`;
};

const sendConfirmation = async ({ clientName, clientPhone, serviceName, barberName, date, timeSlot }) => {
  const dateStr = new Date(date).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const message =
    `✅ *Tu turno está confirmado, ${clientName}!*\n\n` +
    `🗓 *Fecha:* ${dateStr}\n` +
    `🕐 *Hora:* ${timeSlot}hs\n` +
    `✂️ *Servicio:* ${serviceName}\n` +
    `👤 *Barbero:* ${barberName}\n\n` +
    `📍 Av. Corrientes 1234, CABA\n\n` +
    `_Para cancelar respondé este mensaje._`;

  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: formatArgentinePhone(clientPhone),
    body: message,
  });
};

const sendCancellation = async ({ clientName, clientPhone, date, timeSlot }) => {
  const dateStr = new Date(date).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const message =
    `❌ *Turno cancelado, ${clientName}*\n\n` +
    `Tu turno del ${dateStr} a las ${timeSlot}hs fue cancelado.\n\n` +
    `Podés reservar un nuevo turno en nuestro sitio web.`;

  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: formatArgentinePhone(clientPhone),
    body: message,
  });
};

const sendReminder = async ({ clientName, clientPhone, serviceName, barberName, timeSlot }) => {
  const message =
    `⏰ *Recordatorio de turno, ${clientName}*\n\n` +
    `Mañana tenés turno:\n` +
    `🕐 ${timeSlot}hs | ✂️ ${serviceName} | 👤 ${barberName}\n\n` +
    `📍 Av. Corrientes 1234, CABA`;

  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: formatArgentinePhone(clientPhone),
    body: message,
  });
};

module.exports = { sendConfirmation, sendCancellation, sendReminder };