const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAuthenticated && req.session.user) {
      // req.session && req.session.isAuthenticated && req.session.user
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