
import { mapRowToRatios, calculateHealthScore } from '../src/services/financial/ratioCalculator.ts';

const rowMar = {
  roa: 0.06884781479316838756,
  roe: 0.10831945522906534799,
  npm: 0.17694135848571659842,
  der: 0.65102783113327066901,
  current_ratio: 1.35,
  quick_ratio: 1.05,
  cash_ratio: 0.525,
};

const rowDec = {
  roa: 0.08067226643088712054,
  roe: 0.12477859424927409912,
  npm: 0.19815513408289155440,
  der: 0.64002815394500544411,
  current_ratio: 1.35,
  quick_ratio: 1.05,
  cash_ratio: 0.525,
};

const ratiosMar = mapRowToRatios(rowMar as any);
const ratiosDec = mapRowToRatios(rowDec as any);

console.log('Ratios March:', ratiosMar);
console.log('Score March:', calculateHealthScore(ratiosMar));

console.log('Ratios December:', ratiosDec);
console.log('Score December:', calculateHealthScore(ratiosDec));
