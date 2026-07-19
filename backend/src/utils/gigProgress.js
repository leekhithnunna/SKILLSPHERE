/**
 * Recomputes a gig's completionPercentage from its milestone statuses
 * (approved milestones / total milestones) and persists it. No-op for
 * gigs without milestones — those rely entirely on freelancer-reported
 * progress-log percentages instead.
 */
const recomputeMilestoneProgress = async (gig) => {
  if (!gig.milestones || gig.milestones.length === 0) return;

  const approvedCount = gig.milestones.filter((m) => m.status === 'approved').length;
  gig.completionPercentage = Math.round((approvedCount / gig.milestones.length) * 100);
  await gig.save();
};

module.exports = { recomputeMilestoneProgress };
