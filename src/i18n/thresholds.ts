// i18n/thresholds.ts
import { Locale } from './commons';

export interface ThresholdCopy {
  messages: {
    criticallyBelow: string;
    belowHealthy: string;
    criticallyAbove: string;
    aboveHealthy: string;
    negativeOcf: string;
    decliningTrend: string;
  };
}

export const thresholdI18n: Record<Locale, ThresholdCopy> = {
  id: {
    messages: {
      criticallyBelow: '{ratio} {value} berada jauh di bawah ambang batas moderat {threshold}',
      belowHealthy: '{ratio} {value} berada di bawah ambang batas sehat {threshold}',
      criticallyAbove: '{ratio} {value} melampaui ambang batas moderat {threshold}',
      aboveHealthy: '{ratio} {value} melampaui ambang batas sehat {threshold}',
      negativeOcf: 'Arus Kas Operasional Negatif: {value}',
      decliningTrend: '{ratio} menunjukkan tren menurun selama 3 periode berturut-turut: {oldest} -> {middle} -> {latest}',
    },
  },
  en: {
    messages: {
      criticallyBelow: '{ratio} {value} is critically below moderate threshold of {threshold}',
      belowHealthy: '{ratio} {value} is below healthy threshold of {threshold}',
      criticallyAbove: '{ratio} {value} critically exceeds moderate threshold of {threshold}',
      aboveHealthy: '{ratio} {value} exceeds healthy threshold of {threshold}',
      negativeOcf: 'Negative Operating Cash Flow: {value}',
      decliningTrend: '{ratio} shows declining trend over 3 consecutive periods: {oldest} -> {middle} -> {latest}',
    },
  },
};
