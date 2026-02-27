const pool = require("../config/db");

const MAX_TRADE_PCT_OF_POOL = 0.15;
const MAX_TRADE_PCT_OF_WALLET = 0.4;
const MIN_TRADE_UNC = 10;
const BASE_TRADE_CAP = 250;
const COOLDOWN_MS = 15_000;
const MAX_PRICE_MOVE_PCT_PER_TRADE = 0.06;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeNextPrice({ currentPrice, basePrice, multiplier, nextPoolUNC }) {
  const targetPrice = basePrice + nextPoolUNC * multiplier;
  const rawDelta = targetPrice - currentPrice;
  const maxDelta = currentPrice * MAX_PRICE_MOVE_PCT_PER_TRADE;
  const boundedDelta = clamp(rawDelta, -maxDelta, maxDelta);
  return Number(Math.max(basePrice, currentPrice + boundedDelta).toFixed(6));
}

function computeTradeCap({ poolUNC, walletUNC }) {
  const byPool = Math.max(BASE_TRADE_CAP, poolUNC * MAX_TRADE_PCT_OF_POOL);
  const byWallet = Math.max(MIN_TRADE_UNC, walletUNC * MAX_TRADE_PCT_OF_WALLET);
  return Number(Math.min(byPool, byWallet).toFixed(4));
}

async function assertCooldown(client, userId, videoId) {
  const { rows } = await client.query(
    `SELECT created_at FROM transactions
     WHERE user_id = $1 AND video_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, videoId]
  );

  if (!rows[0]) {
    return;
  }

  const elapsed = Date.now() - new Date(rows[0].created_at).getTime();
  if (elapsed < COOLDOWN_MS) {
    const secondsLeft = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    const err = new Error(`Trade cooldown active. Try again in ${secondsLeft}s`);
    err.status = 429;
    throw err;
  }
}

function validateSlippage(currentPrice, tradePrice, maxSlippagePct) {
  const limit = Number.isFinite(maxSlippagePct) ? maxSlippagePct : 0.12;
  const slippage = Math.abs(tradePrice - currentPrice) / currentPrice;
  if (slippage > limit) {
    const err = new Error("Slippage exceeded allowed limit");
    err.status = 400;
    throw err;
  }
}

async function buy({ userId, videoId, uncAmount, maxSlippagePct }) {
  const amount = Number(uncAmount);
  if (!Number.isFinite(amount) || amount < MIN_TRADE_UNC) {
    const err = new Error(`Minimum buy is ${MIN_TRADE_UNC} UNC`);
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await assertCooldown(client, userId, videoId);

    const userResult = await client.query("SELECT id, unc_balance FROM users WHERE id = $1 FOR UPDATE", [userId]);
    const videoResult = await client.query(
      `SELECT id, base_price, multiplier, current_price, total_unc_backed
       FROM videos WHERE id = $1 FOR UPDATE`,
      [videoId]
    );

    if (!userResult.rows[0] || !videoResult.rows[0]) {
      const err = new Error("User or video not found");
      err.status = 404;
      throw err;
    }

    const user = userResult.rows[0];
    const video = videoResult.rows[0];

    if (amount > Number(user.unc_balance)) {
      const err = new Error("Insufficient UNC balance");
      err.status = 400;
      throw err;
    }

    const tradeCap = computeTradeCap({
      poolUNC: Number(video.total_unc_backed),
      walletUNC: Number(user.unc_balance)
    });

    if (amount > tradeCap) {
      const err = new Error(`Trade exceeds cap (${tradeCap} UNC)`);
      err.status = 400;
      throw err;
    }

    const currentPrice = Number(video.current_price);
    const nextPool = Number(video.total_unc_backed) + amount;
    const nextPrice = computeNextPrice({
      currentPrice,
      basePrice: Number(video.base_price),
      multiplier: Number(video.multiplier),
      nextPoolUNC: nextPool
    });

    const executionPrice = Number(((currentPrice + nextPrice) / 2).toFixed(6));
    validateSlippage(currentPrice, executionPrice, Number(maxSlippagePct));

    const units = Number((amount / executionPrice).toFixed(6));

    await client.query(
      `INSERT INTO positions (user_id, video_id, units, cost_basis_unc)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, video_id)
       DO UPDATE SET
         units = positions.units + EXCLUDED.units,
         cost_basis_unc = positions.cost_basis_unc + EXCLUDED.cost_basis_unc,
         updated_at = NOW()`,
      [userId, videoId, units, amount]
    );

    await client.query("UPDATE users SET unc_balance = unc_balance - $1 WHERE id = $2", [amount, userId]);
    await client.query(
      `UPDATE videos
       SET total_unc_backed = $1,
           current_price = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [nextPool, nextPrice, videoId]
    );

    await client.query(
      `INSERT INTO transactions (user_id, video_id, action, unc_amount, units, execution_price)
       VALUES ($1, $2, 'BUY', $3, $4, $5)`,
      [userId, videoId, amount, units, executionPrice]
    );

    await client.query(
      `INSERT INTO price_points (video_id, price, total_unc_backed)
       VALUES ($1, $2, $3)`,
      [videoId, nextPrice, nextPool]
    );

    await client.query("COMMIT");
    return { nextPrice, executionPrice, units, nextPool };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function sell({ userId, videoId, units, maxSlippagePct }) {
  const unitsToSell = Number(units);
  if (!Number.isFinite(unitsToSell) || unitsToSell <= 0) {
    const err = new Error("Units must be greater than 0");
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await assertCooldown(client, userId, videoId);

    const userResult = await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [userId]);
    const videoResult = await client.query(
      `SELECT id, base_price, multiplier, current_price, total_unc_backed
       FROM videos WHERE id = $1 FOR UPDATE`,
      [videoId]
    );
    const positionResult = await client.query(
      `SELECT user_id, video_id, units, cost_basis_unc
       FROM positions
       WHERE user_id = $1 AND video_id = $2
       FOR UPDATE`,
      [userId, videoId]
    );

    if (!userResult.rows[0] || !videoResult.rows[0] || !positionResult.rows[0]) {
      const err = new Error("Position or video not found");
      err.status = 404;
      throw err;
    }

    const video = videoResult.rows[0];
    const position = positionResult.rows[0];
    const heldUnits = Number(position.units);

    if (unitsToSell > heldUnits) {
      const err = new Error("Cannot sell more units than held");
      err.status = 400;
      throw err;
    }

    const currentPrice = Number(video.current_price);
    const nextPoolCandidate = Math.max(0, Number(video.total_unc_backed) - unitsToSell * currentPrice);
    const nextPrice = computeNextPrice({
      currentPrice,
      basePrice: Number(video.base_price),
      multiplier: Number(video.multiplier),
      nextPoolUNC: nextPoolCandidate
    });

    const executionPrice = Number(((currentPrice + nextPrice) / 2).toFixed(6));
    validateSlippage(currentPrice, executionPrice, Number(maxSlippagePct));

    const payout = Number((unitsToSell * executionPrice).toFixed(4));
    if (payout > Number(video.total_unc_backed)) {
      const err = new Error("Insufficient pool liquidity for this sell size");
      err.status = 400;
      throw err;
    }

    const nextPool = Number((Number(video.total_unc_backed) - payout).toFixed(4));

    const avgCostPerUnit = Number(position.cost_basis_unc) / heldUnits;
    const costRemoved = Number((avgCostPerUnit * unitsToSell).toFixed(4));
    const remainingUnits = Number((heldUnits - unitsToSell).toFixed(6));
    const remainingCost = Number((Number(position.cost_basis_unc) - costRemoved).toFixed(4));

    if (remainingUnits <= 0.000001) {
      await client.query("DELETE FROM positions WHERE user_id = $1 AND video_id = $2", [userId, videoId]);
    } else {
      await client.query(
        `UPDATE positions
         SET units = $1,
             cost_basis_unc = $2,
             updated_at = NOW()
         WHERE user_id = $3 AND video_id = $4`,
        [remainingUnits, Math.max(remainingCost, 0), userId, videoId]
      );
    }

    await client.query("UPDATE users SET unc_balance = unc_balance + $1 WHERE id = $2", [payout, userId]);
    await client.query(
      `UPDATE videos
       SET total_unc_backed = $1,
           current_price = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [nextPool, nextPrice, videoId]
    );

    await client.query(
      `INSERT INTO transactions (user_id, video_id, action, unc_amount, units, execution_price)
       VALUES ($1, $2, 'SELL', $3, $4, $5)`,
      [userId, videoId, payout, unitsToSell, executionPrice]
    );

    await client.query(
      `INSERT INTO price_points (video_id, price, total_unc_backed)
       VALUES ($1, $2, $3)`,
      [videoId, nextPrice, nextPool]
    );

    await client.query("COMMIT");
    return { nextPrice, executionPrice, payout, nextPool, unitsSold: unitsToSell };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  buy,
  sell,
  computeNextPrice,
  computeTradeCap
};
