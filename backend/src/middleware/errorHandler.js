const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || (req.t ? req.t('server.error') : 'Internal server error');

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = req.t ? req.t('auth.emailExists') : 'Duplicate field value';
  }

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
