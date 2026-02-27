const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { signToken } = require("../utils/jwt");

async function signup(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, and password are required" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role, unc_balance, created_at`,
      [username, email.toLowerCase(), passwordHash]
    );

    const user = rows[0];
    const token = signToken({ id: user.id, role: user.role });

    return res.status(201).json({ token, user });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    throw error;
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const { rows } = await pool.query(
    `SELECT id, username, email, role, unc_balance, password_hash
     FROM users
     WHERE email = $1`,
    [email.toLowerCase()]
  );

  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ id: user.id, role: user.role });
  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      unc_balance: user.unc_balance
    }
  });
}

async function me(req, res) {
  const { rows } = await pool.query(
    `SELECT id, username, email, role, unc_balance, created_at
     FROM users
     WHERE id = $1`,
    [req.user.id]
  );

  if (!rows[0]) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user: rows[0] });
}

module.exports = {
  signup,
  login,
  me
};
