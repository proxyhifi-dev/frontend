import { test, expect } from '@playwright/test';

const mockWebSocket = `
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = MockWebSocket.OPEN;
  url;
  onopen;
  onclose;
  onmessage;
  onerror;
  constructor(url) {
    this.url = url;
    setTimeout(() => {
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }
    }, 0);
  }
  send() {}
  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ type: 'close' });
    }
  }
  addEventListener(event, handler) {
    if (event === 'open') {
      setTimeout(() => handler({ type: 'open' }), 0);
    }
  }
  removeEventListener() {}
}
window.WebSocket = MockWebSocket;
`;

test('smoke: login, websocket, dashboard, backtest', async ({ page }) => {
  await page.addInitScript(mockWebSocket);

  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

    if (url.endsWith('/auth/login')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'token', user: { name: 'Trader' } })
      });
    }

    if (url.includes('/backtest/run')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'run-1', status: 'RUNNING', strategy: 'SMA' })
      });
    }

    if (url.includes('/backtest/runs/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          run: { id: 'run-1', status: 'COMPLETED', strategy: 'SMA' },
          metrics: { netProfit: 1200, totalTrades: 10, winRate: 60, maxDrawdown: 4.2 },
          monthly: []
        })
      });
    }

    if (url.includes('/backtest/runs')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'run-1', status: 'COMPLETED', strategy: 'SMA' }])
      });
    }

    if (url.includes('/settings')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ mode: 'PAPER', maxPositions: 3, riskLimits: { maxRiskPerTradePercent: 1, maxDailyLossPercent: 5 } })
      });
    }

    if (url.includes('/risk/circuit-breaker')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ triggered: false, dailyLossUsed: 0, dailyLossLimit: 5000 })
      });
    }

    if (url.includes('/performance')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    }

    if (url.includes('/strategy/signals')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    }

    if (url.includes('/paper/positions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    }

    if (url.includes('/account/summary')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ availablePaperFunds: 100000, currentValue: 100000, totalInvested: 100000, todaysPnl: 0 })
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({})
    });
  });

  await page.goto('/login');
  await page.fill('#login-email', 'trader@example.com');
  await page.fill('#login-password', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await expect(page.getByText('Dashboard')).toBeVisible();

  await page.goto('/backtesting');
  await expect(page.getByRole('heading', { name: 'Backtesting' })).toBeVisible();
  await page.getByRole('button', { name: /run backtest/i }).click();
  await expect(page.getByText('Run History')).toBeVisible();
});
