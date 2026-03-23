const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'No token provided' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'PATIENT') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Patient role required.' 
      });
    }

    req.user = {
      userId: decoded.userId,
      patientId: decoded.patientId,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token has expired' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

module.exports = authMiddleware;
