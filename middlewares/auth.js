const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
      return next();
    }
    res.redirect('/auth/login');
  };
  
  const hasRole = (roles) => {
    return (req, res, next) => {
      if (req.session.userRole && roles.includes(req.session.userRole)) {
        return next();
      }
      res.status(403).send('Forbidden');
    };
  };
  
  module.exports = { isAuthenticated, hasRole };