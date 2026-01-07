# Simple UI Design (Trading Dashboard)

This is a minimal, clean UI layout aligned to the backend endpoints and data shapes.
It is intentionally low-fidelity so it can be reviewed and approved before coding.

## Global layout
- **Header (sticky)**
  - Left: App logo/name
  - Center: Global search (symbol)
  - Right: User menu (profile, logout), Broker status (Connected/Disconnected)
- **Left sidebar**
  - Dashboard
  - Signals
  - Positions
  - History
  - Paper
  - Performance
  - Risk & Controls
  - Settings
- **Main content area**
  - Page title, breadcrumbs (optional)
  - Page content

---

## 1) Auth Screens

### Login
- Fields: Username, Password
- Buttons: **Login**, **Connect Broker (Fyers)**
- Links: Register, Forgot password (optional)

### Register
- Fields: Username, Email, Password
- Button: **Create Account**

### Broker Connect
- CTA: **Connect Fyers**
- Status card: Connection status, Fyers ID, last synced

---

## 2) Dashboard (default after login)

### Top summary cards (row)
- **Available Funds** (availableFunds)
- **Total Invested** (totalInvested)
- **Current Value** (currentValue)
- **Today P&L** (todaysPnl)

### Main content (two-column)
- **Left column**
  - **Equity Curve** (line chart; /performance/equity-curve)
  - **Performance snapshot**
    - Win Rate, Profit Factor, Max Drawdown, ROI
- **Right column**
  - **Signals list** (latest signals)
    - Symbol, Grade, Score, Entry, Time, Status (hasEntrySignal)
  - **Mode toggle** (paper/live) + current status

### Holdings table (full width below)
- Columns: Symbol, Qty, Avg Price, Current Price, PnL, PnL%

---

## 3) Signals

### Tabs
- **All Signals**
- **Pending**

### Table
- Columns: Symbol, Score, Grade, Entry Price, Scan Time, Has Entry Signal
- Actions: View details

---

## 4) Positions (Live)

### Tabs
- **Open Positions**
- **Closed Positions**

### Table
- Columns: Symbol, Type, Qty, Entry, Exit, PnL, Status, Exit Reason
- Row click opens **Trade Detail** drawer

### Trade Detail (drawer/panel)
- Key fields: entry/exit time, stopLoss/currentStopLoss, atr, highestPrice, breakevenMoved, realizedPnl

---

## 5) History

### Trade History
- Filters: Symbol, Date range, Status
- Table similar to Positions

---

## 6) Paper Trading

### Summary cards
- Total Trades, Win Rate, Net PnL, Profit Factor

### Tabs
- **Open Paper Positions**
- **Closed Paper Positions**

### Table
- Columns: Symbol, Qty, Entry, LTP, PnL, PnL%

---

## 7) Performance

### Metrics grid
- Total Trades, Winning/Losing, Win Rate
- Net Profit, Avg Win/Loss, Expectancy
- Max Drawdown, Longest Win/Loss Streak
- Last Trade Time/Symbol

### Charts
- Equity Curve
- P&L Trend (today/unrealized)

---

## 8) Risk & Controls

### Risk status
- Equity, Open Positions

### Correlation Matrix
- Heatmap table

### Emergency Stop
- Warning banner + **Emergency Stop** button
- Confirmation modal

---

## 9) Settings
- Profile
- API Status
- Theme (light/dark)

---

## Visual style (minimal)
- **Colors**: Neutral background, accent for primary actions, red/green for P&L
- **Typography**: Inter or system default
- **Spacing**: 16px base, 8px grid
- **Cards**: Subtle shadow, rounded corners (8px)

---

## Wireframe sketch (text-only)

```
┌───────────────────────────────────────────────────────────────────────┐
│ LOGO        [Search Symbol]                            [User ▾]        │
├───────────────┬───────────────────────────────────────────────────────┤
│ Dashboard     │  Dashboard                                             │
│ Signals       │  [Cards: Funds | Invested | Value | Today P&L]          │
│ Positions     │                                                       │
│ History       │  [Equity Curve Chart]    [Signals List + Mode Toggle]   │
│ Paper         │                                                       │
│ Performance   │  [Holdings Table]                                      │
│ Risk & Ctrl   │                                                       │
│ Settings      │                                                       │
└───────────────┴───────────────────────────────────────────────────────┘
```
