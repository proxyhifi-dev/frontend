import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { StoreService } from '../../core/services/store.service';
import { SidebarComponent } from '../sidebar/sidebar.component'; // Ensure this file exists
import { MobileNavComponent } from '../mobile-nav/mobile-nav.component';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, MobileNavComponent, CommandPaletteComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  unreadCount = 3;
  searchQuery = '';
  private destroy$ = new Subject<void>();

  constructor(public store: StoreService, private router: Router) {}

  ngOnInit(): void {
    this.store.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.searchQuery = state.searchSymbol ?? '';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitSearch(): void {
    const term = this.searchQuery.trim();
    this.store.setSearchSymbol(term);

    if (term) {
      this.router.navigate(['/signals']);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.store.setSearchSymbol('');
  }
}
