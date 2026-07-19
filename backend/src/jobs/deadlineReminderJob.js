const cron = require('node-cron');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const notify = require('../utils/notify');

/**
 * Runs once a day and reminds clients + the assigned freelancer about gigs
 * whose deadline falls within the next 24 hours and that aren't finished yet.
 */
const runDeadlineReminderSweep = async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const dueSoon = await Gig.find({
    status: 'in-progress',
    deadline: { $gte: now, $lte: in24h },
  });

  for (const gig of dueSoon) {
    const acceptedProposal = await Proposal.findOne({ gig: gig._id, status: 'accepted' });

    await notify(
      gig.client,
      {
        type: 'deadline_reminder',
        title: `Deadline approaching: ${gig.title}`,
        message: `The deadline for "${gig.title}" is within 24 hours.`,
        link: `/gigs/${gig._id}`,
      },
      { email: true }
    );

    if (acceptedProposal) {
      await notify(
        acceptedProposal.freelancer,
        {
          type: 'deadline_reminder',
          title: `Deadline approaching: ${gig.title}`,
          message: `The deadline for "${gig.title}" is within 24 hours.`,
          link: `/gigs/${gig._id}`,
        },
        { email: true }
      );
    }
  }

  return dueSoon.length;
};

/**
 * Schedules the sweep to run daily at 08:00 server time.
 */
const startDeadlineReminderJob = () => {
  cron.schedule('0 8 * * *', () => {
    runDeadlineReminderSweep().catch((err) =>
      console.error('[deadlineReminderJob] Sweep failed:', err.message)
    );
  });
};

module.exports = { startDeadlineReminderJob, runDeadlineReminderSweep };
