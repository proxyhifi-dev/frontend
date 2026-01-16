import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RuntimeConfigService, UiEntityField } from '../../../core/config/runtime-config.service';

@Component({
  selector: 'app-entity-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="entity-details" *ngIf="fields.length; else empty">
      <div class="drawer-row" *ngFor="let field of fields">
        <span>{{ field.label || field.name }}</span>
        <span>{{ formatValue(data?.[field.name]) }}</span>
      </div>
    </div>
    <ng-template #empty>
      <div class="drawer-empty">No details configured.</div>
    </ng-template>
  `
})
export class EntityDetailsComponent {
  @Input() entityType = '';
  @Input() data: Record<string, unknown> | null = null;

  constructor(private runtimeConfig: RuntimeConfigService) {}

  get fields(): UiEntityField[] {
    return this.entityType ? this.runtimeConfig.getEntityFields(this.entityType) : [];
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
