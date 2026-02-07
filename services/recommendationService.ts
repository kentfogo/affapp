/**
 * Bayesian Recommendation Service
 *
 * Uses Beta-Binomial Thompson Sampling to learn which affirmations
 * resonate with the user. Each affirmation (and each category) maintains
 * a Beta(α, β) belief distribution. Higher α means more positive signals;
 * higher β means more negative signals.
 *
 * Ranking is done by *sampling* from each belief distribution (Thompson
 * Sampling), which naturally balances exploration vs. exploitation:
 * items with uncertain beliefs get sampled broadly, while items with
 * strong positive beliefs tend to rank high consistently.
 *
 * ── Status: DORMANT ──
 * This service is fully functional but NOT wired into any app flows.
 * See "Future activation" comments at the bottom of this file.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Affirmation } from '../types/affirmation';

// ─── Signal types & weights ────────────────────────────────────────────────────

/** User interaction signals that update beliefs. */
export type SignalType =
  | 'accept'     // Swiped right / chose the affirmation
  | 'reject'     // Swiped left / passed on it
  | 'replay'     // Listened to it again (passive, weak positive)
  | 'favorite'   // Deliberately starred / hearted
  | 'unfavorite' // Actively un-starred
  | 'skip';      // Skipped during session (weak negative)

/**
 * How much each signal nudges the Beta distribution.
 *
 * α (alpha) increments push the belief toward "user likes this".
 * β (beta)  increments push the belief toward "user dislikes this".
 *
 * The magnitudes are intentionally asymmetric so that strong deliberate
 * actions (favorite) carry more weight than passive ones (replay).
 */
const SIGNAL_WEIGHTS: Record<SignalType, { alpha: number; beta: number }> = {
  accept:     { alpha: 1.0, beta: 0   },
  reject:     { alpha: 0,   beta: 1.0 },
  replay:     { alpha: 0.3, beta: 0   },
  favorite:   { alpha: 2.0, beta: 0   },
  unfavorite: { alpha: 0,   beta: 1.5 },
  skip:       { alpha: 0,   beta: 0.5 },
};

/**
 * Category beliefs are updated at this fraction of the affirmation-level
 * weight. This lets us learn category preferences without over-counting
 * (each affirmation signal already updates the affirmation itself).
 */
const CATEGORY_WEIGHT_FRACTION = 0.3;

// ─── Belief state ──────────────────────────────────────────────────────────────

/** Beta distribution parameters for a single item (affirmation or category). */
export interface BeliefState {
  /** Positive evidence (Beta α parameter). Starts at 1 for uniform prior. */
  alpha: number;
  /** Negative evidence (Beta β parameter). Starts at 1 for uniform prior. */
  beta: number;
  /** Total number of signal events processed. */
  totalSignals: number;
  /** Epoch ms of last update. */
  lastUpdated: number;
}

interface AllBeliefs {
  affirmations: Record<string, BeliefState>;
  categories: Record<string, BeliefState>;
}

const STORAGE_KEY = '@bayesian_beliefs';

/** Uniform prior — no opinion yet. */
function defaultBelief(): BeliefState {
  return { alpha: 1, beta: 1, totalSignals: 0, lastUpdated: Date.now() };
}

// ─── Pure math: sampling from a Beta distribution ──────────────────────────────

/**
 * Box-Muller transform: returns a standard-normal variate (mean 0, σ 1).
 * Uses the basic form — generates two variates, discards one for simplicity.
 */
function randn(): number {
  let u = 0;
  let v = 0;
  // Reject exact-zero to avoid log(0)
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Sample from Gamma(shape, 1) using the Marsaglia & Tsang (2000) method.
 *
 * For shape >= 1 this is direct; for 0 < shape < 1 we use the
 * Ahrens-Dieter boost: Gamma(a) = Gamma(a+1) · U^(1/a).
 *
 * @param shape - The shape parameter (must be > 0).
 */
function sampleGamma(shape: number): number {
  if (shape <= 0) throw new Error('Gamma shape must be > 0');

  // Boost for shape < 1
  if (shape < 1) {
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let x: number;
    let v: number;
    do {
      x = randn();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    // Squeeze test (fast accept)
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;

    // Full log test
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * Sample from a Beta(α, β) distribution using two independent Gamma variates.
 *
 * Beta(α, β) = G1 / (G1 + G2)  where G1 ~ Gamma(α,1), G2 ~ Gamma(β,1).
 *
 * @param alpha - Must be > 0.
 * @param beta  - Must be > 0.
 * @returns A value in (0, 1).
 */
function sampleBeta(alpha: number, beta: number): number {
  const g1 = sampleGamma(alpha);
  const g2 = sampleGamma(beta);
  return g1 / (g1 + g2);
}

// ─── Service class ─────────────────────────────────────────────────────────────

class BayesianRecommendationService {
  private beliefs: AllBeliefs = { affirmations: {}, categories: {} };
  private loaded = false;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  // ── Persistence ────────────────────────────────────────────────────────────

  /** Load belief state from AsyncStorage. Safe to call multiple times. */
  async loadBeliefs(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: AllBeliefs = JSON.parse(raw);
        this.beliefs = {
          affirmations: parsed.affirmations ?? {},
          categories: parsed.categories ?? {},
        };
      }
    } catch {
      // First launch or corrupt data — start fresh
      this.beliefs = { affirmations: {}, categories: {} };
    }
    this.loaded = true;
  }

  /** Persist beliefs to AsyncStorage (debounced — waits 500 ms). */
  private scheduleSave(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveNow();
    }, 500);
  }

  /** Immediately persist beliefs. */
  private async saveNow(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.beliefs));
    } catch {
      // Storage write failed — beliefs stay in memory for this session
    }
  }

  // ── Belief helpers ─────────────────────────────────────────────────────────

  private getAffirmationBelief(id: string): BeliefState {
    if (!this.beliefs.affirmations[id]) {
      this.beliefs.affirmations[id] = defaultBelief();
    }
    return this.beliefs.affirmations[id];
  }

  private getCategoryBelief(category: string): BeliefState {
    if (!this.beliefs.categories[category]) {
      this.beliefs.categories[category] = defaultBelief();
    }
    return this.beliefs.categories[category];
  }

  // ── Core API ───────────────────────────────────────────────────────────────

  /**
   * Record a user interaction signal.
   *
   * Updates both the affirmation-level and category-level beliefs.
   * The category update is scaled down by `CATEGORY_WEIGHT_FRACTION`
   * to prevent a single affirmation from dominating category scores.
   *
   * @param id       - Affirmation ID (e.g. "anxiety_3").
   * @param category - Affirmation category (e.g. "anxiety").
   * @param signal   - The interaction type.
   */
  async updateBelief(
    id: string,
    category: string,
    signal: SignalType,
  ): Promise<void> {
    await this.loadBeliefs();

    const weights = SIGNAL_WEIGHTS[signal];

    // Update affirmation belief
    const affBelief = this.getAffirmationBelief(id);
    affBelief.alpha += weights.alpha;
    affBelief.beta += weights.beta;
    affBelief.totalSignals += 1;
    affBelief.lastUpdated = Date.now();

    // Update category belief (scaled down)
    const catBelief = this.getCategoryBelief(category);
    catBelief.alpha += weights.alpha * CATEGORY_WEIGHT_FRACTION;
    catBelief.beta += weights.beta * CATEGORY_WEIGHT_FRACTION;
    catBelief.totalSignals += 1;
    catBelief.lastUpdated = Date.now();

    this.scheduleSave();
  }

  /**
   * Rank a pool of affirmations using Thompson Sampling.
   *
   * For each affirmation we draw a sample from its Beta belief. The score
   * is a weighted blend of the affirmation-level sample and the
   * category-level sample:
   *
   *   score = w · affSample + (1 - w) · catSample
   *
   * where w ramps from 0 → 1 over the first 10 signals for that
   * affirmation. This means new/unseen affirmations lean on category
   * reputation, while well-observed ones use their own track record.
   *
   * @param pool - Affirmations to rank.
   * @returns The same affirmations, sorted best-first.
   */
  async rankAffirmations(pool: Affirmation[]): Promise<Affirmation[]> {
    await this.loadBeliefs();

    const scored = pool.map((aff) => {
      const affBelief = this.getAffirmationBelief(aff.id);
      const catBelief = this.getCategoryBelief(aff.category);

      const affSample = sampleBeta(affBelief.alpha, affBelief.beta);
      const catSample = sampleBeta(catBelief.alpha, catBelief.beta);

      // Affirmation weight ramps up over first 10 signals
      const affWeight = Math.min(affBelief.totalSignals / 10, 1);
      const score = affWeight * affSample + (1 - affWeight) * catSample;

      return { aff, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.aff);
  }

  /**
   * Get top categories ranked by deterministic Beta mean.
   *
   * Uses mean = α / (α + β) rather than Thompson Sampling so the
   * result is stable (useful for UI display, not exploration).
   *
   * @param limit - Max categories to return (default 3).
   * @returns Category names sorted by preference, best first.
   */
  async getTopCategories(limit = 3): Promise<string[]> {
    await this.loadBeliefs();

    const entries = Object.entries(this.beliefs.categories).map(
      ([name, belief]) => ({
        name,
        mean: belief.alpha / (belief.alpha + belief.beta),
      }),
    );

    entries.sort((a, b) => b.mean - a.mean);
    return entries.slice(0, limit).map((e) => e.name);
  }

  /** Clear all learned beliefs and remove persisted data. */
  async resetBeliefs(): Promise<void> {
    this.beliefs = { affirmations: {}, categories: {} };
    this.loaded = true;
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Diagnostic summary of current belief state.
   *
   * Useful for debugging or a future "why these recommendations?" screen.
   */
  async getBeliefSummary(): Promise<{
    totalAffirmations: number;
    totalCategories: number;
    topAffirmations: { id: string; mean: number; signals: number }[];
    topCategories: { name: string; mean: number; signals: number }[];
  }> {
    await this.loadBeliefs();

    const affEntries = Object.entries(this.beliefs.affirmations)
      .map(([id, b]) => ({
        id,
        mean: b.alpha / (b.alpha + b.beta),
        signals: b.totalSignals,
      }))
      .sort((a, b) => b.mean - a.mean);

    const catEntries = Object.entries(this.beliefs.categories)
      .map(([name, b]) => ({
        name,
        mean: b.alpha / (b.alpha + b.beta),
        signals: b.totalSignals,
      }))
      .sort((a, b) => b.mean - a.mean);

    return {
      totalAffirmations: affEntries.length,
      totalCategories: catEntries.length,
      topAffirmations: affEntries.slice(0, 10),
      topCategories: catEntries.slice(0, 5),
    };
  }
}

// ─── Singleton export ──────────────────────────────────────────────────────────

export const recommendationService = new BayesianRecommendationService();

// ─── Future activation ─────────────────────────────────────────────────────────
//
// 1. Analytics store → beliefs:
//    In affirmationAnalyticsStore.ts, call recommendationService.updateBelief()
//    from each track* method (trackAccept, trackReject, etc.).
//
// 2. Session ordering:
//    In session.tsx triggerAffirmation(), replace random selection with:
//      const ranked = await recommendationService.rankAffirmations(pool);
//      return ranked[0];
//
// 3. Onboarding pre-selection:
//    In onboarding.tsx, use recommendationService.getTopCategories() to
//    pre-select categories the user has historically preferred.
