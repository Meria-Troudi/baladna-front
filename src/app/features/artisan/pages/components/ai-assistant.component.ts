import {
  Component, OnInit, OnDestroy,
  Output, EventEmitter, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Dépendances locales
import { AiAssistantService } from '../../../../features/marketplace/ai-assistant/services/ai-assistant.service';

export interface AiResponse {
  success: boolean;
  transcribedText: string;
  message: string;
  rawAiReply: string;
  action: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  time: Date;
  isVoice?: boolean;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button class="ai-fab" (click)="togglePanel()" [class.active]="isOpen" title="Baladna AI Assistant">
      <svg *ngIf="!isOpen" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M12 2a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9a9 9 0 0 1-9-9 9 9 0 0 1 9-9z"/>
        <path d="M8 10h8M8 14h5"/>
      </svg>
      <svg *ngIf="isOpen" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>

    <div class="ai-window" *ngIf="isOpen">
      <div class="ai-header">
        <div class="ai-avatar">🤖</div>
        <div class="ai-title">
          <span class="ai-name">Baladna AI</span>
          <span class="ai-status" [class.busy]="isProcessing">
            {{ isProcessing ? 'Thinking...' : '● Online' }}
          </span>
        </div>
        <button class="clear-btn" (click)="clearChat()" title="Clear">🗑️</button>
      </div>

      <div class="ai-messages" #msgBox>
        <div class="msg ai" *ngIf="messages.length === 0">
          <div class="bubble">
            👋 Hello! I'm your Baladna AI assistant.<br><br>
            Talk or type your request:<br>
            • "Add blue pottery at 45 TND"<br>
            • "Delete product number 3"<br>
            • "Show my orders"<br>
            • "Stats this month"
          </div>
        </div>

        <div *ngFor="let m of messages" class="msg" [class.user]="m.role==='user'" [class.ai]="m.role==='ai'">
          <div class="bubble">
            <span *ngIf="m.isVoice" class="vbadge">🎙️ </span>{{ m.text }}
          </div>
          <div class="mtime">{{ m.time | date:'HH:mm' }}</div>
        </div>

        <div class="msg ai" *ngIf="isProcessing">
          <div class="bubble dots"><span></span><span></span><span></span></div>
        </div>
      </div>

      <div class="ai-footer">
        <div class="live-preview" *ngIf="liveText">🎙️ {{ liveText }}</div>
        <div class="input-row">
          <input class="ai-input" type="text" [(ngModel)]="textInput"
                 placeholder="Type your request..." (keyup.enter)="sendText()"
                 [disabled]="isProcessing || isRecording" />
          <button class="btn-send" (click)="sendText()" [disabled]="!textInput.trim() || isProcessing">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
            </svg>
          </button>
          <button class="btn-mic" [class.rec]="isRecording" (click)="toggleRecording()" [disabled]="isProcessing">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="9" y="2" width="6" height="12" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8"/>
            </svg>
          </button>
        </div>
        <div class="hints">Examples: "Add X at Y TND" · "My orders" · "Stats"</div>
      </div>
    </div>
  `,
  styles: [`
    :host { position: fixed; bottom: 28px; right: 28px; z-index: 1000; }
    .ai-fab {
      width: 58px; height: 58px; border-radius: 50%;
      background: linear-gradient(135deg, #6C63FF, #3EC6E0);
      border: none; color: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(108,99,255,.4);
      transition: transform .2s;
    }
    .ai-fab:hover { transform: scale(1.08); }
    .ai-fab.active { background: linear-gradient(135deg, #FF416C, #FF4B2B); }
    .ai-window {
      position: absolute; bottom: 70px; right: 0;
      width: 370px; height: 550px;
      background: #fff; border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      animation: slideUp .25s ease;
    }
    @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    .ai-header {
      display:flex; align-items:center; gap:10px;
      padding: 14px 16px;
      background: linear-gradient(135deg, #6C63FF, #3EC6E0);
      color: #fff;
    }
    .ai-avatar { font-size: 26px; }
    .ai-title { flex:1; }
    .ai-name { display:block; font-weight:600; font-size:15px; }
    .ai-status { font-size:11px; opacity:.85; }
    .ai-status.busy { color:#FFE082; }
    .clear-btn { background:none; border:none; color:#fff; font-size:16px; cursor:pointer; opacity:.7; }
    .clear-btn:hover { opacity:1; }
    .ai-messages {
      flex:1; overflow-y:auto; padding:14px;
      display:flex; flex-direction:column; gap:10px;
      background:#F7F8FC;
    }
    .msg { display:flex; flex-direction:column; max-width:86%; }
    .msg.user { align-self:flex-end; align-items:flex-end; }
    .msg.ai { align-self:flex-start; }
    .bubble {
      padding:10px 14px; border-radius:16px;
      font-size:13.5px; line-height:1.55; white-space:pre-wrap;
    }
    .msg.user .bubble {
      background: linear-gradient(135deg, #6C63FF, #3EC6E0);
      color:#fff; border-bottom-right-radius:4px;
    }
    .msg.ai .bubble {
      background:#fff; color:#222;
      border:1px solid #E8E8F0; border-bottom-left-radius:4px;
    }
    .mtime { font-size:10px; color:#aaa; margin-top:3px; }
    .vbadge { opacity:.65; }
    .dots { display:flex; gap:5px; align-items:center; padding:12px 14px !important; }
    .dots span {
      width:8px; height:8px; border-radius:50%;
      background:#6C63FF; animation:bounce 1.1s infinite;
    }
    .dots span:nth-child(2){animation-delay:.18s}
    .dots span:nth-child(3){animation-delay:.36s}
    @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}}
    .ai-footer { padding:12px 14px; border-top:1px solid #EEE; background:#fff; }
    .live-preview {
      font-size:12px; color:#6C63FF; margin-bottom:6px;
      padding:4px 10px; background:#F0EFFF; border-radius:8px;
      animation:pulse 1.4s infinite;
    }
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
    .input-row { display:flex; gap:8px; align-items:center; }
    .ai-input {
      flex:1; border:1.5px solid #E0E0F0; border-radius:24px;
      padding:9px 16px; font-size:14px; outline:none;
      transition:border-color .2s;
    }
    .ai-input:focus { border-color:#6C63FF; }
    .btn-send, .btn-mic {
      width:38px; height:38px; border-radius:50%; border:none;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; transition:all .2s; flex-shrink:0;
    }
    .btn-send { background:linear-gradient(135deg,#6C63FF,#3EC6E0); color:#fff; }
    .btn-send:disabled { opacity:.35; cursor:not-allowed; }
    .btn-mic { background:#F0EFFF; color:#6C63FF; }
    .btn-mic.rec { background:linear-gradient(135deg,#FF416C,#FF4B2B); color:#fff; animation:pulse 1s infinite; }
    .btn-mic:disabled { opacity:.35; cursor:not-allowed; }
    .hints { font-size:10px; color:#BBB; margin-top:6px; text-align:center; }
    @media(max-width:480px){ .ai-window{ width:calc(100vw - 16px); right:-14px; } }
  `]
})
export class AiAssistantComponent implements OnInit, OnDestroy {

  @Output() dataChanged = new EventEmitter<string>();
  @ViewChild('msgBox') msgBox!: ElementRef;

  isOpen       = false;
  isRecording  = false;
  isProcessing = false;
  textInput    = '';
  liveText     = '';
  messages: ChatMessage[] = [];

  artisanId   = 27;
  artisanName = 'Artisan';

  constructor(private ai: AiAssistantService) {}

  ngOnInit() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.artisanId = user.id || 27;
        this.artisanName = user.firstName || 'Artisan';
      } catch(e) {}
    }
  }

  togglePanel() { this.isOpen = !this.isOpen; }
  clearChat()   { this.messages = []; }

  // ========== TEXT ==========
  sendText() {
    const t = this.textInput.trim();
    if (!t) return;
    this.push('user', t, false);
    this.textInput = '';
    this.isProcessing = true;
    this.ai.sendText(t, this.artisanId, this.artisanName).subscribe({
      next:  (r: AiResponse) => this.handleResp(r, false),
      error: () => { this.pushErr(); this.isProcessing = false; }
    });
  }

  // ========== VOICE (Web Speech API) ==========
toggleRecording() {
  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    this.push('ai', '❌ Use Chrome or Edge for voice.', false);
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  this.isRecording = true;
  this.liveText = '🎤 Speak now...';

  recognition.onresult = (event: any) => {
    const said = event.results[0][0].transcript;
    console.log('🎤 YOU SAID:', said);
    this.liveText = '';
    this.isRecording = false;
    this.textInput = said;
    this.sendText();
  };

  recognition.onerror = (e: any) => {
    console.error('🎤 ERR:', e.error);
    this.liveText = '';
    this.isRecording = false;
  };

  recognition.onend = () => {
    this.isRecording = false;
  };

  recognition.start();
}

  // ========== RESPONSE ==========
  private handleResp(r: AiResponse, isVoice: boolean) {
    this.isProcessing = false;
    const msg = r.message || "I didn't understand.";
    this.push('ai', msg, false);
    if (isVoice) this.ai.speak(msg);
    if (r.action && ['ADD_PRODUCT','DELETE_PRODUCT','UPDATE_PRICE'].includes(r.action)) {
      this.dataChanged.emit(r.action);
    }
    this.scrollDown();
  }

  private push(role: 'user'|'ai', text: string, isVoice: boolean) {
    this.messages.push({ role, text, time: new Date(), isVoice });
    setTimeout(() => this.scrollDown(), 40);
  }

  private pushErr() { this.push('ai', '❌ Connection error.', false); }

  private scrollDown() {
    try { const el = this.msgBox?.nativeElement; if (el) el.scrollTop = el.scrollHeight; } catch {}
  }

  ngOnDestroy() { this.ai.stopSpeaking(); }
}