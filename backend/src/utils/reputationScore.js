/**
 * Computes a "weighted" reputation score instead of a plain average:
 *  - Reviews on higher-budget gigs count more (proxy for significant,
 *    harder-to-fake work) — weight scales with gig.budgetMax, capped at $1000.
 *  - Reviews older than 180 days count less (keeps the score current).
 * Flagged (suspected-fraud) reviews are expected to already be filtered
 * out by the caller before this runs.
 *
 * @param {Array<{rating:number, createdAt:Date, gig:{budgetMax?:number}}>} reviews
 * @returns {number} weighted average rating, rounded to 2 decimals (0 if no reviews)
 */
const computeWeightedScore = (reviews) => {
  if (!reviews.length) return 0;

  const now = Date.now();
  const RECENT_WINDOW_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

  let weightedSum = 0;
  let totalWeight = 0;

  for (const review of reviews) {
    const budgetWeight = Math.min((review.gig?.budgetMax || 100) / 1000, 1);
    const isRecent = now - new Date(review.createdAt).getTime() <= RECENT_WINDOW_MS;
    const recencyWeight = isRecent ? 1 : 0.7;
    const weight = Math.max(budgetWeight, 0.1) * recencyWeight;

    weightedSum += review.rating * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
};

module.exports = { computeWeightedScore };
