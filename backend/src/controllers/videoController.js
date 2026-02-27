const pool = require("../config/db");
const marketService = require("../services/marketService");

async function listFeed(req, res) {
  const { rows } = await pool.query(
    `SELECT v.id, v.title, v.video_url, v.thumbnail_url, v.creator_name,
            v.base_price, v.current_price, v.multiplier, v.total_unc_backed,
            v.created_at,
            COUNT(DISTINCT p.user_id)::int AS backers
     FROM videos v
     LEFT JOIN positions p ON p.video_id = v.id
     GROUP BY v.id
     ORDER BY v.created_at DESC`
  );

  return res.json({ videos: rows });
}

async function getVideoDetail(req, res) {
  const { id } = req.params;

  const videoResult = await pool.query(
    `SELECT v.id, v.title, v.description, v.video_url, v.thumbnail_url,
            v.creator_name, v.base_price, v.current_price,
            v.total_unc_backed, v.multiplier, v.created_at,
            COUNT(DISTINCT p.user_id)::int AS backers
     FROM videos v
     LEFT JOIN positions p ON p.video_id = v.id
     WHERE v.id = $1
     GROUP BY v.id`,
    [id]
  );

  if (!videoResult.rows[0]) {
    return res.status(404).json({ error: "Video not found" });
  }

  const [pricePoints, history] = await Promise.all([
    pool.query(
      `SELECT id, price, total_unc_backed, created_at
       FROM price_points
       WHERE video_id = $1
       ORDER BY created_at ASC
       LIMIT 400`,
      [id]
    ),
    pool.query(
      `SELECT t.id, t.action, t.unc_amount, t.units, t.execution_price, t.created_at,
              u.username
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       WHERE t.video_id = $1
       ORDER BY t.created_at DESC
       LIMIT 100`,
      [id]
    )
  ]);

  let myPosition = null;
  if (req.user) {
    const positionResult = await pool.query(
      `SELECT user_id, video_id, units, cost_basis_unc, updated_at
       FROM positions
       WHERE user_id = $1 AND video_id = $2`,
      [req.user.id, id]
    );

    if (positionResult.rows[0]) {
      myPosition = positionResult.rows[0];
    }
  }

  return res.json({
    video: videoResult.rows[0],
    chart: pricePoints.rows,
    history: history.rows,
    myPosition
  });
}

async function buy(req, res) {
  const { id } = req.params;
  const { uncAmount, maxSlippagePct } = req.body;

  const result = await marketService.buy({
    userId: req.user.id,
    videoId: id,
    uncAmount,
    maxSlippagePct
  });

  return res.status(201).json(result);
}

async function sell(req, res) {
  const { id } = req.params;
  const { units, maxSlippagePct } = req.body;

  const result = await marketService.sell({
    userId: req.user.id,
    videoId: id,
    units,
    maxSlippagePct
  });

  return res.json(result);
}

async function adminCreateVideo(req, res) {
  const { title, description, videoUrl, thumbnailUrl, creatorName } = req.body;

  if (!title || !videoUrl || !creatorName) {
    return res.status(400).json({ error: "title, videoUrl, and creatorName are required" });
  }

  const { rows } = await pool.query(
    `INSERT INTO videos (title, description, video_url, thumbnail_url, creator_name, base_price, current_price, total_unc_backed, multiplier)
     VALUES ($1, $2, $3, $4, $5, 1.0, 1.0, 0, 0.0004)
     RETURNING *`,
    [title, description || "", videoUrl, thumbnailUrl || "", creatorName]
  );

  await pool.query(
    `INSERT INTO price_points (video_id, price, total_unc_backed)
     VALUES ($1, $2, $3)`,
    [rows[0].id, rows[0].current_price, rows[0].total_unc_backed]
  );

  return res.status(201).json({ video: rows[0] });
}

module.exports = {
  listFeed,
  getVideoDetail,
  buy,
  sell,
  adminCreateVideo
};
