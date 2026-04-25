# MAFINDA - Quick Start Guide

## 🚀 Start Demo in 30 Seconds

```bash
npm run demo
```

Buka browser: **http://localhost:5000**

## 👤 Login Credentials

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Banking Officer | `banking` | `banking123` | Input cash flow |
| Finance Analyst | `finance` | `finance123` | Approve data |
| Admin | `admin` | `admin123` | Full access |

## 📋 Demo Checklist

1. ✅ Run `npm run demo`
2. ✅ Login as Banking Officer
3. ✅ Input cash flow data (Input Data tab)
4. ✅ Login as Finance Analyst
5. ✅ Approve data (Approval Center tab)
6. ✅ View updated dashboard (Dashboard tab)

## 🎯 Key Features to Show

- **Dashboard**: Cash position, Achievement gauge, Department performance
- **Input Form**: Weekly cash flow entry (W1-W5)
- **Approval**: Review and approve/reject workflow
- **Real-time**: Data updates immediately after approval

## 📚 Documentation

- **Demo Guide**: `MAFINDA_DEMO_GUIDE.md`
- **Demo Ready**: `MAFINDA_DEMO_READY.md`
- **Implementation**: `MAFINDA_IMPLEMENTATION_PROGRESS.md`

## 🆘 Troubleshooting

**Server won't start?**
```bash
# Kill existing process
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -ti:5000 | xargs kill -9
```

**No data showing?**
```bash
npm run seed:mafinda
```

**Reset everything?**
```bash
rm finance.db
npm run demo
```

## 💡 Pro Tips

- Use 2 browser windows for Banking Officer & Finance Analyst
- Current period has some pending approvals ready for demo
- Historical data available for 12 months (2024-01 to 2024-12)
- Select different companies (ASI/TSI) to see different data

---

**Need help?** Check `MAFINDA_DEMO_READY.md` for complete demo script!
