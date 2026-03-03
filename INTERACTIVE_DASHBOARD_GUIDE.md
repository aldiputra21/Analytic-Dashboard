# Interactive Dashboard Guide

## Overview

Dashboard Financial Ratio Monitoring sekarang fully interactive dengan real-time filtering berdasarkan date range dan company selection.

## Fitur Interactive

### 1. Date Range Filter (Calendar Picker)

**Lokasi:** Filter bar di bagian atas dashboard

**Cara Penggunaan:**
- Klik input "Start Date" untuk memilih tanggal awal
- Klik input "End Date" untuk memilih tanggal akhir
- Data akan otomatis ter-filter sesuai range yang dipilih

**Format:**
- Input: `YYYY-MM-DD` (e.g., 2025-01-01)
- Browser native date picker untuk UX yang konsisten

### 2. Quick Date Presets

**Lokasi:** Button "Quick Select" di filter bar

**Preset Options:**
- Last 3 Months
- Last 6 Months
- Last 1 Year
- Last 2 Years
- Last 3 Years
- Year to Date (YTD)

**Cara Penggunaan:**
1. Klik button "Quick Select"
2. Pilih preset dari dropdown
3. Date range akan otomatis ter-set

### 3. Company Filter

**Lokasi:** Company selector di filter bar

**Options:**
- ASI - Subsidiary 1
- TSI - Subsidiary 2
- SUB3 - Subsidiary 3
- SUB4 - Subsidiary 4
- SUB5 - Subsidiary 5
- ALL - View all companies

**Behavior:**
- Single selection
- Charts dan KPIs akan update sesuai company yang dipilih
- Mode "ALL" menampilkan data consolidated

### 4. Period Type Filter

**Lokasi:** Period selector di filter bar

**Options:**
- Monthly - Data bulanan
- Quarterly - Data kuartalan
- Yearly - Data tahunan

**Note:** Saat ini filter period type sudah ada di UI, implementasi backend untuk aggregation akan ditambahkan di fase berikutnya.

## Visual Feedback

### Loading States

**Initial Load:**
```
┌─────────────────────────┐
│   🔄 Loading spinner    │
│ "Loading financial data"│
└─────────────────────────┘
```

**Filtering:**
```
┌──────────────────┐
│ 🔄 Filtering...  │
└──────────────────┘
```

### Record Counter

**Normal State:**
```
┌──────────────────┐
│ ✓ 24 records    │
└──────────────────┘
```

**Filtering State:**
```
┌──────────────────┐
│ 🔄 Filtering...  │
└──────────────────┘
```

### Empty State

Ketika tidak ada data setelah filtering:

```
┌─────────────────────────────┐
│      ⚠️ No Data Found       │
│                             │
│  No financial data available│
│  for the selected filters   │
│                             │
│    [Reset Filters]          │
└─────────────────────────────┘
```

### Reset Button

Muncul ketika filter aktif (date range berbeda dari default):

```
┌──────────┐
│ ✕ Reset  │
└──────────┘
```

## Data Flow

### 1. Initial Load
```
User opens dashboard
    ↓
Fetch all companies
    ↓
Fetch all ratios (unfiltered)
    ↓
Store in allRatios state
    ↓
Apply default filters (last 1 year)
    ↓
Display filtered data
```

### 2. Filter Change
```
User changes date range
    ↓
Set filtering = true
    ↓
Show "Filtering..." indicator
    ↓
Filter allRatios by date range
    ↓
Update ratios state
    ↓
Set filtering = false
    ↓
Charts & KPIs auto-update
```

### 3. Company Change
```
User selects company
    ↓
Fetch ratios for selected company
    ↓
Apply date range filter
    ↓
Update display
```

## State Management

### Key States

```typescript
// Date range filter
const [dateRange, setDateRange] = useState({
  start: '2025-02-26', // 1 year ago
  end: '2026-02-26'    // today
});

// All fetched data (unfiltered)
const [allRatios, setAllRatios] = useState<FinancialRatio[]>([]);

// Filtered data for display
const [ratios, setRatios] = useState<FinancialRatio[]>([]);

// Loading states
const [loading, setLoading] = useState(true);
const [filtering, setFiltering] = useState(false);

// Selected filters
const [selectedCompany, setSelectedCompany] = useState('both');
const [periodType, setPeriodType] = useState('monthly');
```

### Filter Logic

```typescript
useEffect(() => {
  if (allRatios.length === 0) return;

  setFiltering(true);
  
  const timer = setTimeout(() => {
    const filtered = allRatios.filter((ratio) => {
      const ratioPeriod = new Date(ratio.period + '-01');
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      return ratioPeriod >= startDate && ratioPeriod <= endDate;
    });

    setRatios(filtered);
    setFiltering(false);
  }, 300); // Debounce for better UX

  return () => clearTimeout(timer);
}, [dateRange, allRatios]);
```

## Components Affected by Filters

### Charts
1. ✅ Growth Trends (Revenue & Profitability)
2. ✅ Operational Efficiency Ratios
3. ✅ Waterfall Chart
4. ✅ Cash Flow Panel
5. ✅ Trend Analytics
6. ✅ Financial Breakdown

### Cards & KPIs
1. ✅ Company Overview
2. ✅ Health Score Gauge
3. ✅ KPI Cards (ROA, ROE, NPM, DER, Current Ratio)
4. ✅ Performance Ranking
5. ✅ Risk Alert Widget

### Tables
1. ✅ Historical Financial Data Table
2. ✅ Executive Ratio Audit

### Alerts
1. ✅ Early Warning Summary

## User Experience Features

### 1. Debouncing
- Filter changes debounced by 300ms
- Prevents excessive re-renders
- Smoother user experience

### 2. Visual Feedback
- Loading spinner during initial load
- "Filtering..." indicator during filter changes
- Record counter shows current data count
- Empty state with helpful message

### 3. Reset Functionality
- One-click reset to default filters
- Reset button only shows when filters are active
- Resets date range, company, and period type

### 4. Responsive Design
- Date pickers adapt to screen size
- Filter bar wraps on mobile
- Touch-friendly controls

## Best Practices

### For Users

**DO:**
- ✅ Use Quick Select for common date ranges
- ✅ Check record counter to verify data availability
- ✅ Use Reset button to clear all filters
- ✅ Select specific company for detailed analysis

**DON'T:**
- ❌ Select date range with no data
- ❌ Expect instant updates (allow 300ms debounce)
- ❌ Forget to check "Filtering..." indicator

### For Developers

**DO:**
- ✅ Keep allRatios as source of truth
- ✅ Filter on client-side for better performance
- ✅ Use debouncing for filter changes
- ✅ Show loading states during operations
- ✅ Validate date ranges

**DON'T:**
- ❌ Mutate allRatios state
- ❌ Filter without debouncing
- ❌ Forget to handle empty states
- ❌ Skip loading indicators

## Troubleshooting

### Issue: Charts not updating after filter change
**Solution:** Check if ratios state is being updated correctly
```typescript
console.log('Filtered ratios:', ratios);
```

### Issue: "Filtering..." stuck on screen
**Solution:** Ensure filtering state is set to false after filter completes
```typescript
setFiltering(false);
```

### Issue: Empty state showing with data available
**Solution:** Check date range filter logic
```typescript
const ratioPeriod = new Date(ratio.period + '-01');
console.log('Period:', ratioPeriod, 'Range:', startDate, endDate);
```

### Issue: Quick presets not working
**Solution:** Verify date calculation in handlePresetClick
```typescript
console.log('Preset dates:', start, end);
```

## Future Enhancements

### Planned Features
1. ⏳ Backend period type aggregation (monthly → quarterly → yearly)
2. ⏳ Advanced filters (by metric threshold, status, etc.)
3. ⏳ Save filter presets
4. ⏳ URL-based filter state (shareable links)
5. ⏳ Export filtered data
6. ⏳ Real-time data updates
7. ⏳ Filter history/undo

### Performance Optimizations
1. ⏳ Virtual scrolling for large datasets
2. ⏳ Memoization of expensive calculations
3. ⏳ Web Workers for heavy filtering
4. ⏳ Progressive data loading

## API Integration

### Current Implementation
```typescript
// Fetch all data once
fetch('/api/ratios?companyId=both')
  .then(res => res.json())
  .then(data => {
    setAllRatios(data);
    // Client-side filtering
  });
```

### Recommended Backend Enhancement
```typescript
// Server-side filtering for better performance
fetch(`/api/ratios?companyId=${company}&startDate=${start}&endDate=${end}&period=${type}`)
  .then(res => res.json())
  .then(data => setRatios(data));
```

## Testing Checklist

- [ ] Date range filter updates charts
- [ ] Quick presets set correct dates
- [ ] Company filter changes data
- [ ] Period type selector works
- [ ] Empty state shows when no data
- [ ] Reset button clears all filters
- [ ] Loading states display correctly
- [ ] Record counter updates
- [ ] Filtering indicator shows/hides
- [ ] Debouncing prevents excessive updates
- [ ] Mobile responsive
- [ ] Date picker works on all browsers

## Keyboard Shortcuts (Future)

Planned keyboard shortcuts for power users:
- `Ctrl/Cmd + R` - Reset filters
- `Ctrl/Cmd + 1-5` - Quick date presets
- `Ctrl/Cmd + A` - Select all companies
- `Arrow keys` - Navigate date picker

## Accessibility

- ✅ Semantic HTML for date inputs
- ✅ ARIA labels for screen readers
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Color contrast compliance
- ✅ Loading announcements

## Browser Compatibility

**Supported:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Date Input Support:**
- Native date picker on modern browsers
- Fallback to text input on older browsers
