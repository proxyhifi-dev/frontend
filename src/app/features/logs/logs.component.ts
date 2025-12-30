import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Required for [(ngModel)]
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ Added
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {
  logs: any[] = [];

  // ✅ Properties expected by template
  liveTail = true;
  filterLevel = 'All';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('/api/logs/latest').subscribe(data => this.logs = data);
  }

  getLevelClass(level: string) {
    const classes: any = { 'INFO': 'text-blue', 'WARN': 'text-yellow', 'ERROR': 'text-red' };
    return classes[level] || '';
  }
}
