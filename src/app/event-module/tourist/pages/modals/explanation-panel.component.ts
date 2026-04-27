import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-explanation-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="explanation-panel">
      <div class="panel-header">
        <h3>🤖 AI Explanation</h3>
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>
      <div class="panel-body">
        <p>Why is this event recommended for you?</p>
        <ul>
          <li *ngFor="let reason of data?.reasons">{{ reason }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .explanation-panel { padding: 1rem; min-width: 300px; height: 100%; background: white; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
    .panel-body { margin-top: 1rem; }
    ul { padding-left: 1.2rem; }
    li { margin: 0.5rem 0; color: #2c7da0; }
  `]
})
export class ExplanationPanelComponent {
  @Input() data: any;
  @Output() close = new EventEmitter<void>();
}