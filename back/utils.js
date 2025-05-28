// back/utils.js

/**
 * Возвращает дату начала недели (понедельник) для заданной даты.
 * @param {string} dateString - Дата в формате YYYY-MM-DD.
 * @returns {string} Дата начала недели в формате YYYY-MM-DD.
 */
function getStartOfWeek(dateString) {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
  const startOfWeek = new Date(date.setDate(diff));
  return startOfWeek.toISOString().split('T')[0];
}

/**
 * Возвращает дату конца недели (воскресенье) для заданной даты.
 * @param {string} dateString - Дата в формате YYYY-MM-DD.
 * @returns {string} Дата конца недели в формате YYYY-MM-DD.
 */
function getEndOfWeek(dateString) {
  const date = new Date(dateString);
  const startOfWeek = new Date(getStartOfWeek(dateString));
  const endOfWeek = new Date(startOfWeek.setDate(startOfWeek.getDate() + 6));
  return endOfWeek.toISOString().split('T')[0];
}

module.exports = {
  getStartOfWeek,
  getEndOfWeek
};