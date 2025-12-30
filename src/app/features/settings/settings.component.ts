import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  activeTab = 'trading';

  // Settings Config Model
  config = {
    mode: 'paper',
    risk: { perTrade: 1.0, dailyLimit: 5, weeklyLimit: 10 },
    trading: { maxPositions: 3, sectorLimit: 2, correlation: 0.7 },
    api: { appId: '', secret: '' }
  };

  save() {
    alert('Settings Saved! Restart bot to apply.');
  }
}
