import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isCompleted: boolean;
  actionUrl?: string;
  locked?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private isNewUser = new BehaviorSubject<boolean>(true);
  isNewUser$ = this.isNewUser.asObservable();

  private checklist = new BehaviorSubject<ChecklistItem[]>([
    { id: '1', label: 'Complete Onboarding', description: 'Finish the welcome wizard.', isCompleted: false },
    { id: '2', label: 'Wait for First Scan', description: 'Bot is scanning your watchlist...', isCompleted: false },
    { id: '3', label: 'Approve First Signal', description: 'Review and execute a trade.', isCompleted: false, actionUrl: '/signals' },
    { id: '4', label: 'Close First Trade', description: 'Reach target or stop loss.', isCompleted: false, actionUrl: '/positions', locked: true },
    { id: '5', label: 'Review Analytics', description: 'Check performance after 10 trades.', isCompleted: false, actionUrl: '/analytics', locked: true }
  ]);
  checklist$ = this.checklist.asObservable();

  completeTask(id: string) {
    const current = this.checklist.value;
    const task = current.find(t => t.id === id);
    if (task && !task.locked) {
      task.isCompleted = true;
      // Unlock next task if applicable
      const nextTask = current.find(t => t.id === (parseInt(id) + 1).toString());
      if (nextTask) nextTask.locked = false;

      this.checklist.next([...current]);
    }
  }

  finishWizard() {
    this.isNewUser.next(false);
    this.completeTask('1');
  }

  skipTutorial() {
    this.isNewUser.next(false);
  }
}
