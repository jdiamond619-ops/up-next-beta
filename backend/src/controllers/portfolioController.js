const pool = require("../config/db");

async function getPortfolio(req, res) {
  const { id } = req.user;

  const [positionsResult, userResult] = await Promise.all([
    pool.query(
      `SELECT p.video_id,
              v.title,
              v.thumbnail_url,
              v.current_price,
              p.units,
              p.cost_basis_unc,
              CASE WHEN p.units > 0 THEN p.cost_basis_unc / p.units ELSE 0 END AS entry_price,
              (p.units * v.current_price) AS current_value,
              ((p.units * v.current_price) - p.cost_basis_unc) AS unrealized_pnl
       FROM positions p
       JOIN videos v ON v.id = p.video_id
       WHERE p.user_id = $1
       ORDER BY p.updated_at DESC`,
      [id]
    ),
    pool.query(
      `SELECT id, username, unc_balance FROM users WHERE id = $1`,
      [id]
    )
  ]);

  return res.json({
    user: userResult.rows[0],
    positions: positionsResult.rows
  });
}

module.exports = {
  getPortfolio
};
