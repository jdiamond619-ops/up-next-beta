const { randomUUID } = require("crypto");
const { resolveCurrentIndex, computePositionValue } = require("./model");

const users = new Map([
  ["u_demo", { id: "u_demo", name: "Demo User", uncBalance: 5000 }]
]);

const videos = new Map();
const positions = new Map();

function seedVideos() {
  const now = Date.now();
  const seeds = [
    {
      title: "Street Food Chemistry",
      creator: "@chef_rina",
      uploadedAt: now - 7 * 3_600_000,
      metrics: { likes: 8700, views: 110000, comments: 260, shares: 140 },
      metricsHistory: [
        { timestamp: now - 6 * 3_600_000, likes: 2800 },
        { timestamp: now - 4 * 3_600_000, likes: 4900 },
        { timestamp: now - 2 * 3_600_000, likes: 6900 },
        { timestamp: now, likes: 8700 }
      ]
    },
    {
      title: "Garage Band in One Take",
      creator: "@northloop",
      uploadedAt: now - 16 * 3_600_000,
      metrics: { likes: 54800, views: 720000, comments: 1200, shares: 700 },
      metricsHistory: [
        { timestamp: now - 12 * 3_600_000, likes: 42100 },
        { timestamp: now - 8 * 3_600_000, likes: 46500 },
        { timestamp: now - 4 * 3_600_000, likes: 51200 },
        { timestamp: now, likes: 54800 }
      ]
    },
    {
      title: "Tiny Desk Animation Breakdown",
      creator: "@vis_labs",
      uploadedAt: now - 52 * 3_600_000,
      metrics: { likes: 288000, views: 3400000, comments: 9300, shares: 5400 },
      metricsHistory: [
        { timestamp: now - 24 * 3_600_000, likes: 241000 },
        { timestamp: now - 16 * 3_600_000, likes: 255000 },
        { timestamp: now - 8 * 3_600_000, likes: 272000 },
        { timestamp: now, likes: 288000 }
      ]
    }
  ];

  seeds.forEach((seed) => {
    const id = randomUUID();
    videos.set(id, { id, ...seed });
  });
}

seedVideos();

function listVideos() {
  return Array.from(videos.values()).map((video) => {
    const index = resolveCurrentIndex(video);
    return {
      ...video,
      index
    };
  });
}

function getVideo(videoId) {
  const video = videos.get(videoId);
  if (!video) {
    return null;
  }

  return {
    ...video,
    index: resolveCurrentIndex(video)
  };
}

function updateMetrics(videoId, patch) {
  const video = videos.get(videoId);
  if (!video) {
    return null;
  }

  const nextLikes = Math.max(video.metrics.likes, Number(patch.likes ?? video.metrics.likes));
  video.metrics = {
    likes: nextLikes,
    views: Number(patch.views ?? video.metrics.views),
    comments: Number(patch.comments ?? video.metrics.comments),
    shares: Number(patch.shares ?? video.metrics.shares)
  };

  video.metricsHistory.push({
    timestamp: Date.now(),
    likes: nextLikes
  });

  if (video.metricsHistory.length > 50) {
    video.metricsHistory = video.metricsHistory.slice(-50);
  }

  return getVideo(videoId);
}

function createVideo(payload) {
  const id = randomUUID();
  const now = Date.now();
  const likes = Number(payload.likes || 0);

  const video = {
    id,
    title: String(payload.title || "Untitled"),
    creator: String(payload.creator || "@unknown"),
    uploadedAt: now,
    metrics: {
      likes,
      views: Number(payload.views || 0),
      comments: Number(payload.comments || 0),
      shares: Number(payload.shares || 0)
    },
    metricsHistory: [{ timestamp: now, likes }]
  };

  videos.set(id, video);
  return getVideo(id);
}

function backVideo(videoId, userId, uncAmount) {
  const user = users.get(userId);
  const video = videos.get(videoId);

  if (!user || !video) {
    return { error: "User or video not found", status: 404 };
  }

  const amount = Number(uncAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "UNC amount must be greater than 0", status: 400 };
  }

  if (amount > user.uncBalance) {
    return { error: "Insufficient UNC balance", status: 400 };
  }

  const index = resolveCurrentIndex(video);
  const units = Number((amount / index.tier.price).toFixed(6));

  const position = {
    id: randomUUID(),
    userId,
    videoId,
    status: "OPEN",
    backedAt: Date.now(),
    entryPrice: index.tier.price,
    entryTierLabel: index.tier.label,
    uncAllocated: amount,
    units,
    exitPrice: null,
    uncSettled: null,
    settledAt: null
  };

  users.set(userId, { ...user, uncBalance: Number((user.uncBalance - amount).toFixed(4)) });
  positions.set(position.id, position);

  return {
    position: decoratePosition(position),
    user: users.get(userId)
  };
}

function decoratePosition(position) {
  const video = videos.get(position.videoId);
  const index = video ? resolveCurrentIndex(video) : null;
  const currentPrice = index ? index.tier.price : position.entryPrice;

  return {
    ...position,
    currentPrice,
    currentTier: index ? index.tier.label : null,
    currentValue: computePositionValue(position, currentPrice)
  };
}

function listPositions(userId) {
  return Array.from(positions.values())
    .filter((position) => position.userId === userId)
    .map(decoratePosition);
}

function closePosition(positionId, userId) {
  const position = positions.get(positionId);
  const user = users.get(userId);

  if (!position || !user) {
    return { error: "Position or user not found", status: 404 };
  }

  if (position.userId !== userId) {
    return { error: "Cannot close another user's position", status: 403 };
  }

  if (position.status !== "OPEN") {
    return { error: "Position already closed", status: 400 };
  }

  const video = videos.get(position.videoId);
  const currentPrice = video ? resolveCurrentIndex(video).tier.price : position.entryPrice;
  const uncSettled = computePositionValue(position, currentPrice);

  const closed = {
    ...position,
    status: "CLOSED",
    exitPrice: currentPrice,
    uncSettled,
    settledAt: Date.now()
  };

  positions.set(positionId, closed);
  users.set(userId, { ...user, uncBalance: Number((user.uncBalance + uncSettled).toFixed(4)) });

  return {
    position: decoratePosition(closed),
    user: users.get(userId)
  };
}

function getUser(userId) {
  return users.get(userId) || null;
}

module.exports = {
  listVideos,
  getVideo,
  updateMetrics,
  createVideo,
  backVideo,
  listPositions,
  closePosition,
  getUser
};
