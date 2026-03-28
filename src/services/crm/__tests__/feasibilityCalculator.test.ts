import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateFeasibility, deriveRecommendation, FEASIBILITY_THRESHOLDS } from '../feasibilityCalculator';

// Feature: mafinda-crm-module, Property 10: Kalkulasi Feasibility Score
describe('feasibilityCalculator', () => {
  it('returns score 100 when all criteria are 10', () => {
    const result = calculateFeasibility({
      technicalCapabilityScore: 10,
      resourceAvailabilityScore: 10,
      contractValueScore: 10,
      estimatedMarginScore: 10,
      riskScore: 10,
    });
    expect(result.feasibilityScore).toBe(100);
    expect(result.recommendation).toBe('Proceed');
  });

  it('returns score 0 when all criteria are 0', () => {
    const result = calculateFeasibility({
      technicalCapabilityScore: 0,
      resourceAvailabilityScore: 0,
      contractValueScore: 0,
      estimatedMarginScore: 0,
      riskScore: 0,
    });
    expect(result.feasibilityScore).toBe(0);
    expect(result.recommendation).toBe('Reject');
  });

  it('defaults missing scores to 0', () => {
    const result = calculateFeasibility({});
    expect(result.feasibilityScore).toBe(0);
    expect(result.recommendation).toBe('Reject');
  });

  it('recommendation is Reject when score < 40', () => {
    expect(deriveRecommendation(0)).toBe('Reject');
    expect(deriveRecommendation(39.9)).toBe('Reject');
  });

  it('recommendation is Hold when score is 40-70', () => {
    expect(deriveRecommendation(40)).toBe('Hold');
    expect(deriveRecommendation(70)).toBe('Hold');
  });

  it('recommendation is Proceed when score > 70', () => {
    expect(deriveRecommendation(70.1)).toBe('Proceed');
    expect(deriveRecommendation(100)).toBe('Proceed');
  });

  // Property 10: score always in [0, 100] and recommendation consistent with score
  it('Property 10: score always in [0,100] and recommendation consistent', () => {
    fc.assert(
      fc.property(
        fc.record({
          technicalCapabilityScore: fc.integer({ min: 0, max: 10 }),
          resourceAvailabilityScore: fc.integer({ min: 0, max: 10 }),
          contractValueScore: fc.integer({ min: 0, max: 10 }),
          estimatedMarginScore: fc.integer({ min: 0, max: 10 }),
          riskScore: fc.integer({ min: 0, max: 10 }),
        }),
        (input) => {
          const { feasibilityScore, recommendation } = calculateFeasibility(input);

          // Score must be in [0, 100]
          expect(feasibilityScore).toBeGreaterThanOrEqual(0);
          expect(feasibilityScore).toBeLessThanOrEqual(100);

          // Recommendation must be consistent with score
          if (feasibilityScore < FEASIBILITY_THRESHOLDS.REJECT_MAX) {
            expect(recommendation).toBe('Reject');
          } else if (feasibilityScore <= FEASIBILITY_THRESHOLDS.HOLD_MAX) {
            expect(recommendation).toBe('Hold');
          } else {
            expect(recommendation).toBe('Proceed');
          }
        }
      )
    );
  });
});
