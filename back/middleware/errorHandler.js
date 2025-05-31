const errorHandler = (err, req, res, next) => {
  console.error(err); // Логируем ошибку для отладки

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  res.status(statusCode).json({
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Показываем stack trace только в режиме разработки
  });
};

module.exports = errorHandler;