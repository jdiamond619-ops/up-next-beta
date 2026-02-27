const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function seed() {
  const adminPass = await bcrypt.hash("admin1234", 10);
  const userPass = await bcrypt.hash("user1234", 10);

  await pool.query(
    `INSERT INTO users (username, email, password_hash, role, unc_balance)
     VALUES
       ('admin', 'admin@upnext.local', $1, 'admin', 5000),
       ('demo', 'demo@upnext.local', $2, 'user', 1800)
     ON CONFLICT (email) DO NOTHING`,
    [adminPass, userPass]
  );

  const videosResult = await pool.query(
    `INSERT INTO videos (title, description, video_url, thumbnail_url, creator_name, base_price, current_price, total_unc_backed, multiplier)
     VALUES
      ('Street Dancer Breakdown', 'Slow-motion footwork tutorial clip', 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800', '@flowstate', 1, 1.12, 300, 0.0004),
      ('One-Pot Ramen Remix', 'Fast cooking format with split-screen reactions', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', '@kitchenbyte', 1, 1.36, 900, 0.0004),
      ('DIY Projection Wall', 'Home setup build in 30 seconds', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=800', '@buildzone', 1, 1.08, 200, 0.0004)
     ON CONFLICT DO NOTHING
     RETURNING id, current_price, total_unc_backed`
  );

  for (const row of videosResult.rows) {
    await pool.query(
      `INSERT INTO price_points (video_id, price, total_unc_backed)
       VALUES ($1, $2, $3)`,
      [row.id, row.current_price, row.total_unc_backed]
    );
  }

  console.log("Seed complete");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
