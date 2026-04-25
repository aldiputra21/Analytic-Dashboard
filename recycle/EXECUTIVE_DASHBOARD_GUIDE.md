# 📊 Executive Dashboard - BOD Single Page View

## Overview

Dashboard executive yang compact dan interactive, dirancang khusus untuk Board of Directors (BOD) dengan semua informasi penting dalam satu halaman.

---

## 🎯 Key Features

### 1. **Single Page Layout**
- Semua informasi critical dalam 1 view
- No scrolling untuk data penting
- Grid-based responsive layout
- Dark theme untuk professional look

### 2. **Real-time Data**
- Auto-refresh setiap 5 menit
- Manual refresh button
- Last update timestamp
- Loading states

### 3. **Interactive Widgets**
- Expandable/collapsible widgets
- Hover effects
- Smooth animations
- Click to expand for details

### 4. **Compact Information Display**
- KPI cards dengan trends
- Mini charts
- Color-coded alerts
- Quick insights

---

## 📐 Layout Structure

### Grid System (12 columns)

```
┌─────────────────────────────────────────────┐
│  KPI Cards (4 columns each)                 │
│  [Net Profit] [Assets] [Ratio] [DER]       │
├─────────────────────────────────────────────┤
│  Achievement  │  Cash Flow Trend (8 cols)   │
│  Gauge        │                              │
│  (4 cols)     │                              │
├─────────────────────────────────────────────┤
│  Assets  │  Equity  │  Cost Alerts          │
│  (4 cols)│  (4 cols)│  (4 cols)             │
└─────────────────────────────────────────────┘
```

---

## 🎨 Components

### 1. **Header Section**
- Title: "Executive Dashboard"
- Last update time dengan icon
- Refresh button dengan loading state
- Company selector (inherited from parent)

### 2. **KPI Cards (4 Cards)**

#### Card 1: Net Profit
- Value dalam Rupiah
- Trend indicator (↑ 12.5%)
- Gradient: Emerald to Teal
- Icon: DollarSign

#### Card 2: Total Assets
- Value dalam Rupiah
- Trend indicator (↑ 8.3%)
- Gradient: Blue to Cyan
- Icon: Wallet

#### Card 3: Current Ratio
- Ratio value (e.g., 2.08)
- Health status badge
- Color: Green (healthy) / Orange (warning)
- Icon: Activity

#### Card 4: DER (Debt to Equity Ratio)
- Ratio value (e.g., 0.35)
- Health status badge
- Color: Green (≤2.0) / Orange (>2.0)
- Icon: Target

### 3. **Achievement Gauge Widget**
- Radial bar chart (semi-circle)
- Overall achievement percentage
- Top performer division
- Lowest performer division
- Expandable untuk detail

### 4. **Cash Flow Trend Widget**
- Area chart (6 months)
- Cash In (green gradient)
- Cash Out (red gradient)
- Expandable untuk full view
- Tooltip dengan values

### 5. **Asset Composition Widget**
- Donut pie chart
- 3 segments:
  - Current Assets (green)
  - Fixed Assets (blue)
  - Other Assets (purple)
- Legend dengan values
- Expandable

### 6. **Equity Composition Widget**
- Donut pie chart
- 3 segments:
  - Modal (amber)
  - Laba Ditahan (green)
  - Deviden (indigo)
- Legend dengan values
- Expandable

### 7. **Cost Control Alerts Widget**
- List of over-budget items
- Shows top 3 alerts (expandable to 10)
- Red border untuk alerts
- Variance percentage
- Budget vs Actual comparison

---

## 🎭 Interactive Features

### 1. **Widget Expansion**
Click maximize icon (⛶) untuk expand widget:
- Achievement: 4 cols → 6 cols
- Cash Flow: 8 cols → 12 cols
- Assets: 4 cols → 6 cols
- Equity: 4 cols → 6 cols
- Cost Alerts: 4 cols → 12 cols

### 2. **Auto Refresh**
- Interval: 5 minutes (300000ms)
- Fetches all data simultaneously
- Updates timestamp
- Smooth transitions

### 3. **Manual Refresh**
- Button di header
- Spinning icon saat loading
- Disabled state during refresh
- Updates all widgets

### 4. **Hover Effects**
- KPI cards: Scale up
- Widgets: Highlight
- Buttons: Color change
- Charts: Tooltips

---

## 📊 Data Sources

### API Endpoints Used:
1. `/api/dashboard/key-metrics` - KPI data
2. `/api/dashboard/cash-position` - Cash position
3. `/api/dashboard/dept-performance` - Department performance
4. `/api/dashboard/achievement-gauge` - Achievement data
5. `/api/dashboard/asset-composition` - Asset breakdown
6. `/api/dashboard/equity-composition` - Equity breakdown
7. `/api/dashboard/historical-cash-flow` - 6 months trend
8. `/api/cost-control` - Cost control alerts

### Data Refresh Strategy:
- Initial load on mount
- Auto-refresh every 5 minutes
- Manual refresh on button click
- Parallel API calls untuk performance

---

## 🎨 Design System

### Color Scheme (Dark Theme)
- Background: `slate-900` gradient
- Cards: `slate-800` to `slate-900` gradient
- Borders: `slate-700`
- Text: White & `slate-400`
- Accents: Blue, Green, Orange, Red

### Gradients Used:
- **Success**: `emerald-500` to `teal-600`
- **Info**: `blue-500` to `cyan-600`
- **Warning**: `orange-500` to `red-600`
- **Healthy**: `green-500` to `emerald-600`

### Typography:
- Headers: `text-3xl font-black`
- KPI Values: `text-3xl font-black`
- Labels: `text-sm font-medium`
- Small text: `text-xs`

### Spacing:
- Container padding: `p-6`
- Grid gap: `gap-4`
- Card padding: `p-6`
- Element spacing: `space-y-2`, `space-y-3`

---

## 📱 Responsive Behavior

### Desktop (lg: 1024px+)
- 4 KPI cards in row
- Full grid layout
- All widgets visible

### Tablet (md: 768px+)
- 2 KPI cards per row
- Adjusted grid columns
- Widgets stack properly

### Mobile (< 768px)
- 1 KPI card per row
- Single column layout
- Widgets full width
- Scrollable content

---

## 🔧 Customization

### Changing Refresh Interval
```typescript
// In useEffect, change interval (in milliseconds)
const interval = setInterval(fetchData, 300000); // 5 minutes
```

### Adjusting Widget Sizes
```typescript
// In grid className
className={`${expandedWidget === 'id' ? 'col-span-12' : 'col-span-4'}`}
```

### Adding New KPI Card
```typescript
{
  id: 'new-kpi',
  label: 'Label',
  value: 'Value',
  change: 10.5,
  trend: 'up',
  icon: IconComponent,
  color: 'from-color-500 to-color-600',
  bgColor: 'from-color-50 to-color-50'
}
```

---

## 💡 Usage

### Access Executive Dashboard
1. Login ke MAFINDA
2. Click **"Executive View"** di sidebar
3. Dashboard akan load dengan semua data
4. Wait for auto-refresh atau click refresh button

### Expand Widget
1. Hover pada widget
2. Click maximize icon (⛶) di top-right
3. Widget akan expand
4. Click minimize icon (⊟) untuk collapse

### View Details
- Hover pada charts untuk tooltips
- Click pada legend items
- Scroll cost alerts untuk more items

---

## 🎯 Use Cases

### For BOD/C-Level:
- ✅ Quick morning briefing
- ✅ Board meeting presentation
- ✅ Performance monitoring
- ✅ Alert identification
- ✅ Trend analysis

### For Executives:
- ✅ Daily dashboard check
- ✅ KPI tracking
- ✅ Department comparison
- ✅ Cost monitoring
- ✅ Financial health overview

---

## 📈 Metrics Displayed

### Financial Metrics:
- Net Profit dengan trend
- Total Assets dengan trend
- Current Ratio dengan status
- DER dengan status

### Performance Metrics:
- Overall Achievement (%)
- Top performing division
- Lowest performing division

### Cash Flow:
- 6 months historical trend
- Cash In vs Cash Out
- Net cash flow

### Composition:
- Asset breakdown (3 categories)
- Equity breakdown (3 categories)

### Alerts:
- Over-budget categories
- Variance percentages
- Budget vs Actual

---

## 🚀 Performance

### Load Time:
- Initial: ~2 seconds
- Refresh: ~1 second
- Smooth animations

### Optimization:
- Parallel API calls
- Lazy loading charts
- Efficient re-renders
- Memoized calculations

---

## ✅ Checklist

### Data Display:
- ✅ 4 KPI cards
- ✅ Achievement gauge
- ✅ Cash flow trend
- ✅ Asset composition
- ✅ Equity composition
- ✅ Cost alerts

### Interactions:
- ✅ Widget expansion
- ✅ Auto refresh
- ✅ Manual refresh
- ✅ Hover effects
- ✅ Tooltips

### Responsive:
- ✅ Desktop layout
- ✅ Tablet layout
- ✅ Mobile layout

---

## 🎉 Result

Executive Dashboard provides:
- 📊 Complete overview dalam 1 page
- ⚡ Real-time data updates
- 🎨 Professional dark theme
- 🖱️ Interactive widgets
- 📱 Responsive design
- 🚀 Fast performance

**Perfect untuk BOD presentations dan daily monitoring!**

---

## 🔗 Navigation

Access via:
- Sidebar: **Executive View** (top item)
- Direct URL: `/executive`
- Keyboard: Tab navigation

Test now: **http://localhost:5000**
