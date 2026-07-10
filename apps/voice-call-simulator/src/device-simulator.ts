import { SessionContext, ApiClient } from './api';
import { Device, Call } from '@twilio/voice-sdk';

export class DeviceSimulator {
  private element: HTMLElement;
  private session: SessionContext | null = null;
  private device: any = null;
  private activeCall: any = null;
  private incomingInvite: any = null;
  private callId: string | null = null;
  
  private logContainer: HTMLElement;
  private statusVal: HTMLElement;
  private timerVal: HTMLElement;
  private statusLabel: HTMLElement;
  private avatarContainer: HTMLElement;
  private optionsContainer: HTMLElement;
  private toggleMicBtn: HTMLElement;
  private toggleSpeakerBtn: HTMLElement;

  private isMicMuted = false;
  private isSpeakerMuted = false;
  private remoteAudioElement: HTMLAudioElement | null = null;

  private onCallConnectedCallback?: (callId: string) => void;
  private onCallEndedCallback?: () => void;

  constructor(elementId: string) {
    const el = document.getElementById(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    this.element = el;

    this.logContainer = this.element.querySelector('.console-output')!;
    this.statusVal = this.element.querySelector('.val-sdkStatus')!;
    this.timerVal = this.element.querySelector('.call-timer')!;
    this.statusLabel = this.element.querySelector('.call-status-label')!;
    this.avatarContainer = this.element.querySelector('.caller-avatar-container')!;
    this.optionsContainer = this.element.querySelector('#call-options-container')!;
    this.toggleMicBtn = this.element.querySelector('#btn-toggle-mic')!;
    this.toggleSpeakerBtn = this.element.querySelector('#btn-toggle-speaker')!;

    // Bind mute actions
    this.toggleMicBtn.addEventListener('click', () => {
      const muted = this.toggleMic();
      if (muted) {
        this.toggleMicBtn.classList.add('active');
        this.toggleMicBtn.querySelector('.icon')!.textContent = '🔇';
      } else {
        this.toggleMicBtn.classList.remove('active');
        this.toggleMicBtn.querySelector('.icon')!.textContent = '🎙️';
      }
    });

    this.toggleSpeakerBtn.addEventListener('click', () => {
      const muted = this.toggleSpeaker();
      if (muted) {
        this.toggleSpeakerBtn.classList.add('active');
        this.toggleSpeakerBtn.querySelector('.icon')!.textContent = '🔇';
      } else {
        this.toggleSpeakerBtn.classList.remove('active');
        this.toggleSpeakerBtn.querySelector('.icon')!.textContent = '🔊';
      }
    });

    // Set up clear console button
    const btnClear = this.element.querySelector('.btn-clear-console');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.logContainer.innerHTML = '';
      });
    }
  }

  log(message: string, isError = false) {
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'console-line';
    line.style.color = isError ? '#ef4444' : '#34d399';
    line.textContent = `[${time}] ${message}`;
    this.logContainer.appendChild(line);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
    console.log(`[${this.element.id}] ${message}`);
  }

  updateSdkStatusClass(state: 'online' | 'offline' | 'error') {
    this.statusVal.classList.remove('sdk-online', 'sdk-offline', 'sdk-error');
    if (state === 'online') {
      this.statusVal.textContent = 'Registered';
      this.statusVal.classList.add('sdk-online');
    } else if (state === 'offline') {
      this.statusVal.textContent = 'Offline';
      this.statusVal.classList.add('sdk-offline');
    } else {
      this.statusVal.textContent = 'Error';
      this.statusVal.classList.add('sdk-error');
    }
  }

  /**
   * Registers this device with Twilio's cloud signaling servers.
   */
  async register(session: SessionContext) {
    this.session = session;
    const userIdEl = this.element.querySelector('.val-userId')!;
    userIdEl.textContent = session.userId;
    userIdEl.classList.remove('value-placeholder');
    
    this.log(`Requesting Twilio token for user...`);

    try {
      const response = await ApiClient.getTwilioToken(session);
      const token = response.data.token;
      
      this.log(`Token fetched successfully (length: ${token ? token.length : 0}).`);
      
      // Decode JWT token for debugging
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          this.log(`Token identity: ${payload.grants?.identity || 'none'}`);
          this.log(`Token API Key SID (iss): ${payload.iss}`);
          this.log(`Token Account SID (sub): ${payload.sub}`);
        } else {
          this.log(`Warning: Token is not in standard 3-part JWT format.`, true);
        }
      } catch (e: any) {
        this.log(`Error parsing token headers: ${e.message}`, true);
      }

      this.log(`Launching Twilio SDK...`);
      console.log('Fetched Twilio Token:', token);

      // Initialize the Device instance from npm package
      this.device = new Device(token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
      });

      this.registerDeviceEvents();
      await this.device.register();
    } catch (err: any) {
      const errMsg = err?.message || (typeof err === 'string' ? err : '') || 'Unknown SDK Error';
      this.log(`Failed during SDK initialization: ${errMsg}`, true);
      this.updateSdkStatusClass('error');
      throw err;
    }
  }

  private registerDeviceEvents() {
    this.device.on('registered', () => {
      this.log(`Twilio Device successfully registered & ready!`);
      this.updateSdkStatusClass('online');
    });

    this.device.on('unregistered', () => {
      this.log(`Twilio Device offline.`);
      this.updateSdkStatusClass('offline');
    });

    this.device.on('error', (error: any) => {
      this.log(`Twilio Device SDK Error: ${error.message}`, true);
    });

    // 📞 Handle Incoming Call invites from Twilio
    this.device.on('incoming', (invite: any) => {
      this.incomingInvite = invite;
      // Read callId custom parameter sent in TwiML <Parameter name="callId">
      const customParams = invite.customParameters;
      this.callId = customParams.get('callId') || null;

      this.log(`Incoming call invite received! (Call ID: ${this.callId})`);
      this.statusLabel.textContent = 'Ringing (Incoming...)';
      this.timerVal.textContent = '00:00';
      this.timerVal.classList.remove('active');

      // Trigger ringing pulsing animation
      this.avatarContainer.classList.add('is-ringing');

      // Transition buttons to allow Answer / Decline
      this.showButtons(['answer', 'decline']);
      this.hideButtons(['call', 'hangup']);

      invite.on('rejected', () => {
        this.log(`Call rejected.`);
        this.resetCallUi();
      });

      invite.on('canceled', () => {
        this.log(`Incoming call cancelled by caller.`);
        this.resetCallUi();
      });
    });
  }

  async startCall(rideId: string, clientRequestId: string, onConnected: (callId: string) => void, onEnded: () => void) {
    if (!this.session || !this.device) return;
    this.onCallConnectedCallback = onConnected;
    this.onCallEndedCallback = onEnded;

    this.log(`Creating call record on Backend...`);
    this.statusLabel.textContent = 'Calling...';
    
    // Add calling pulse effect
    this.avatarContainer.classList.add('is-ringing');

    try {
      const callInit = await ApiClient.initiateCall(this.session, rideId, clientRequestId);
      this.callId = callInit.data.callId;
      this.log(`Call registered. Backend Call ID: ${this.callId}`);
      
      this.log(`Connecting Twilio outbound connection...`);
      // Twilio outbound invite includes callId parameter for backend webhook mapping
      const call = await this.device.connect({
        params: { callId: this.callId }
      });

      this.activeCall = call;
      this.showButtons(['hangup']);
      this.hideButtons(['call', 'answer', 'decline']);

      this.bindCallEvents(call);
    } catch (err: any) {
      this.log(`Call initiation failed: ${err.message}`, true);
      this.resetCallUi();
    }
  }

  private bindCallEvents(call: any) {
    call.on('accept', () => {
      this.log(`Outbound call accepted. Connected!`);
      this.statusLabel.textContent = 'Connected';
      this.timerVal.classList.add('active');
      
      // Stop ringing pulse
      this.avatarContainer.classList.remove('is-ringing');

      // Show call options panel when connected
      this.optionsContainer.classList.remove('hide');
      
      if (this.callId && this.onCallConnectedCallback) {
        this.onCallConnectedCallback(this.callId);
      }
    });

    call.on('audio', (audioEl: HTMLAudioElement) => {
      this.log(`Audio track received.`);
      this.remoteAudioElement = audioEl;
      if (this.remoteAudioElement) {
        this.remoteAudioElement.muted = this.isSpeakerMuted;
      }
    });

    call.on('disconnect', () => {
      this.log(`Call disconnected.`);
      this.resetCallUi();
      if (this.onCallEndedCallback) this.onCallEndedCallback();
    });

    call.on('reject', () => {
      this.log(`Call rejected.`);
      this.resetCallUi();
      if (this.onCallEndedCallback) this.onCallEndedCallback();
    });

    call.on('error', (err: any) => {
      this.log(`SDK Connection Error: ${err.message}`, true);
    });
  }

  acceptIncoming(onConnected: () => void, onEnded: () => void) {
    if (!this.incomingInvite) return;
    this.onCallConnectedCallback = onConnected;
    this.onCallEndedCallback = onEnded;
    this.log(`Accepting incoming call...`);
    
    const call = this.incomingInvite.accept();
    this.activeCall = call;
    
    this.statusLabel.textContent = 'Connecting...';
    
    // Stop ringing pulse
    this.avatarContainer.classList.remove('is-ringing');

    this.showButtons(['hangup']);
    this.hideButtons(['call', 'answer', 'decline']);

    this.bindCallEvents(call);
    this.incomingInvite = null;
  }

  declineIncoming() {
    if (!this.incomingInvite) return;
    this.log(`Declining incoming call...`);
    this.incomingInvite.reject();
    this.incomingInvite = null;
    this.resetCallUi();
  }

  async hangup() {
    this.log(`Hanging up local connection...`);
    
    // 1. Terminate the Twilio call connection locally
    if (this.activeCall) {
      this.activeCall.disconnect();
      this.activeCall = null;
    }

    // 2. Notify the backend that the call has ended
    if (this.session && this.callId) {
      try {
        await ApiClient.endCall(this.session, this.callId);
        this.log(`Backend notified of end call.`);
      } catch (err: any) {
        this.log(`Failed to notify backend: ${err.message}`, true);
      }
    }

    this.resetCallUi();
    if (this.onCallEndedCallback) this.onCallEndedCallback();
  }

  resetCallUi() {
    this.statusLabel.textContent = 'Ready to connect';
    this.timerVal.textContent = '00:00';
    this.timerVal.classList.remove('active');
    this.avatarContainer.classList.remove('is-ringing');
    this.activeCall = null;
    this.incomingInvite = null;

    // Reset mute options
    this.isMicMuted = false;
    this.isSpeakerMuted = false;
    this.remoteAudioElement = null;
    this.optionsContainer.classList.add('hide');

    this.toggleMicBtn.classList.remove('active');
    this.toggleMicBtn.querySelector('.icon')!.textContent = '🎙️';
    this.toggleSpeakerBtn.classList.remove('active');
    this.toggleSpeakerBtn.querySelector('.icon')!.textContent = '🔊';

    this.showButtons(['call']);
    this.hideButtons(['answer', 'decline', 'hangup']);
  }

  toggleMic(): boolean {
    if (!this.activeCall) return false;
    this.isMicMuted = !this.isMicMuted;
    this.activeCall.mute(this.isMicMuted);
    this.log(this.isMicMuted ? `Microphone muted.` : `Microphone unmuted.`);
    return this.isMicMuted;
  }

  toggleSpeaker(): boolean {
    this.isSpeakerMuted = !this.isSpeakerMuted;
    if (this.remoteAudioElement) {
      this.remoteAudioElement.muted = this.isSpeakerMuted;
    }
    this.log(this.isSpeakerMuted ? `Speaker muted (Tắt âm).` : `Speaker unmuted (Bật âm).`);
    return this.isSpeakerMuted;
  }

  private showButtons(keys: ('call' | 'answer' | 'decline' | 'hangup')[]) {
    keys.forEach(k => this.element.querySelector(`.btn-${k}`)?.classList.remove('hide'));
  }

  private hideButtons(keys: ('call' | 'answer' | 'decline' | 'hangup')[]) {
    keys.forEach(k => this.element.querySelector(`.btn-${k}`)?.classList.add('hide'));
  }
}
