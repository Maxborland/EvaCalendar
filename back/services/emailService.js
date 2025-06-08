const nodemailer = require('nodemailer');
const { log, error: logError } = require('../utils/logger.js');

// Для работы этого сервиса необходимо добавить следующие переменные в .env:
// EMAIL_HOST=smtp.example.com
// EMAIL_PORT=587
// EMAIL_USER=user@example.com
// EMAIL_PASS=yourpassword
// EMAIL_FROM='"EvaCalendar" <noreply@example.com>'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Отправляет email.
 * @param {string} to - Адрес получателя.
 * @param {string} subject - Тема письма.
 * @param {string} text - Текстовая версия письма.
 * @param {string} html - HTML-версия письма.
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    log(`Email sent: ${info.messageId}`);
  } catch (error) {
    logError('Error sending email:', error);
    // В реальном приложении здесь может быть более сложная логика обработки ошибок
    throw new Error('Failed to send email.');
  }
};

module.exports = {
  sendEmail,
};