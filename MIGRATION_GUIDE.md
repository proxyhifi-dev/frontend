# Migration Guide - Signal-Based Services

## 🔄 API Changes

The new services use Angular signals instead of Observables for better performance and simpler state management.

### LoadingService Changes

#### ❌ Old API (Observable)
```typescript
// OLD - Don't use
loading$: Observable<boolean>;

constructor(private loadingService: LoadingService) {
  this.loading$ = this.loadingService.loading$;
}
```

#### ✅ New API (Signal)
```typescript
// NEW - Use this
import { inject } from '@angular/core';
import { LoadingService } from '@core/services/loading.service';

private loadingService = inject(LoadingService);

// Option 1: Use signal directly in template
get isLoading() {
  return this.loadingService.isLoading();
}

// Option 2: Assign signal (not the value)
isLoading = this.loadingService.isLoading;

// In template:
@if (isLoading()) {
  <p>Loading...</p>
}
```

### WebSocketService Changes

#### ❌ Old API
```typescript
// OLD - These methods don't exist
this.wsService.connect().subscribe(...);
this.wsService.subscribe('/topic/logs').subscribe(...);
```

#### ✅ New API (Signal + Effect)
```typescript
import { effect } from '@angular/core';
import { WebSocketService } from '@core/services/websocket.service';

private wsService = inject(WebSocketService);

constructor() {
  // WebSocket auto-connects on service initialization
  
  // Listen to messages using effect
  effect(() => {
    const messages = this.wsService.messages();
    const latestMessage = messages[messages.length - 1];
    if (latestMessage) {
      this.handleMessage(latestMessage);
    }
  });

  // Monitor connection status
  effect(() => {
    const status = this.wsService.connectionStatus();
    console.log('Connection status:', status);
  });
}

private handleMessage(message: WebSocketMessage) {
  switch (message.type) {
    case 'logs':
      console.log('Log message:', message.data);
      break;
    case 'market-data':
      this.updateMarketData(message.data);
      break;
  }
}
```

### ToastService (New)

```typescript
import { ToastService } from '@core/services/toast.service';

private toastService = inject(ToastService);

showNotifications() {
  this.toastService.showSuccess('Operation successful!');
  this.toastService.showError('Operation failed!');
  this.toastService.showWarning('Please be careful');
  this.toastService.showInfo('FYI: Something happened');
}
```

## 📝 Common Patterns

### Pattern 1: HTTP Request with Toast

```typescript
loadData() {
  this.http.get('/api/data').subscribe({
    next: (data) => {
      this.data = data;
      this.toastService.showSuccess('Data loaded successfully!');
    }
    // Error handling is automatic via interceptor!
  });
}
```

### Pattern 2: Manual Loading Control

```typescript
async manualOperation() {
  this.loadingService.show();
  try {
    await this.someAsyncOperation();
    this.toastService.showSuccess('Done!');
  } catch (error) {
    this.toastService.showError('Failed!');
  } finally {
    this.loadingService.hide();
  }
}
```

### Pattern 3: Skip Loading for Specific Request

```typescript
import { HttpHeaders } from '@angular/common/http';

// This request won't show the loading overlay
this.http.get('/api/quick-data', {
  headers: new HttpHeaders({ 'X-Skip-Loading': 'true' })
}).subscribe(...);
```

### Pattern 4: WebSocket Message Filtering

```typescript
constructor() {
  effect(() => {
    const messages = this.wsService.messages();
    
    // Filter by type
    const logsMessages = messages.filter(m => m.type === 'logs');
    
    // Process only new messages
    logsMessages.forEach(msg => {
      if (!this.processedIds.has(msg.timestamp)) {
        this.processedIds.add(msg.timestamp);
        this.handleNewLog(msg.data);
      }
    });
  });
}
```

## 🔧 Quick Fixes

### Fix: Property 'loading$' does not exist

```typescript
// Before
this.loading$ = this.loadingService.loading$;

// After
get isLoading() {
  return this.loadingService.isLoading();
}
// Or
isLoading = this.loadingService.isLoading;
```

### Fix: Property 'connect' does not exist

```typescript
// Before
this.wsService.connect().subscribe(...);

// After - WebSocket auto-connects, just use signals
constructor() {
  effect(() => {
    const status = this.wsService.connectionStatus();
    if (status === 'connected') {
      // Connected!
    }
  });
}
```

### Fix: Property 'subscribe' does not exist (WebSocket)

```typescript
// Before
this.ws.subscribe('/topic/logs').subscribe(...);

// After - Use effect to listen to messages
constructor() {
  effect(() => {
    const messages = this.wsService.messages();
    const logsMessages = messages.filter(m => m.type === 'logs');
    logsMessages.forEach(msg => this.handleLog(msg));
  });
}
```

## 💡 Benefits of Signals

1. **Simpler Code**: No need for async pipe or manual subscriptions
2. **Better Performance**: Fine-grained reactivity
3. **Type Safety**: Full TypeScript support
4. **Automatic Cleanup**: No need to unsubscribe
5. **Easy Testing**: Simple to mock and test

## 🧪 Testing

### Testing Components with Signals

```typescript
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

describe('MyComponent', () => {
  let loadingService: jasmine.SpyObj<LoadingService>;

  beforeEach(() => {
    const loadingSpy = jasmine.createSpyObj('LoadingService', ['show', 'hide']);
    loadingSpy.isLoading = signal(false); // Mock signal

    TestBed.configureTestingModule({
      providers: [
        { provide: LoadingService, useValue: loadingSpy }
      ]
    });
  });

  it('should show loading', () => {
    loadingService.isLoading.set(true);
    // Test component behavior
  });
});
```

## 📚 Additional Resources

- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [Effect Documentation](https://angular.dev/guide/signals#effects)
- [Migration from Observables](https://angular.dev/guide/signals#interop-with-observables)

## ✅ Checklist

After migration, ensure:

- [ ] No `loading$` references (use `isLoading()` or `isLoading`)
- [ ] No `wsService.connect()` calls (auto-connects)
- [ ] No `wsService.subscribe()` calls (use `effect` + `messages()`)
- [ ] All components use `inject()` instead of constructor DI
- [ ] Signals used correctly in templates with `()`
- [ ] No manual subscriptions to signals (they're not Observables)

---

**Happy coding with signals! 🚀**
