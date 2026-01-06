# Upgrade Guide - Apex Trading Bot Frontend

## 🚀 Upgrading to Version 1.0.0

### Prerequisites

- Node.js 18+
- npm 10+
- Angular CLI 21+

### Step-by-Step Upgrade

#### 1. Backup Current Version

```bash
# Create backup branch
git checkout -b backup-0.9.0
git push origin backup-0.9.0
```

#### 2. Pull New Changes

```bash
# Switch to master
git checkout master

# Pull PR changes (after merge)
git pull origin master

# Or checkout feature branch directly
git checkout feature/complete-ui-fixes
```

#### 3. Install Dependencies

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### 4. Update Environment Configuration

No changes needed - existing environment files are compatible.

#### 5. Test Locally

```bash
# Start dev server
npm start

# Open browser
open http://localhost:4200
```

#### 6. Verify Features

- [ ] Login works
- [ ] Dashboard loads
- [ ] Toast notifications appear
- [ ] Loading overlay shows
- [ ] WebSocket connects
- [ ] All pages accessible

### New Features Available

#### 1. Toast Notifications

```typescript
import { ToastService } from '@core/services/toast.service';

export class YourComponent {
  private toastService = inject(ToastService);

  someAction() {
    this.toastService.showSuccess('Action completed!');
    this.toastService.showError('Action failed!');
    this.toastService.showWarning('Warning message');
    this.toastService.showInfo('Information');
  }
}
```

#### 2. Loading Service

```typescript
import { LoadingService } from '@core/services/loading.service';

export class YourComponent {
  private loadingService = inject(LoadingService);

  async loadData() {
    this.loadingService.show();
    try {
      await this.fetchData();
    } finally {
      this.loadingService.hide();
    }
  }
}
```

**Note**: HTTP requests automatically show loading via interceptor.

#### 3. Enhanced WebSocket

```typescript
import { WebSocketService } from '@core/services/websocket.service';

export class YourComponent implements OnInit {
  private wsService = inject(WebSocketService);

  ngOnInit() {
    // Connection status
    effect(() => {
      const status = this.wsService.connectionStatus();
      console.log('WebSocket status:', status);
    });

    // Listen to messages
    effect(() => {
      const messages = this.wsService.messages();
      const latestMessage = messages[messages.length - 1];
      if (latestMessage) {
        this.handleMessage(latestMessage);
      }
    });
  }

  sendData() {
    this.wsService.sendMessage('/app/trade', { action: 'BUY' });
  }
}
```

### Breaking Changes

**None!** ✅

All changes are backward compatible. Existing code will continue to work.

### Optional Migrations

#### Migrate to OnPush Change Detection

```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  // ...
  changeDetection: ChangeDetectionStrategy.OnPush  // Add this
})
export class YourComponent {
  // Use signals for reactive data
  data = signal<any[]>([]);
}
```

#### Replace Manual Error Handling

**Before:**
```typescript
this.http.get('/api/data').subscribe({
  next: (data) => { /* ... */ },
  error: (error) => {
    alert('Error: ' + error.message);  // ❌ Don't do this
  }
});
```

**After:**
```typescript
this.http.get('/api/data').subscribe({
  next: (data) => { /* ... */ }
  // Error handling is automatic! ✅
});
```

#### Replace Manual Loading States

**Before:**
```typescript
loading = false;

loadData() {
  this.loading = true;  // ❌ Manual
  this.http.get('/api/data').subscribe({
    next: (data) => {
      this.data = data;
      this.loading = false;
    },
    error: () => {
      this.loading = false;
    }
  });
}
```

**After:**
```typescript
loadData() {
  // Loading is automatic via interceptor! ✅
  this.http.get('/api/data').subscribe({
    next: (data) => this.data = data
  });
}
```

### Troubleshooting

#### Issue: Toast notifications not showing

**Solution:**
Ensure `app.component.ts` includes:
```typescript
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  imports: [ToastContainerComponent],
  template: `
    <router-outlet />
    <app-toast-container />  <!-- Add this -->
  `
})
```

#### Issue: Loading overlay not showing

**Solution:**
Ensure `app.component.ts` includes:
```typescript
import { GlobalLoadingComponent } from './shared/components/global-loading/global-loading.component';

@Component({
  imports: [GlobalLoadingComponent],
  template: `
    <router-outlet />
    <app-global-loading />  <!-- Add this -->
  `
})
```

#### Issue: WebSocket not connecting

**Solution:**
1. Check backend is running
2. Verify WebSocket URL in service
3. Check browser console for errors
4. Ensure CORS is configured on backend

#### Issue: Compilation errors

**Solution:**
```bash
# Clear Angular cache
rm -rf .angular/cache

# Clean reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm start
```

### Rollback Plan

If issues occur:

```bash
# Rollback to previous version
git checkout backup-0.9.0
npm install
npm start
```

### Performance Impact

**Positive Changes:**
- ⚡ Faster error recovery (auto-retry)
- ⚡ Better perceived performance (loading indicators)
- ⚡ Reduced memory leaks (proper cleanup)
- ⚡ Optimized change detection (OnPush ready)

**No Negative Impact:**
- Bundle size increased by ~10KB (minimal)
- No performance degradation

### Testing Checklist

Before deploying:

- [ ] Run `npm test`
- [ ] Test all pages load
- [ ] Test authentication flow
- [ ] Test WebSocket connection
- [ ] Test error scenarios
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Verify production build: `npm run build`

### Deployment

Follow standard deployment procedure:

```bash
# Build production
npm run build

# Deploy using your method
# (Docker, rsync, CI/CD, etc.)
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Support

If you encounter issues:

1. Check this guide
2. Review CHANGELOG.md
3. Check GitHub issues
4. Contact development team

### Post-Upgrade

After successful upgrade:

1. Monitor error logs
2. Watch WebSocket stability
3. Gather user feedback
4. Update documentation if needed

---

**Upgrade Difficulty**: 🟢 Easy  
**Time Required**: 15-30 minutes  
**Risk Level**: 🟢 Low  
**Recommended**: ✅ Yes!
