// Вспомогательная функция для нормализации ввода даты
const normalizeDateInput = (date: Date | string | number): Date => {
  if (date instanceof Date) {
    return date;
  }
  return new Date(date);
};

/**
 * Форматирует дату в строку "день недели, ДД месяца".
 * @param date - Дата для форматирования (Date, строка с датой или timestamp).
 * @returns Отформатированная строка.
 */
export const formatDateForDayCard = (date: Date | string | number): string => {
  const d = normalizeDateInput(date);
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
};

/**
 * Форматирует дату в строку "ДД месяца ГГГГ".
 * @param date - Дата для форматирования (Date, строка с датой или timestamp).
 * @returns Отформатированная строка.
 */
export const formatDateForTodayBlock = (date: Date | string | number): string => {
  const d = normalizeDateInput(date);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
};

/**
 * Форматирует дату в строку "СокрДень, Число Месяц" (например, "Пн, 26 мая").
 * @param date - Дата для форматирования (Date, строка с датой или timestamp).
 * @returns Отформатированная строка.
 */
export const formatDateForDayColumnHeader = (date: Date | string | number): string => {
  const d = normalizeDateInput(date);
  // Используем 'short' для дня недели и 'long' для месяца,
  // 'ru-RU' локаль автоматически обработает правильные падежи для месяцев.
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }).format(d);
};

/**
 * Форматирует время в строку "ЧЧ:ММ".
 * @param date - Дата для форматирования (Date, строка с датой или timestamp).
 * @returns Отформатированная строка времени.
 */
export const formatTime = (date: Date | string | number): string => {
  const d = normalizeDateInput(date);
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
};

/**
 * Проверяет, являются ли две даты одним и тем же днем (без учета времени).
 * @param date1 - Первая дата.
 * @param date2 - Вторая дата.
 * @returns true, если даты совпадают по дню, иначе false.
 */
export const isSameDay = (date1: Date | string | number, date2: Date | string | number): boolean => {
  const d1 = normalizeDateInput(date1);
  const d2 = normalizeDateInput(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * Возвращает год из даты.
 * @param date - Дата (Date, строка с датой или timestamp).
 * @returns Год.
 */
export const getYear = (date: Date | string | number): number => {
  const d = normalizeDateInput(date);
  return d.getFullYear();
};

/**
 * Возвращает месяц из даты (1-12).
 * @param date - Дата (Date, строка с датой или timestamp).
 * @returns Месяц (1-12).
 */
export const getMonth = (date: Date | string | number): number => {
  const d = normalizeDateInput(date);
  return d.getMonth() + 1; // getMonth() возвращает 0-11
};

/**
 * Возвращает текущую дату и время.
 * @returns Текущая дата и время.
 */
export const getCurrentDate = (): Date => {
  return new Date();
};

/**
 * Создает объект Date из различных входных данных.
 * Эта функция является оберткой для `new Date()` и используется для согласованности.
 * @param value - Значение для создания даты (Date, строка или число).
 * @returns Объект Date.
 */
export const createDate = (value: Date | string | number): Date => {
  return normalizeDateInput(value);
};
/**
 * Клонирует объект Date.
 * @param date - Дата для клонирования (Date, строка с датой или timestamp).
 * @returns Новый объект Date.
 */
export const cloneDate = (date: Date | string | number): Date => {
  // Всегда создаем новый объект Date из нормализованного значения,
  // чтобы гарантировать отсутствие мутаций исходного объекта.
  return new Date(normalizeDateInput(date));
};

/**
 * Возвращает начало недели (понедельник) для указанной даты.
 * @param date - Дата (Date, строка с датой или timestamp).
 * @returns Начало недели (понедельник).
 */
export const startOfISOWeek = (date: Date | string | number): Date => {
  const d = cloneDate(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

/**
 * Добавляет указанное количество дней к дате.
 * @param date - Дата (Date, строка с датой или timestamp).
 * @param days - Количество дней для добавления.
 * @returns Новая дата.
 */
export const addDays = (date: Date | string | number, days: number): Date => {
  const d = cloneDate(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Добавляет указанное количество недель к дате.
 * @param date - Дата (Date, строка с датой или timestamp).
 * @param weeks - Количество недель для добавления.
 * @returns Новая дата.
 */
export const addWeeks = (date: Date | string | number, weeks: number): Date => {
  const d = cloneDate(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
};

/**
 * Вычитает указанное количество недель из даты.
 * @param date - Дата (Date, строка с датой или timestamp).
 * @param weeks - Количество недель для вычитания.
 * @returns Новая дата.
 */
export const subtractWeeks = (date: Date | string | number, weeks: number): Date => {
  const d = cloneDate(date);
  d.setDate(d.getDate() - weeks * 7);
  return d;
};

/**
 * Форматирует диапазон дат в строку "Д MMMM - Д MMMM ГГГГ".
 * @param startDate - Начальная дата.
 * @param endDate - Конечная дата.
 * @returns Отформатированная строка диапазона дат.
 */
export const formatDateRange = (startDate: Date | string | number, endDate: Date | string | number): string => {
  const startD = normalizeDateInput(startDate);
  const endD = normalizeDateInput(endDate);

  const startFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
  const endFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return `${startFormat.format(startD)} - ${endFormat.format(endD)}`;
};