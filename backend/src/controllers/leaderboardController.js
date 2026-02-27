const pool = require("../config/db");

async function getLeaderboard(req, res) {
  const { rows } = await pool.query(
    `SELECT u.id,
            u.username,
            COALESCE(SUM((p.units * v.current_price) - p.cost_basis_unc), 0) AS unrealized_pnl,
            COALESCE(SUM(p.units * v.current_price), 0) AS portfolio_value,
            u.unc_balance
     FROM users u
     LEFT JOIN positions p ON p.user_id = u.id
     LEFT JOIN videos v ON v.id = p.video_id
     GROUP BY u.id
     ORDER BY unrealized_pnl DESC
     LIMIT 20`
  );

  return res.json({ leaderboard: rows });
}

module.exports = { getLeaderboard };
