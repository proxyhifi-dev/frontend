import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from '../../../../core/services/onboarding.service';

@Component({
  selector: 'app-welcome-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './welcome-wizard.component.html',
  styleUrls: ['./welcome-wizard.component.scss']
})
export class WelcomeWizardComponent {
  step = 1;
  config = {
    mode: 'paper',
    capital: 100000,
    riskPct: 1.0,
    universe: 'nifty50'
  };

  constructor(private onboarding: OnboardingService) {}

  next() {
    if (this.step < 5) this.step++;
    else this.finish();
  }

  prev() {
    if (this.step > 1) this.step--;
  }

  finish() {
    this.onboarding.finishWizard();
  }

  selectMode(mode: string) {
    this.config.mode = mode;
  }
}
