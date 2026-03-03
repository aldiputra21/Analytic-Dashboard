# Panduan Format Mata Uang - Rupiah

## Overview

Sistem Financial Ratio Monitoring menggunakan Rupiah (Rp) sebagai mata uang standar untuk semua tampilan nilai keuangan.

## Helper Function: formatRupiah()

### Signature
```typescript
function formatRupiah(value: number, showMillion: boolean = true): string
```

### Parameters
- `value` (number): Nilai numerik yang akan diformat
- `showMillion` (boolean, optional): 
  - `true` (default): Format dalam jutaan dengan suffix "M"
  - `false`: Format lengkap dengan separator ribuan

### Return Value
String dengan format Rupiah yang sesuai

## Contoh Penggunaan

### Mode Million (Default)
```typescript
formatRupiah(1200000)           // Output: "Rp 1.2M"
formatRupiah(5000000, true)     // Output: "Rp 5.0M"
formatRupiah(150500000)         // Output: "Rp 150.5M"
```

**Kapan Digunakan:**
- Chart axes (YAxis)
- Summary cards
- Dashboard overview
- Consolidated reports

### Mode Full
```typescript
formatRupiah(1200000, false)    // Output: "Rp 1.200.000"
formatRupiah(5000000, false)    // Output: "Rp 5.000.000"
formatRupiah(150500000, false)  // Output: "Rp 150.500.000"
```

**Kapan Digunakan:**
- Detail tables
- Tooltips
- Transaction lists
- Audit logs

## Implementasi di Komponen

### 1. Company Overview Cards
```typescript
<p className="text-lg font-bold text-slate-900">
  {formatRupiah(latest.total_assets)}
</p>
```

### 2. Chart YAxis
```typescript
<YAxis 
  fontSize={10} 
  tickLine={false} 
  axisLine={false} 
  tickFormatter={(v) => formatRupiah(v)} 
/>
```

### 3. Chart Tooltips
```typescript
<Tooltip formatter={(v: any) => formatRupiah(v, false)} />
```

### 4. Data Tables
```typescript
<td className="py-4 text-right font-mono text-xs">
  {formatRupiah(row.revenue, false)}
</td>
```

## Locale Indonesia

Function `formatRupiah()` menggunakan locale Indonesia (`id-ID`) untuk formatting:
- Separator ribuan: titik (.)
- Separator desimal: koma (,) - jika diperlukan
- Format: `Rp 1.200.000` bukan `Rp 1,200,000`

## Best Practices

### ✅ DO
- Gunakan `formatRupiah()` untuk semua nilai currency
- Gunakan mode million untuk charts dan summaries
- Gunakan mode full untuk detail views
- Consistent formatting across all components

### ❌ DON'T
- Jangan hardcode format currency (e.g., `$${value}`)
- Jangan mix format Dollar dan Rupiah
- Jangan gunakan locale selain 'id-ID'
- Jangan format manual dengan string concatenation

## Migration dari Dollar ke Rupiah

### Before (Dollar)
```typescript
// ❌ Old format
<p>${(value / 1000000).toFixed(1)}M</p>
<YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
<Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
```

### After (Rupiah)
```typescript
// ✅ New format
<p>{formatRupiah(value)}</p>
<YAxis tickFormatter={(v) => formatRupiah(v)} />
<Tooltip formatter={(v) => formatRupiah(v, false)} />
```

## Testing

### Unit Test Examples
```typescript
describe('formatRupiah', () => {
  it('should format million values correctly', () => {
    expect(formatRupiah(1200000)).toBe('Rp 1.2M');
    expect(formatRupiah(5000000)).toBe('Rp 5.0M');
  });

  it('should format full values with Indonesian locale', () => {
    expect(formatRupiah(1200000, false)).toBe('Rp 1.200.000');
    expect(formatRupiah(5000000, false)).toBe('Rp 5.000.000');
  });

  it('should handle large numbers', () => {
    expect(formatRupiah(1500000000)).toBe('Rp 1500.0M');
    expect(formatRupiah(1500000000, false)).toBe('Rp 1.500.000.000');
  });
});
```

## Komponen yang Menggunakan formatRupiah()

1. **CompanyOverview**
   - Total Assets
   - Total Equity
   - Total Liabilities

2. **GrowthTrends**
   - Revenue chart YAxis
   - Profit chart YAxis

3. **WaterfallChart**
   - YAxis formatter
   - Tooltip values

4. **FinancialBreakdown**
   - Asset Composition tooltip
   - Capital Structure tooltip

5. **CashFlowPanel**
   - YAxis formatter

6. **TrendAnalytics**
   - Revenue trend YAxis

7. **ConsolidatedReport**
   - Total Revenue card
   - Net Profit card
   - Total Assets card

8. **Historical Financial Data Table**
   - Revenue column
   - Net Profit column

## Future Enhancements

### Multi-Currency Support (Optional)
Jika diperlukan support untuk multiple currencies:

```typescript
type Currency = 'IDR' | 'USD' | 'EUR';

function formatCurrency(
  value: number, 
  currency: Currency = 'IDR',
  showMillion: boolean = true
): string {
  const formats = {
    IDR: { symbol: 'Rp', locale: 'id-ID' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' }
  };
  
  const { symbol, locale } = formats[currency];
  
  if (showMillion) {
    return `${symbol} ${(value / 1000000).toFixed(1)}M`;
  }
  return `${symbol} ${value.toLocaleString(locale)}`;
}
```

## Troubleshooting

### Issue: Number tidak ter-format dengan benar
**Solution:** Pastikan value adalah number, bukan string
```typescript
// ❌ Wrong
formatRupiah("1200000")

// ✅ Correct
formatRupiah(1200000)
formatRupiah(parseFloat(stringValue))
```

### Issue: Separator tidak sesuai (koma instead of titik)
**Solution:** Pastikan menggunakan locale 'id-ID'
```typescript
value.toLocaleString('id-ID') // ✅ Correct
value.toLocaleString('en-US') // ❌ Wrong for Indonesia
```

## Referensi

- [MDN: Number.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString)
- [Indonesian Number Formatting](https://en.wikipedia.org/wiki/Indonesian_rupiah)
- Locale Code: `id-ID` (Indonesia)
