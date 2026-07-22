/**
 * Demo data seeder — populates SkillSphere with realistic-looking synthetic
 * users, gigs, proposals, payments, and reviews so the platform doesn't look
 * empty during a live demo.
 *
 * Usage (from backend/):
 *   npm run seed:demo            seed once (no-ops if seed data already exists)
 *   npm run seed:demo -- --reset clear all seed-flagged data, then reseed fresh
 *
 * Safety: every seeded user is flagged `isSeedData: true`. Gigs/proposals/
 * payments/reviews aren't flagged directly — they're only ever created for
 * (and looked up/cleared via) seed-flagged users, so real accounts and their
 * data are never touched by this script, reset or otherwise.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

const { computeWeightedScore } = require('../utils/reputationScore');
const { recomputeMilestoneProgress } = require('../utils/gigProgress');

const SEED_PASSWORD = 'Demo@1234';
const EMAIL_DOMAIN = 'skillsphere.test'; // RFC 2606 reserved TLD — never a real deliverable address

const FREELANCER_COUNT = 18;
const CLIENT_COUNT = 9;
const GIG_COUNT = 28;

// ── Static content pools (hand-written, not lorem-ipsum, for a realistic look) ──

const SKILL_CATEGORIES = {
  web: ['React', 'Node.js', 'TypeScript', 'Vue.js', 'Next.js', 'Express.js', 'GraphQL', 'Tailwind CSS'],
  mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS Development', 'Android Development'],
  dataInfra: ['Python', 'Django', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'Data Analysis'],
  design: ['UI/UX Design', 'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Graphic Design', 'Logo Design', 'Branding'],
  writing: ['Content Writing', 'Copywriting', 'SEO Writing', 'Technical Writing', 'Blog Writing'],
  marketing: ['Digital Marketing', 'Social Media Marketing', 'SEO', 'Email Marketing', 'Google Ads'],
  video: ['Video Editing', 'Motion Graphics', 'After Effects', 'Animation'],
  other: ['WordPress', 'Shopify', 'Solidity', 'Unity Game Development', '3D Modeling', 'Voice Over'],
};
const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();
const CATEGORY_KEYS = Object.keys(SKILL_CATEGORIES);

const CITY_POOL = [
  { city: 'Austin', country: 'USA' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'London', country: 'UK' },
  { city: 'Bengaluru', country: 'India' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Lisbon', country: 'Portugal' },
  { city: 'Amsterdam', country: 'Netherlands' },
  { city: 'Manila', country: 'Philippines' },
  { city: 'Nairobi', country: 'Kenya' },
  { city: 'Mexico City', country: 'Mexico' },
  { city: 'Warsaw', country: 'Poland' },
  { city: 'Dubai', country: 'UAE' },
];

const GIG_TEMPLATES = [
  { category: 'web', title: 'Build a responsive marketing website for a SaaS startup', description: 'Looking for a developer to build a fast, responsive marketing site with a blog and pricing page. Clean design system already exists — need it implemented well.' },
  { category: 'web', title: 'React dashboard for internal analytics tool', description: 'We need an internal dashboard to visualize usage metrics — charts, filters, and a data table with export to CSV.' },
  { category: 'web', title: 'E-commerce storefront revamp', description: 'Our storefront needs a modern refresh — improved mobile checkout flow, faster page loads, and a cleaner product grid.' },
  { category: 'web', title: 'REST API for a booking platform', description: 'Need a well-structured REST API with auth, availability search, and booking endpoints, plus basic documentation.' },
  { category: 'mobile', title: 'Cross-platform app for a fitness tracker', description: 'Building a workout-logging app for iOS and Android. Need someone who can take our Figma designs and ship a polished cross-platform app.' },
  { category: 'mobile', title: 'iOS app polish and App Store submission', description: 'App is mostly built — need help fixing a few UI bugs, optimizing performance, and handling the App Store submission process.' },
  { category: 'mobile', title: 'Local food delivery app in Flutter', description: 'Early-stage delivery app for local restaurants. Need core ordering flow, real-time order status, and push notifications.' },
  { category: 'dataInfra', title: 'Data pipeline to clean and analyze sales data', description: 'We have messy CSV exports from multiple sources and need a repeatable pipeline to clean, merge, and summarize monthly sales data.' },
  { category: 'dataInfra', title: 'Set up CI/CD and containerized deployment', description: 'Need Docker + CI/CD pipeline set up for our existing app so deployments stop being a manual, error-prone process.' },
  { category: 'dataInfra', title: 'Train a simple product recommendation model', description: 'Looking for someone to prototype a "customers also liked" recommendation model using our existing purchase history data.' },
  { category: 'design', title: 'Brand identity and logo design for a coffee roastery', description: 'New coffee roastery needs a full brand identity — logo, color palette, packaging mockups, and a simple style guide.' },
  { category: 'design', title: 'Redesign UI/UX for a productivity app', description: 'Our app works but looks dated. Need a UX audit and a refreshed UI design in Figma, ready to hand off to developers.' },
  { category: 'design', title: 'Pitch deck and marketing collateral design', description: 'Need a polished investor pitch deck plus a one-page product sheet, matching our existing brand guidelines.' },
  { category: 'writing', title: 'SEO blog articles for a personal finance site', description: 'Looking for a writer to produce 4 well-researched, SEO-friendly articles per month on budgeting and saving topics.' },
  { category: 'writing', title: 'Technical documentation for a developer API', description: 'Need clear, example-driven docs for our REST API — getting started guide, endpoint reference, and a couple of tutorials.' },
  { category: 'writing', title: 'Product descriptions for an online boutique', description: 'Need engaging, on-brand product descriptions written for about 60 items across a few categories.' },
  { category: 'marketing', title: 'Run a paid social campaign for a product launch', description: 'Launching a new product next month and need someone to plan and run a paid social campaign across Instagram and TikTok.' },
  { category: 'marketing', title: 'Set up email marketing automation', description: 'Need welcome series, abandoned-cart, and post-purchase email flows set up and tested in our email platform.' },
  { category: 'video', title: 'Edit a series of YouTube tutorial videos', description: 'We have raw footage for 6 tutorial videos and need clean edits with captions, intro/outro, and simple graphics.' },
  { category: 'video', title: 'Motion graphics intro for a podcast', description: 'Need a short, punchy animated intro (10-15 seconds) for a new podcast, matching our existing logo and colors.' },
  { category: 'other', title: 'Custom WordPress theme for a nonprofit', description: 'Small nonprofit needs a custom WordPress theme built from an existing design — donation page, events calendar, and blog.' },
  { category: 'other', title: 'Smart contract review and gas optimization', description: 'Need an experienced Solidity developer to review a small set of contracts for issues and optimize gas usage before launch.' },
  { category: 'other', title: '3D product renders for an online catalog', description: 'Need photorealistic 3D renders of about 15 products for our online catalog, based on CAD files we can provide.' },
];

const FREELANCER_BIOS = [
  'Full-stack developer with several years of experience building scalable web applications. Enjoys turning complex requirements into clean, maintainable code.',
  'Mobile engineer focused on smooth, performant apps for iOS and Android. Shipped multiple apps to the App Store and Play Store.',
  'Backend developer who loves solving infrastructure problems and automating repetitive work.',
  'Product designer bridging beautiful interfaces and real user needs, with experience across startups and agencies.',
  'Freelance writer specializing in clear, engaging content for tech and finance brands.',
  "Digital marketer who's grown organic traffic and paid campaigns for dozens of small businesses.",
  'Video editor and motion designer with an eye for pacing and storytelling.',
  'Versatile developer comfortable across the stack, from database design to pixel-perfect UI.',
  'Detail-oriented engineer who values clear communication and hitting deadlines.',
  'Creative technologist blending design and code to build products people enjoy using.',
  'Data-focused developer who enjoys turning messy datasets into useful dashboards and reports.',
  'Brand and identity designer who loves helping small businesses look as good as they are.',
  'Copywriter who specializes in making technical products sound simple and compelling.',
  'DevOps-minded engineer who gets satisfaction from a green CI pipeline.',
  'Mobile-first designer and front-end developer, equally comfortable in Figma and code.',
];

const CLIENT_BIOS = [
  'Founder of a small but growing startup, always looking for reliable freelance talent.',
  'Marketing lead who outsources design and content work to focus on strategy.',
  'Independent consultant who partners with freelancers on client projects.',
  'Runs a small e-commerce brand and regularly hires for design, dev, and content work.',
  'Product manager hiring specialists for short-term, well-scoped projects.',
  'Runs a boutique agency and brings in freelancers for overflow work.',
  'Nonprofit program lead looking for affordable, high-quality freelance help.',
  'Solo founder wearing too many hats, outsourcing what can be outsourced.',
  'Operations lead at a small team that prefers hiring specialists over generalists.',
];

const COVER_LETTER_TEMPLATES = [
  (title) => `Hi! I've worked on several projects similar to "${title}" and would love to help. I can start right away and deliver high-quality work on time.`,
  (title) => `This looks like a great fit for my skill set. I've reviewed the requirements for "${title}" and have a clear plan to get it done efficiently.`,
  (title) => `I'd love to take this on. My background lines up well with "${title}" and I always prioritize clear communication throughout a project.`,
  (title) => `I've done work very close to "${title}" before and can share examples. Happy to hop on a quick call to align on scope before starting.`,
  (title) => `Excited about "${title}" — it's exactly the kind of project I enjoy. I can commit to a realistic timeline and keep you updated along the way.`,
];

const REVIEW_COMMENTS = {
  5: [
    'Absolutely fantastic to work with — delivered ahead of schedule and the quality exceeded expectations.',
    'Great communication throughout, would hire again in a heartbeat.',
    'Nailed the brief on the first try. Highly recommended.',
  ],
  4: [
    'Solid work overall — a couple of minor revisions needed but handled them quickly.',
    'Good communicator and delivered what was promised.',
  ],
  3: [
    'Decent work, but communication could have been more proactive.',
    'Got the job done, though there were a few delays along the way.',
  ],
  2: [
    'Missed a couple of deadlines and required more oversight than expected.',
  ],
};

// ── Small helpers ──────────────────────────────────────────────────────────

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickOne = (arr) => arr[randInt(0, arr.length - 1)];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const pickN = (arr, n) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
};

const weightedRating = () => pickOne([5, 5, 5, 4, 4, 4, 3, 3, 2]);

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/** Backdates a document's createdAt without triggering Mongoose's timestamps plugin. */
const backdate = async (Model, id, date) => {
  await Model.updateOne({ _id: id }, { $set: { createdAt: date } }, { timestamps: false });
};

const usedEmails = new Set();
const makeEmail = (name) => {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.+|\.+$/g, '');
  let email = `${slug}@${EMAIL_DOMAIN}`;
  let suffix = 1;
  while (usedEmails.has(email)) {
    email = `${slug}${suffix}@${EMAIL_DOMAIN}`;
    suffix += 1;
  }
  usedEmails.add(email);
  return email;
};

// ── Reset ────────────────────────────────────────────────────────────────

const resetSeedData = async () => {
  const seedUserIds = await User.find({ isSeedData: true }).distinct('_id');
  if (seedUserIds.length === 0) {
    console.log('[seed] --reset: no existing seed data found, nothing to clear.');
    return;
  }

  const [payments, reviews, proposals, gigs] = await Promise.all([
    Payment.deleteMany({ $or: [{ client: { $in: seedUserIds } }, { freelancer: { $in: seedUserIds } }] }),
    Review.deleteMany({ $or: [{ reviewer: { $in: seedUserIds } }, { reviewee: { $in: seedUserIds } }] }),
    Proposal.deleteMany({ freelancer: { $in: seedUserIds } }),
    Gig.deleteMany({ client: { $in: seedUserIds } }),
  ]);
  const users = await User.deleteMany({ isSeedData: true });

  console.log(
    `[seed] --reset: cleared ${users.deletedCount} users, ${gigs.deletedCount} gigs, ` +
      `${proposals.deletedCount} proposals, ${payments.deletedCount} payments, ${reviews.deletedCount} reviews.`
  );
};

// ── Seeding ──────────────────────────────────────────────────────────────

const createFreelancers = async (faker) => {
  const freelancers = [];
  for (let i = 0; i < FREELANCER_COUNT; i++) {
    const name = faker.person.fullName();
    const primaryCategory = pickOne(CATEGORY_KEYS);
    const secondaryCategory = Math.random() < 0.35 ? pickOne(CATEGORY_KEYS) : primaryCategory;
    const skillPool = [...new Set([...SKILL_CATEGORIES[primaryCategory], ...SKILL_CATEGORIES[secondaryCategory]])];
    const skills = pickN(skillPool, randInt(3, 6));
    const { city, country } = pickOne(CITY_POOL);
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const _id = new mongoose.Types.ObjectId();

    const user = await User.create({
      _id,
      name,
      email: makeEmail(name),
      password: SEED_PASSWORD, // hashed by User's own pre('save') hook
      role: 'freelancer',
      isVerified: true,
      isSeedData: true,
      bio: pickOne(FREELANCER_BIOS),
      skills,
      location: { city, country },
      profileImage: `https://i.pravatar.cc/150?u=${_id}`,
      freelancerProfile: {
        skillProficiencies: skills.map((skill) => ({ skill, level: pickOne(levels) })),
        hourlyRate: randInt(15, 120),
        acceptsMilestonePricing: Math.random() < 0.8,
        weeklyAvailability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
          day,
          hours: ['Sat', 'Sun'].includes(day) ? randInt(0, 4) : randInt(2, 8),
        })),
        isVerifiedBadge: Math.random() < 0.3,
      },
    });
    freelancers.push(user);
  }
  return freelancers;
};

const createClients = async (faker) => {
  const clients = [];
  for (let i = 0; i < CLIENT_COUNT; i++) {
    const name = faker.person.fullName();
    const { city, country } = pickOne(CITY_POOL);
    const _id = new mongoose.Types.ObjectId();

    const user = await User.create({
      _id,
      name,
      email: makeEmail(name),
      password: SEED_PASSWORD,
      role: 'client',
      isVerified: true,
      isSeedData: true,
      bio: pickOne(CLIENT_BIOS),
      location: { city, country },
      profileImage: `https://i.pravatar.cc/150?u=${_id}`,
    });
    clients.push(user);
  }
  return clients;
};

const STATUS_PLAN = [
  ...Array(12).fill('open'),
  ...Array(9).fill('in-progress'),
  ...Array(6).fill('completed'),
  ...Array(1).fill('closed'),
];

const createGigs = async (clients) => {
  const gigs = [];
  const statuses = pickN(STATUS_PLAN, STATUS_PLAN.length); // shuffled copy

  for (let i = 0; i < GIG_COUNT; i++) {
    const template = pickOne(GIG_TEMPLATES);
    const client = pickOne(clients);
    const status = statuses[i];
    const skillsRequired = pickN(SKILL_CATEGORIES[template.category], randInt(2, 4));
    const budgetMin = randInt(3, 20) * 25; // $75-$500
    const budgetMax = budgetMin + randInt(2, 15) * 50;
    const createdAt = daysAgo(randInt(1, 60));
    const deadline = new Date(createdAt.getTime() + randInt(14, 45) * 24 * 60 * 60 * 1000);

    const useMilestones = ['in-progress', 'completed'].includes(status) && Math.random() < 0.5;
    const milestoneCount = useMilestones ? randInt(2, 3) : 0;
    const milestones = [];
    if (useMilestones) {
      const share = Math.floor(budgetMax / milestoneCount);
      for (let m = 0; m < milestoneCount; m++) {
        milestones.push({
          title: `Milestone ${m + 1}`,
          description: '',
          amount: m === milestoneCount - 1 ? budgetMax - share * (milestoneCount - 1) : share,
          dueDate: new Date(createdAt.getTime() + (m + 1) * 10 * 24 * 60 * 60 * 1000),
          status: 'pending',
        });
      }
    }

    const gig = await Gig.create({
      title: template.title,
      description: template.description,
      budgetMin,
      budgetMax,
      skillsRequired,
      location: Math.random() < 0.7 ? { city: client.location.city, country: client.location.country } : undefined,
      deadline,
      status,
      client: client._id,
      milestones,
    });

    await backdate(Gig, gig._id, createdAt);
    gigs.push({ doc: gig, template, createdAt, useMilestones });
  }
  return gigs;
};

const createProposalsAndDownstream = async (gigs, freelancers, clients) => {
  let proposalCount = 0;
  let paymentCount = 0;
  const reviewDocs = [];

  for (const { doc: gig, createdAt, useMilestones } of gigs) {
    const matching = freelancers.filter((f) => f.skills.some((s) => gig.skillsRequired.includes(s)));
    const pool = matching.length > 0 ? matching : freelancers;

    if (gig.status === 'open') {
      // 0-4 pending proposals, no acceptance yet
      const applicants = pickN(pool, randInt(0, 4));
      for (const freelancer of applicants) {
        const proposalCreatedAt = new Date(createdAt.getTime() + randInt(1, 6) * 24 * 60 * 60 * 1000);
        const bidAmount = randInt(gig.budgetMin, gig.budgetMax);
        const proposal = await Proposal.create({
          freelancer: freelancer._id,
          gig: gig._id,
          coverLetter: pickOne(COVER_LETTER_TEMPLATES)(gig.title),
          bidAmount,
          estimatedDays: randInt(3, 30),
          status: 'pending',
        });
        await backdate(Proposal, proposal._id, proposalCreatedAt);
        proposalCount += 1;
      }
      continue;
    }

    // in-progress / completed / closed: need exactly one accepted proposal
    // (closed gigs are treated like an in-progress engagement that ended
    // without completing — still gets an accepted freelancer for realism)
    const applicants = pickN(pool, randInt(1, Math.min(4, pool.length)));
    const acceptedFreelancer = applicants[0];
    let acceptedProposal = null;

    for (const [idx, freelancer] of applicants.entries()) {
      const isAccepted = idx === 0;
      const proposalCreatedAt = new Date(createdAt.getTime() + randInt(1, 6) * 24 * 60 * 60 * 1000);
      const bidAmount = randInt(gig.budgetMin, gig.budgetMax);
      const proposal = await Proposal.create({
        freelancer: freelancer._id,
        gig: gig._id,
        coverLetter: pickOne(COVER_LETTER_TEMPLATES)(gig.title),
        bidAmount,
        estimatedDays: randInt(3, 30),
        status: isAccepted ? 'accepted' : 'rejected',
      });
      await backdate(Proposal, proposal._id, proposalCreatedAt);
      proposalCount += 1;
      if (isAccepted) acceptedProposal = proposal;
    }

    if (gig.status === 'closed') continue; // no payments/reviews for a closed-without-completing gig

    // Payments
    if (useMilestones && gig.milestones.length > 0) {
      const n = gig.milestones.length;
      const cursor = gig.status === 'completed' ? n : randInt(1, n - 1);
      for (let m = 0; m < n; m++) {
        const milestone = gig.milestones[m];
        if (m < cursor - 1 || gig.status === 'completed') {
          milestone.status = 'approved';
        } else if (m === cursor - 1) {
          milestone.status = 'in-progress';
        } else {
          continue; // still pending, no payment yet
        }

        const paymentCreatedAt = new Date(createdAt.getTime() + randInt(10, 25) * 24 * 60 * 60 * 1000);
        const payment = await Payment.create({
          gig: gig._id,
          milestoneId: milestone._id,
          client: gig.client,
          freelancer: acceptedFreelancer._id,
          amount: milestone.amount,
          razorpayOrderId: `order_mock_seed_${new mongoose.Types.ObjectId().toString().slice(-10)}`,
          status: milestone.status === 'approved' ? 'released' : 'escrow',
          isMock: true,
          releasedAt: milestone.status === 'approved' ? paymentCreatedAt : undefined,
        });
        await backdate(Payment, payment._id, paymentCreatedAt);
        paymentCount += 1;
      }
      await gig.save();
      await recomputeMilestoneProgress(gig);
    } else {
      const paymentCreatedAt = new Date(createdAt.getTime() + randInt(10, 25) * 24 * 60 * 60 * 1000);
      const isReleased = gig.status === 'completed';
      const payment = await Payment.create({
        gig: gig._id,
        client: gig.client,
        freelancer: acceptedFreelancer._id,
        amount: acceptedProposal.bidAmount,
        razorpayOrderId: `order_mock_seed_${new mongoose.Types.ObjectId().toString().slice(-10)}`,
        status: isReleased ? 'released' : 'escrow',
        isMock: true,
        releasedAt: isReleased ? paymentCreatedAt : undefined,
      });
      await backdate(Payment, payment._id, paymentCreatedAt);
      paymentCount += 1;
      gig.completionPercentage = isReleased ? 100 : randInt(15, 70);
      await gig.save();
    }

    // Reviews — only for completed gigs
    if (gig.status === 'completed') {
      const reviewCreatedAt = new Date(createdAt.getTime() + randInt(26, 40) * 24 * 60 * 60 * 1000);
      const clientRating = weightedRating();
      const clientReview = await Review.create({
        gig: gig._id,
        reviewer: gig.client,
        reviewee: acceptedFreelancer._id,
        rating: clientRating,
        comment: pickOne(REVIEW_COMMENTS[clientRating]),
        criteria: {
          communication: clamp(clientRating + randInt(-1, 1), 1, 5),
          quality: clamp(clientRating + randInt(-1, 1), 1, 5),
          timeliness: clamp(clientRating + randInt(-1, 1), 1, 5),
          professionalism: clamp(clientRating + randInt(-1, 1), 1, 5),
        },
      });
      await backdate(Review, clientReview._id, reviewCreatedAt);
      reviewDocs.push(clientReview);

      if (Math.random() < 0.65) {
        const freelancerRating = weightedRating();
        const freelancerReview = await Review.create({
          gig: gig._id,
          reviewer: acceptedFreelancer._id,
          reviewee: gig.client,
          rating: freelancerRating,
          comment: pickOne(REVIEW_COMMENTS[freelancerRating]),
          criteria: {
            communication: clamp(freelancerRating + randInt(-1, 1), 1, 5),
            quality: clamp(freelancerRating + randInt(-1, 1), 1, 5),
            timeliness: clamp(freelancerRating + randInt(-1, 1), 1, 5),
            professionalism: clamp(freelancerRating + randInt(-1, 1), 1, 5),
          },
        });
        await backdate(Review, freelancerReview._id, reviewCreatedAt);
        reviewDocs.push(freelancerReview);
      }
    }
  }

  return { proposalCount, paymentCount, reviewDocs };
};

/** Flags a couple of reviews as fraud-detected, using the same flagReason
 * strings reviewController.detectFraud produces, so the admin "flagged
 * reviews" page has realistic-looking entries to show. */
const flagAFewReviews = async (reviewDocs) => {
  if (reviewDocs.length === 0) return 0;
  const targets = pickN(reviewDocs, Math.min(2, reviewDocs.length));
  const reasons = ['High review velocity from this reviewer', 'Duplicate review text from this reviewer'];
  for (const [i, review] of targets.entries()) {
    review.flagged = true;
    review.flagReason = reasons[i % reasons.length];
    await review.save();
  }
  return targets.length;
};

/** Recomputes reputationScore/reviewCount for every user who received at
 * least one non-flagged review, using the exact same weighting logic the
 * live app uses (reviewController.refreshReputation), so the numbers shown
 * in the demo are real, consistent, computed values — not made up. */
const recomputeReputations = async (reviewDocs) => {
  const revieweeIds = [...new Set(reviewDocs.map((r) => r.reviewee.toString()))];
  for (const userId of revieweeIds) {
    const reviews = await Review.find({ reviewee: userId, flagged: false }).populate('gig', 'budgetMax');
    const score = computeWeightedScore(reviews);
    await User.findByIdAndUpdate(userId, { reputationScore: score, reviewCount: reviews.length });
  }
  return revieweeIds.length;
};

// ── Main ─────────────────────────────────────────────────────────────────

const main = async () => {
  const { faker } = await import('@faker-js/faker');

  await connectDB();

  const isReset = process.argv.includes('--reset');
  if (isReset) {
    await resetSeedData();
  }

  const existingSeedCount = await User.countDocuments({ isSeedData: true });
  if (existingSeedCount > 0) {
    console.log(
      `[seed] Found ${existingSeedCount} existing seed users — skipping to avoid duplicating data.\n` +
        '[seed] Run with --reset to clear existing seed data and reseed fresh: npm run seed:demo -- --reset'
    );
    await mongoose.disconnect();
    return;
  }

  console.log('[seed] Creating freelancers...');
  const freelancers = await createFreelancers(faker);

  console.log('[seed] Creating clients...');
  const clients = await createClients(faker);

  console.log('[seed] Creating gigs...');
  const gigs = await createGigs(clients);

  console.log('[seed] Creating proposals, payments, and reviews...');
  const { proposalCount, paymentCount, reviewDocs } = await createProposalsAndDownstream(gigs, freelancers, clients);

  console.log('[seed] Flagging a couple of reviews for the fraud-detection admin view...');
  const flaggedCount = await flagAFewReviews(reviewDocs);

  console.log('[seed] Recomputing weighted reputation scores...');
  const usersScored = await recomputeReputations(reviewDocs);

  const statusCounts = gigs.reduce((acc, { doc }) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {});

  console.log('\n[seed] Done! Summary:');
  console.log(`  Freelancers created:  ${freelancers.length}`);
  console.log(`  Clients created:      ${clients.length}`);
  console.log(`  Gigs created:         ${gigs.length}  (${Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(', ')})`);
  console.log(`  Proposals created:    ${proposalCount}`);
  console.log(`  Payments created:     ${paymentCount}`);
  console.log(`  Reviews created:      ${reviewDocs.length}  (${flaggedCount} flagged for fraud review)`);
  console.log(`  Users with a recomputed reputation score: ${usersScored}`);
  console.log(`\n  All seeded accounts use the password: ${SEED_PASSWORD}`);
  console.log(`  Example login: ${freelancers[0].email} / ${SEED_PASSWORD}\n`);

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('[seed] Fatal error:', err);
  process.exit(1);
});
