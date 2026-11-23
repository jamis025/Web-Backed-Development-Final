export const notFoundHandler = (req, res, next) => {
  const err = new Error(`Page Not Found - ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    console.error(err.stack);
  }

  res.status(statusCode).render('error', {
    title: `Error ${statusCode}`,
    statusCode,
    message: statusCode === 500 && isProd 
      ? 'Something went wrong on our end. Please try again later.' 
      : err.message,
  });
};
