# Tooltip Examples

## Visual Examples of Tooltips in the Dashboard

### Example 1: Return on Equity (ROE)
When hovering over the info icon next to "ROE" in a KPI card:

```
┌─────────────────────────────────────────┐
│ Return on Equity (ROE)                  │
│ Rate of return on shareholder equity    │
│ investments                             │
└─────────────────────────────────────────┘
```

### Example 2: Strategic Performance Index
When hovering over the info icon in the main health score card:

```
┌─────────────────────────────────────────┐
│ Strategic Performance Index             │
│ Aggregate corporate health metric       │
│ combining profitability, liquidity,     │
│ solvency, and efficiency                │
└─────────────────────────────────────────┘
```

### Example 3: Total Assets
When hovering over "Total Assets" in the Company Overview:

```
┌─────────────────────────────────────────┐
│ Total Assets                            │
│ Sum of all resources owned by the       │
│ company with economic value             │
└─────────────────────────────────────────┘
```

### Example 4: Liquidity
When hovering over "Liquidity" in the performance dimensions:

```
┌─────────────────────────────────────────┐
│ Liquidity                               │
│ Ability to meet short-term financial    │
│ obligations with available assets       │
└─────────────────────────────────────────┘
```

### Example 5: Year-over-Year (YoY)
When hovering over the YoY indicator in KPI cards:

```
┌─────────────────────────────────────────┐
│ Year-over-Year (YoY)                    │
│ Comparison of current period            │
│ performance to same period last year    │
└─────────────────────────────────────────┘
```

### Example 6: Benchmarking
When hovering over the delta comparison:

```
┌─────────────────────────────────────────┐
│ Benchmarking                            │
│ Comparison of performance metrics       │
│ against peer companies or industry      │
│ standards                               │
└─────────────────────────────────────────┘
```

### Example 7: Debt-to-Equity Ratio (DER)
When hovering over "DER" metric:

```
┌─────────────────────────────────────────┐
│ Debt-to-Equity Ratio (DER)              │
│ Measures financial leverage by          │
│ comparing total liabilities to          │
│ shareholder equity                      │
└─────────────────────────────────────────┘
```

### Example 8: Operating Cash Flow
When hovering over cash flow metrics:

```
┌─────────────────────────────────────────┐
│ Operating Cash Flow                     │
│ Cash generated from core business       │
│ operations                              │
└─────────────────────────────────────────┘
```

## Tooltip Styling

All tooltips feature:
- **Dark background** (slate-900) for high contrast
- **White text** for readability
- **Rounded corners** for modern appearance
- **Smooth animations** (fade in/out)
- **Small arrow** pointing to the source element
- **Compact width** (256px) for easy scanning
- **Hover-triggered** - appears on mouse hover, disappears on mouse leave

## Positioning

Tooltips automatically position themselves:
- **Top** (default): Above the element
- **Bottom**: Below the element
- **Left**: To the left of the element
- **Right**: To the right of the element

The position can be adjusted based on available screen space.

## Accessibility

- Tooltips use semantic HTML
- Information icons are clearly visible
- Hover states provide visual feedback
- Text is high contrast for readability
- Font sizes are optimized for legibility

## Mobile Considerations

On touch devices:
- Tooltips may need tap-to-show functionality
- Consider adding a help button for mobile users
- Ensure tooltips don't block important content
- Test on various screen sizes

## Best Practices

1. **Keep descriptions concise** - Users should understand quickly
2. **Use plain language** - Avoid unnecessary jargon
3. **Be consistent** - Similar terms should have similar explanations
4. **Test with users** - Ensure explanations are clear
5. **Update regularly** - Keep descriptions current with business changes
