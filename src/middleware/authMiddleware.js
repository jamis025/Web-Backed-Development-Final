export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.error = 'Please log in to access this page.';
  res.redirect('/auth/login');
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.session.error = 'Authentication required.';
      return res.redirect('/auth/login');
    }
    if (!allowedRoles.includes(req.session.user.role)) {
      const err = new Error('Access Denied: Insufficient permissions.');
      err.status = 403;
      return next(err);
    }
    next();
  };
};
