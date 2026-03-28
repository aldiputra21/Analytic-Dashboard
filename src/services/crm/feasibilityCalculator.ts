import { QualificationRecommendation, CreateQualificationInput } from '../../types/crm';

// ============================================================
// Feasibility Calculator
// Computes feasibility_score (0-100) from weighted criteria
// and determines recommendation (Proceed/Hold/Reject).
// Requirements: 3.2, 3.3, 3.4
// ============================================================

/**
 * Weights for each scoring dimension.
 * Technical: 40%, Business: 60%
 */
const WEIGHTS = {
  technicalCapability: 0.20,
  resourceAvailability: 0.20,
  contractValue: 0.20,
  estimatedMargin: 0.25,
  risk: 0.15,
};

/** Thresholds for recommendation (Req 3.3, 3.4) */
export const FEASIBILITY_THRESHOLDS = {
  REJECT_MAX: 40,   // score < 40 → Reject
  HOLD_MAX: 70,     // 40 <= score <= 70 → Hold
  // score > 70 → Proceed
};

export interface FeasibilityResult {
  feasibilityScore: number;
  recommendation: QualificationRecommendation;
}

/**
 * Calculates feasibility score (0-100) from individual criterion scores (0-10).
 * Returns score and recommendation based on thresholds.
 * Requirements: 3.2, 3.3, 3.4
 */
export function calculateFeasibility(input: CreateQualificationInput): FeasibilityResult {
  const {
    technicalCapabilityScore = 0,
    resourceAvailabilityScore = 0,
    contractValueScore = 0,
    estimatedMarginScore = 0,
    riskScore = 0,
  } = input;

  // Clamp each score to [0, 10]
  const clamp = (v: number) => Math.max(0, Math.min(10, v));

  const weighted =
    clamp(technicalCapabilityScore) * WEIGHTS.technicalCapability +
    clamp(resourceAvailabilityScore) * WEIGHTS.resourceAvailability +
    clamp(contractValueScore) * WEIGHTS.contractValue +
    clamp(estimatedMarginScore) * WEIGHTS.estimatedMargin +
    clamp(riskScore) * WEIGHTS.risk;

  // Scale from [0, 10] to [0, 100]
  const feasibilityScore = Math.round(weighted * 10 * 10) / 10;

  const recommendation = deriveRecommendation(feasibilityScore);

  return { feasibilityScore, recommendation };
}

/**
 * Derives recommendation from feasibility score.
 * Requirements: 3.3, 3.4
 */
export function deriveRecommendation(score: number): QualificationRecommendation {
  if (score < FEASIBILITY_THRESHOLDS.REJECT_MAX) return 'Reject';
  if (score <= FEASIBILITY_THRESHOLDS.HOLD_MAX) return 'Hold';
  return 'Proceed';
}
