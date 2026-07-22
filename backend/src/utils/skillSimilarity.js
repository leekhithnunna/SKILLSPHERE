const normalize = (skill) => skill.trim().toLowerCase();

/**
 * Local fallback: Jaccard similarity over normalized skill sets.
 * |intersection| / |union|, 0 when either set is empty.
 */
const jaccardSimilarity = (skillsA = [], skillsB = []) => {
  const setA = new Set(skillsA.map(normalize));
  const setB = new Set(skillsB.map(normalize));

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const skill of setA) {
    if (setB.has(skill)) intersectionSize += 1;
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
};

/**
 * Calls the Hugging Face Inference API for sentence embeddings and returns
 * cosine similarity between the two skill lists (joined into one string
 * each). Only used when HUGGINGFACE_API_KEY is set.
 */
const embeddingSimilarity = async (skillsA, skillsB) => {
  const textA = skillsA.join(', ');
  const textB = skillsB.join(', ');

  // api-inference.huggingface.co (the old Inference API host) has been
  // retired — Hugging Face now routes inference through this host instead.
  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: [textA, textB], options: { wait_for_model: true } }),
    }
  );

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const [embeddingA, embeddingB] = await response.json();

  const dot = embeddingA.reduce((sum, v, i) => sum + v * embeddingB[i], 0);
  const magA = Math.sqrt(embeddingA.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(embeddingB.reduce((sum, v) => sum + v * v, 0));

  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
};

/**
 * Computes a 0..1 skill-similarity score between two skill lists.
 * Uses the Hugging Face embedding API when HUGGINGFACE_API_KEY is set,
 * otherwise falls back to local Jaccard similarity — and also falls back
 * on any API error so matching never breaks because of a flaky third party.
 */
let modeLogged = false;

const computeSkillSimilarity = async (skillsA = [], skillsB = []) => {
  if (skillsA.length === 0 || skillsB.length === 0) return 0;

  if (!modeLogged) {
    modeLogged = true;
    console.log(
      process.env.HUGGINGFACE_API_KEY
        ? '[matching] Skill similarity mode: Hugging Face embeddings (HUGGINGFACE_API_KEY is set)'
        : '[matching] Skill similarity mode: local Jaccard fallback (HUGGINGFACE_API_KEY is not set)'
    );
  }

  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const score = await embeddingSimilarity(skillsA, skillsB);
      return Math.max(0, Math.min(1, score));
    } catch (err) {
      console.error('[matching] Hugging Face API failed, falling back to local similarity:', err.message);
    }
  }

  return jaccardSimilarity(skillsA, skillsB);
};

module.exports = { computeSkillSimilarity, jaccardSimilarity };
