const { verifyToken } = require("../utils/jwt");

function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    req.user = verifyToken(token);
  } catch {
    req.user = null;
  }

  return next();
}

module.exports = { optionalAuth };
