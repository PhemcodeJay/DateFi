const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded user info from token (avoids DB hit on every request)
    // The token contains the user id which is sufficient for most operations
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired', expired: true });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;