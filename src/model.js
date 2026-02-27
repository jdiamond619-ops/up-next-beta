const MILESTONE_LADDER = [
  { minLikes: 0, maxLikes: 9999, price: 1.0, label: "0-10k" },
  { minLikes: 10000, maxLikes: 49999, price: 1.2, label: "10k-50k" },
  { minLikes: 50000, maxLikes: 249999, price: 1.5, label: "50k-250k" },
  { minLikes: 250000, maxLikes: 999999, price: 2.0, label: "250k-1M" },
  { minLikes: 1000000, maxLikes: Number.POSITIVE_INFINITY, price: 2.5, label: "1M+" }
];

function getTierByLikes(likes) {
  return MILESTONE_LADDER.find((tier) => likes >= tier.minLikes && likes <= tier.maxLikes);
}

function getNextTier(likes) {
  return MILESTONE_LADDER.find((tier) => likes < tier.minLikes) || null;
}

function calculateVelocity(metricsHistory) {
  if (!metricsHistory || metricsHistory.length < 2) {
    return 0;
  }

  const recent = metricsHistory.slice(-6);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const likesDelta = last.likes - first.likes;
  const msDelta = last.timestamp - first.timestamp;

  if (msDelta <= 0) {
    return 0;
  }

  const hours = msDelta / 3_600_000;
  return likesDelta / hours;
}

function classifyRisk(video) {
  const tier = getTierByLikes(video.metrics.likes);
  const velocity = calculateVelocity(video.metricsHistory);

  if (tier.minLikes >= 250000 || velocity < 200) {
    return "Mature";
  }

  if (velocity >= 2000 || tier.minLikes >= 50000) {
    return "Accelerating";
  }

  return "Early";
}

function resolveCurrentIndex(video) {
  const tier = getTierByLikes(video.metrics.likes);
  return {
    tier,
    nextTier: getNextTier(video.metrics.likes),
    velocityLikesPerHour: calculateVelocity(video.metricsHistory),
    riskProfile: classifyRisk(video)
  };
}

function computePositionValue(position, currentPrice) {
  return Number((position.units * currentPrice).toFixed(4));
}

module.exports = {
  MILESTONE_LADDER,
  getTierByLikes,
  getNextTier,
  calculateVelocity,
  classifyRisk,
  resolveCurrentIndex,
  computePositionValue
};
