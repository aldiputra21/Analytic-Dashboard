import { 
  getDeptRevenueTarget, 
  getRevenueCostSummary,
  getCashFlowData,
  getAssetComposition,
  getEquityLiabilityComposition,
  getHistoricalData
} from '../src/services/mafinda/dashboardService';

async function test() {
  try {
    const period = '2026-03';
    console.log(`Testing all services for period ${period}...`);
    
    const results = await Promise.allSettled([
      getDeptRevenueTarget(period),
      getRevenueCostSummary(period),
      getCashFlowData(period),
      getAssetComposition(period),
      getEquityLiabilityComposition(period),
      getHistoricalData(6)
    ]);

    results.forEach((r, i) => {
      const names = ['revTarget', 'revCost', 'cashFlow', 'assets', 'equity', 'historical'];
      if (r.status === 'fulfilled') {
        console.log(`${names[i]} Success`);
      } else {
        console.error(`${names[i]} Failed:`, r.reason);
      }
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
