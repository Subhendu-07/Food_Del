import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  // Try to get token from both possible locations
  const token = req.headers.authorization?.replace("Bearer ", "") || req.headers.token;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Not Authorized, Login Again" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { 
      userId: decoded.id,
    };
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    
    let message = "Invalid Token";
    if (error.name === "TokenExpiredError") {
      message = "Token Expired";
    } else if (error.name === "JsonWebTokenError") {
      message = "Malformed Token";
    }

    res.status(401).json({ 
      success: false, 
      message 
    });
  }
};

export default authMiddleware;