# 🧪 Executive Dashboard - Testing Guide

## Quick Test Instructions

### 1. Start the Application

The development server should already be running. If not:

```bash
npm run dev
```

Access: `http://localhost:5000`

---

## 2. Navigate to Executive Dashboard

### Option A: Default View
- The app loads with the main dashboard
- Click **"Executive View"** in the sidebar (top item)

### Option B: Direct Navigation
- Look for the navigation sidebar on the left
- Click the first item: **"Executive View"** with LayoutDashboard icon

---

## 3. What You Should See

### Header Section
- ✅ Title: "Executive Dashboard"
- ✅ Last updated timestamp
- ✅ Refresh button (blue gradient)
- ✅ Company selector (ASI/TSI)

### KPI Cards Row (4 Cards)
1. **Net Profit**
   - Green gradient background
   - Dollar sign icon
   - Value in Rupiah (e.g., Rp 2.50B)
   - Trend indicator (↑ 12.5%)

2. **Total Assets**
   - Blue gradient background
   - Wallet icon
   - Value in Rupiah (e.g., Rp 15.00B)
   - Trend indicator (↑ 8.3%)

3. **Current Ratio**
   - Green/Orange gradient (based on health)
   - Activity icon
   - Ratio value (e.g., 2.08)
   - Health status badge

4. **DER**
   - Green/Orange gradient (based on health)
   - Target icon
   - Ratio value (e.g., 0.35)
   - Health status badge

### Main Grid (3 Rows)

**Row 1:**
- **Achievement Gauge** (left, 4 columns)
  - Semi-circle radial chart
  - Percentage in center
  - Top performer info
  - Low performer info
  - Maximize icon (top-right)

- **Cash Flow Trend** (right, 8 columns)
  - Area chart with 6 months data
  - Green area (Cash In)
  - Red area (Cash Out)
  - Grid lines
  - Maximize icon (top-right)

**Row 2:**
- **Asset Composition** (left, 4 columns)
  - Donut pie chart
  - 3 colored segments
  - Legend with values
  - Maximize icon (top-right)

- **Equity Composition** (middle, 4 columns)
  - Donut pie chart
  - 3 colored segments
  - Legend with values
  - Maximize icon (top-right)

- **Cost Alerts** (right, 4 columns)
  - List of over-budget items
  - Red border on alerts
  - Variance percentages
  - Maximize icon (top-right)

---

## 4. Interactive Features to Test

### A. Widget Expansion
1. **Hover** over any widget
2. **Click** the maximize icon (⛶) in top-right corner
3. Widget should expand to larger size
4. **Click** minimize icon (⊟) to collapse back

**Test Each Widget:**
- [ ] Achievement Gauge (4 cols → 6 cols)
- [ ] Cash Flow Trend (8 cols → 12 cols)
- [ ] Asset Composition (4 cols → 6 cols)
- [ ] Equity Composition (4 cols → 6 cols)
- [ ] Cost Alerts (4 cols → 12 cols)

### B. Auto Refresh
1. Note the "Last updated" time
2. Wait 5 minutes
3. Time should update automatically
4. All data should refresh

### C. Manual Refresh
1. **Click** the "Refresh" button in header
2. Button should show spinning icon
3. Data should reload
4. "Last updated" time should change
5. Button should return to normal

### D. Chart Interactions
1. **Hover** over charts to see tooltips
2. **Hover** over pie chart segments
3. **Hover** over area chart lines
4. **Hover** over legend items

### E. Company Switching
1. **Click** company selector in header
2. **Select** different company (ASI/TSI)
3. All data should reload for new company
4. Charts should update

---

## 5. Visual Checks

### Colors & Gradients
- [ ] Dark background (slate-900)
- [ ] KPI cards have gradient backgrounds
- [ ] Charts use proper colors
- [ ] Alerts are red-bordered
- [ ] Status badges are color-coded

### Typography
- [ ] Headers are bold and large
- [ ] Values are prominent
- [ ] Labels are readable
- [ ] Icons are properly sized

### Spacing & Layout
- [ ] Cards are evenly spaced
- [ ] Grid layout is balanced
- [ ] No overlapping elements
- [ ] Proper padding/margins

### Animations
- [ ] Smooth transitions
- [ ] Hover effects work
- [ ] Expansion is smooth
- [ ] Loading states show

---

## 6. Responsive Testing

### Desktop (> 1024px)
- [ ] 4 KPI cards in one row
- [ ] Full grid layout visible
- [ ] All widgets properly sized
- [ ] Sidebar always visible

### Tablet (768px - 1024px)
- [ ] 2 KPI cards per row
- [ ] Grid adjusts properly
- [ ] Charts remain readable
- [ ] Sidebar toggleable

### Mobile (< 768px)
- [ ] 1 KPI card per row
- [ ] Single column layout
- [ ] Charts stack vertically
- [ ] Sidebar collapsible

**To Test Responsive:**
1. Open browser DevTools (F12)
2. Click device toolbar icon
3. Select different device sizes
4. Check layout at each breakpoint

---

## 7. Data Validation

### Check Data Sources
All data should come from these APIs:

1. **Key Metrics:**
   - Endpoint: `/api/dashboard/key-metrics?companyId=ASI&period=2026-03`
   - Should return: netProfit, totalAssets, currentRatio, der, etc.

2. **Cash Position:**
   - Endpoint: `/api/dashboard/cash-position?companyId=ASI`
   - Should return: current cash position data

3. **Achievement:**
   - Endpoint: `/api/dashboard/achievement-gauge?companyId=ASI&period=2026-03`
   - Should return: overallAchievement percentage

4. **Department Performance:**
   - Endpoint: `/api/dashboard/dept-performance?companyId=ASI&period=2026-03`
   - Should return: highest and lowest performers

5. **Asset Composition:**
   - Endpoint: `/api/dashboard/asset-composition?companyId=ASI&period=2026-03`
   - Should return: currentAssets, fixedAssets, otherAssets

6. **Equity Composition:**
   - Endpoint: `/api/dashboard/equity-composition?companyId=ASI&period=2026-03`
   - Should return: modal, labaDitahan, deviden

7. **Historical Cash Flow:**
   - Endpoint: `/api/dashboard/historical-cash-flow?companyId=ASI&months=6`
   - Should return: 6 months of cash flow data

8. **Cost Control:**
   - Endpoint: `/api/cost-control?companyId=ASI&period=2026-03`
   - Should return: array of cost categories with alerts

### Verify in Browser Console
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Check API calls
5. Verify responses

---

## 8. Error Handling

### Test Error Scenarios

1. **Network Error:**
   - Disconnect internet
   - Try to refresh
   - Should show error state

2. **No Data:**
   - Switch to company with no data
   - Should show empty states
   - Should not crash

3. **API Failure:**
   - Check console for errors
   - Should handle gracefully
   - Should show fallback UI

---

## 9. Performance Checks

### Load Time
- [ ] Initial load < 3 seconds
- [ ] Refresh < 1 second
- [ ] Smooth animations (60fps)
- [ ] No lag on interactions

### Memory Usage
1. Open DevTools → Performance
2. Record while using dashboard
3. Check for memory leaks
4. Verify smooth performance

---

## 10. Browser Compatibility

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if available)

---

## 11. Expected Results

### Success Criteria
✅ All widgets display correctly
✅ Data loads from APIs
✅ Charts render properly
✅ Interactions work smoothly
✅ Responsive on all devices
✅ No console errors
✅ Auto-refresh works
✅ Manual refresh works
✅ Widget expansion works
✅ Company switching works

### Common Issues & Solutions

**Issue:** Charts not rendering
- **Solution:** Check if Recharts is installed: `npm install recharts`

**Issue:** Data not loading
- **Solution:** Verify server is running and database is seeded

**Issue:** Styles not applied
- **Solution:** Check if Tailwind CSS is configured properly

**Issue:** Icons not showing
- **Solution:** Verify lucide-react is installed: `npm install lucide-react`

**Issue:** Animations not smooth
- **Solution:** Check if framer-motion is installed: `npm install framer-motion`

---

## 12. Screenshot Checklist

Take screenshots of:
- [ ] Full executive dashboard view
- [ ] Each KPI card
- [ ] Achievement gauge
- [ ] Cash flow chart
- [ ] Asset composition chart
- [ ] Equity composition chart
- [ ] Cost alerts
- [ ] Expanded widgets
- [ ] Mobile view
- [ ] Tablet view

---

## 13. Demo Preparation

### Before BOD Meeting
1. ✅ Seed database with realistic data
2. ✅ Test all features
3. ✅ Clear browser cache
4. ✅ Close unnecessary tabs
5. ✅ Test on presentation screen
6. ✅ Prepare backup plan

### During Demo
1. Start with Executive View
2. Explain each KPI card
3. Show achievement gauge
4. Demonstrate cash flow trend
5. Expand widgets for details
6. Show cost alerts
7. Switch companies
8. Refresh data
9. Navigate to detailed views

---

## 14. Troubleshooting

### If Dashboard Doesn't Load
```bash
# 1. Check if server is running
# Look for: "Server running on http://localhost:5000"

# 2. Check database
# Verify finance.db exists

# 3. Reseed database
npm run seed

# 4. Restart server
# Stop with Ctrl+C, then:
npm run dev
```

### If Data is Missing
```bash
# Run seed script
npm run seed

# Or run init-and-seed
npx tsx init-and-seed.ts
```

### If Charts Don't Render
```bash
# Reinstall dependencies
npm install

# Clear cache
rm -rf node_modules
npm install
```

---

## 15. Success Indicators

### Visual Indicators
- ✅ Dark theme applied
- ✅ Gradients visible
- ✅ Charts colorful
- ✅ Icons displayed
- ✅ Animations smooth

### Functional Indicators
- ✅ Data loads
- ✅ Clicks work
- ✅ Hovers respond
- ✅ Refresh updates
- ✅ Navigation works

### Performance Indicators
- ✅ Fast load time
- ✅ Smooth scrolling
- ✅ No lag
- ✅ No errors
- ✅ Responsive

---

## 🎉 Test Complete!

If all checks pass, the Executive Dashboard is ready for:
- ✅ BOD presentations
- ✅ Daily monitoring
- ✅ Executive briefings
- ✅ Board meetings
- ✅ Stakeholder reviews

---

## 📞 Support

If you encounter issues:
1. Check console for errors
2. Verify API endpoints
3. Check database data
4. Review documentation
5. Test in different browser

---

**Happy Testing!** 🚀

The Executive Dashboard is designed to impress and inform. Take your time to explore all features and ensure everything works perfectly before the big presentation.

---

**Test Date:** _____________
**Tested By:** _____________
**Status:** [ ] Pass [ ] Fail
**Notes:** _____________________________________________
