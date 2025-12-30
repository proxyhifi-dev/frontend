import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommandService, Command } from '../../../core/services/command.service';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss']
})
export class CommandPaletteComponent {
  searchQuery = '';
  filteredCommands: Command[] = [];
  selectedIndex = 0;

  constructor(public commandSvc: CommandService) {
    this.filteredCommands = this.commandSvc.commands;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      this.commandSvc.toggle();
      setTimeout(() => document.getElementById('cmd-input')?.focus(), 100);
    }

    if (!this.commandSvc.isOpen$) return;

    if (event.key === 'ArrowDown') {
      this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
    } else if (event.key === 'ArrowUp') {
      this.selectedIndex = (this.selectedIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length;
    } else if (event.key === 'Enter') {
      this.execute(this.filteredCommands[this.selectedIndex]);
    } else if (event.key === 'Escape') {
      this.commandSvc.close();
    }
  }

  filter() {
    this.filteredCommands = this.commandSvc.commands.filter(c =>
      c.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    this.selectedIndex = 0;
  }

  execute(cmd: Command) {
    cmd.action();
    this.commandSvc.close();
    this.searchQuery = '';
  }
}
