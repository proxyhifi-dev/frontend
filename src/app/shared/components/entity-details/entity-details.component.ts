import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RuntimeConfigService } from '../../../core/config/runtime-config.service';

type EntityFieldMeta = {
  key?: string;
  name?: string;
  label?: string;
  type?: string;
  format?: string;
  hidden?: boolean;
};

@Component({
  selector: 'app-entity-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="entity-details" *ngIf="fields().length > 0">
      <div class="row" *ngFor="let f of fields()">
        <div class="label">{{ f.label || f.name || f.key }}</div>
        <div class="value">{{ formatValue(getValue(f)) }}</div>
      </div>
    </div>

    <div class="entity-details empty" *ngIf="fields().length === 0">
      <div class="muted">No details available.</div>
    </div>
  `,
  styles: [`
    .entity-details { display: grid; gap: 10px; }
    .row { display: grid; grid-template-columns: 180px 1fr; gap: 12px; align-items: center; }
    .label { font-weight: 600; opacity: 0.85; }
    .value { word-break: break-word; }
    .muted { opacity: 0.7; }
  `]
})
export class EntityDetailsComponent {
  private runtimeConfig = inject(RuntimeConfigService);

  @Input({ required: true }) entityType!: string;

  // ✅ Allow passing strongly typed objects too (SignalDetail etc.)
  @Input() data: unknown | null = null;

  // ✅ config comes from config$
  private cfg = toSignal(this.runtimeConfig.config$, { initialValue: null as any });

  readonly record = computed<Record<string, unknown> | null>(() => {
    if (!this.data || typeof this.data !== 'object') return null;
    return this.data as Record<string, unknown>;
  });

  readonly fields = computed<EntityFieldMeta[]>(() => {
    const cfg = this.cfg();
    if (!cfg) return [];

    // Support multiple possible shapes
    const meta =
      cfg?.entityFields?.[this.entityType] ??
      cfg?.entities?.[this.entityType]?.fields ??
      [];

    const fields: EntityFieldMeta[] = Array.isArray(meta) ? meta : [];
    return fields.filter(f => !f.hidden);
  });

  getValue(f: EntityFieldMeta): unknown {
    const key = f.key ?? f.name;
    if (!key) return undefined;
    return this.record()?.[key];
  }

  formatValue(v: unknown): string {
    if (v === null || v === undefined) return '-';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '-';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
}
