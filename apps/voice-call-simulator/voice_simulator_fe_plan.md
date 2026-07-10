# Handoff Plan: Twilio Voice Call Simulator Frontend

This document is a complete, production-grade specification and blueprint for another AI Agent (or developer) to build the **Twilio Voice Call Simulator Frontend** workspace. 

It is designed to connect to the active backend hosted at:
`https://guidance-manager-detection.ngrok-free.dev`

---

## 🚀 Architectural Stack
- **Framework:** Vite + TypeScript + Vanilla CSS (Do not use TailwindCSS).
- **Twilio SDK:** Loaded via CDN in `index.html` (`https://sdk.twilio.com/js/voice/v2.10.1/twilio.min.js`).
- **Port:** `3005` (runs on `http://localhost:3005` or public ngrok URL).
- **Proxy:** Vite dev-server proxy configured to route `/api/*` requests to the active backend URL.

---

## 📂 Directory Structure to Create
Create this structure in the frontend repository or workspace:
```text
apps/voice-call-simulator/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── README.md
└── src/
    ├── style.css
    ├── api.ts
    ├── device-simulator.ts
    └── main.ts
```

---

## ⚙️ Project Configuration Files

### 1. `package.json`
Defines the package dependencies, using Vite and TypeScript.
```json
{
  "name": "@ridearc/voice-call-simulator",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 2. `tsconfig.json`
Configures compiler settings for modern browser environments.
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["src"]
}
```

### 3. `vite.config.ts`
> **Important:** This config redirects `/api` to the active Backend. It uses your specific ngrok URL to bridge the frontend and backend.
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3005,
    proxy: {
      '/api': {
        target: 'https://guidance-manager-detection.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

---

## 🖥️ Frontend Implementation Blueprints

### 4. `index.html`
Loads Twilio Voice JS SDK v2.10.1 from the CDN. It displays two simulated devices side-by-side: Left for Rider (Passenger), Right for Driver.
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Twilio Voice Call Simulator</title>
    <link rel="stylesheet" href="/src/style.css" />
    <!-- Twilio Voice JS SDK -->
    <script src="https://sdk.twilio.com/js/voice/v2.10.1/twilio.min.js"></script>
  </head>
  <body>
    <div id="app">
      <header class="app-header">
        <h1>Twilio App-to-App Call Simulator</h1>
        <div class="global-controls">
          <button id="btn-init-sessions" class="btn primary">Initialize Simulator Sessions</button>
          <div class="ride-info">
            <label>Active Ride ID: <span id="span-ride-id">None</span></label>
          </div>
        </div>
      </header>

      <main class="simulator-grid">
        <!-- RIDER DEVICE -->
        <section class="device-column" id="rider-device">
          <div class="device-frame">
            <div class="device-screen">
              <div class="status-bar">RIDER DEVICE</div>
              <div class="content">
                <div class="session-info">
                  <div>ID: <span class="val-userId">-</span></div>
                  <div>SDK: <span class="val-sdkStatus">Offline</span></div>
                </div>

                <!-- Call UI Mockup -->
                <div class="call-interface">
                  <div class="caller-avatar">👤</div>
                  <div class="caller-name">Driver (Callee)</div>
                  <div class="call-status-label">Idle</div>
                  <div class="call-timer">00:00</div>

                  <div class="call-controls">
                    <button class="btn btn-call btn-success">Call Driver</button>
                    <button class="btn btn-answer btn-success hide">Answer</button>
                    <button class="btn btn-decline btn-danger hide">Decline</button>
                    <button class="btn btn-hangup btn-danger hide">Hang Up</button>
                  </div>
                </div>

                <!-- Console logs for Twilio SDK Events -->
                <div class="virtual-console">
                  <div class="console-title">Twilio SDK Log</div>
                  <div class="console-output"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- DRIVER DEVICE -->
        <section class="device-column" id="driver-device">
          <div class="device-frame">
            <div class="device-screen">
              <div class="status-bar">DRIVER DEVICE</div>
              <div class="content">
                <div class="session-info">
                  <div>ID: <span class="val-userId">-</span></div>
                  <div>SDK: <span class="val-sdkStatus">Offline</span></div>
                </div>

                <!-- Call UI Mockup -->
                <div class="call-interface">
                  <div class="caller-avatar">👤</div>
                  <div class="caller-name">Rider (Callee)</div>
                  <div class="call-status-label">Idle</div>
                  <div class="call-timer">00:00</div>

                  <div class="call-controls">
                    <button class="btn btn-call btn-success">Call Rider</button>
                    <button class="btn btn-answer btn-success hide">Answer</button>
                    <button class="btn btn-decline btn-danger hide">Decline</button>
                    <button class="btn btn-hangup btn-danger hide">Hang Up</button>
                  </div>
                </div>

                <!-- Console logs for Twilio SDK Events -->
                <div class="virtual-console">
                  <div class="console-title">Twilio SDK Log</div>
                  <div class="console-output"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### 5. `src/style.css`
A premium dark-themed layout that formats the page to look like two mobile device mockups side-by-side. 
```css
:root {
  --bg-color: #0b0f19;
  --panel-bg: rgba(255, 255, 255, 0.03);
  --border-color: rgba(255, 255, 255, 0.08);
  --text-color: #f3f4f6;
  --text-muted: #9ca3af;
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --success: #10b981;
  --danger: #ef4444;
  --phone-bg: #151d30;
  --console-bg: #030712;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  min-height: 100vh;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}

h1 {
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a5b4fc, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.primary { background-color: var(--primary); color: white; }
.btn.primary:hover { background-color: var(--primary-hover); }
.btn-success { background-color: var(--success); color: white; }
.btn-danger { background-color: var(--danger); color: white; }

.hide { display: none !important; }

.simulator-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

/* Mobile Phone Frame Mockup */
.device-frame {
  background: #000;
  border: 12px solid #2d3748;
  border-radius: 36px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  padding: 6px;
  aspect-ratio: 9 / 18;
  max-width: 380px;
  margin: 0 auto;
}

.device-screen {
  background-color: var(--phone-bg);
  border-radius: 28px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.status-bar {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.6rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.2rem;
  justify-content: space-between;
}

.session-info {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  padding: 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  display: flex;
  justify-content: space-between;
}

.call-interface {
  text-align: center;
  margin: 2rem 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.caller-avatar {
  font-size: 4rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border-color);
  margin-bottom: 1rem;
}

.caller-name { font-size: 1.4rem; font-weight: 600; margin-bottom: 0.2rem; }
.call-status-label { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem; }
.call-timer { font-size: 1.2rem; font-family: monospace; color: var(--text-muted); }

.call-controls {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Virtual Console for Twilio events */
.virtual-console {
  background-color: var(--console-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  height: 140px;
  font-family: monospace;
  font-size: 0.75rem;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
}

.console-title {
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.3rem;
  margin-bottom: 0.4rem;
  font-weight: bold;
}

.console-output {
  flex: 1;
  overflow-y: auto;
  white-space: pre-wrap;
  color: #34d399;
}
```

### 6. `src/api.ts`
Encapsulates API requests to the Payload CMS backend. 
- **Important:** The backend auth layer `requireMobileAuth` checks specific headers:
  - `Authorization: Bearer <token>`
  - `x-user-id`
  - `x-device-id`
  - `x-app-context` (must be `rider` or `driver`)
All requests route through `/api/custom/voice/*` which the Vite configuration proxies to the active backend.
```typescript
export interface SessionContext {
  userId: string;
  deviceId: string;
  appContext: 'rider' | 'driver';
  token: string;
}

export interface SimulatorSessionsResponse {
  success: boolean;
  data: {
    rider: SessionContext;
    driver: SessionContext;
    rideId: string;
  };
}

export interface TwilioTokenResponse {
  success: boolean;
  data: {
    token: string;
    identity: string;
    expiresAt: string;
  };
}

export interface VoiceCallInitResponse {
  success: boolean;
  data: {
    callId: string;
    rideId: string;
    calleeIdentity: string;
    status: string;
    createdAt: string;
  };
}

// Fixed device IDs to identify the simulator's devices
const RIDER_DEVICE_ID = 'sim_device_rider_123';
const DRIVER_DEVICE_ID = 'sim_device_driver_456';

export class ApiClient {
  /**
   * Automatically initializes mock sessions for both Rider & Driver on Backend.
   * Target endpoint: POST /api/custom/voice/simulator-session
   */
  static async initializeSessions(): Promise<SimulatorSessionsResponse> {
    const res = await fetch('/api/custom/voice/simulator-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        riderDeviceId: RIDER_DEVICE_ID,
        driverDeviceId: DRIVER_DEVICE_ID,
      }),
    });
    if (!res.ok) throw new Error(`Failed to initialize session: ${res.statusText}`);
    return res.json();
  }

  /**
   * Fetches the Twilio Voice access JWT token from Backend.
   * Target endpoint: POST /api/custom/voice/token
   */
  static async getTwilioToken(session: SessionContext): Promise<TwilioTokenResponse> {
    const res = await fetch('/api/custom/voice/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
        'x-user-id': session.userId,
        'x-device-id': session.deviceId,
        'x-app-context': session.appContext,
      },
    });
    if (!res.ok) throw new Error(`Failed to get Twilio token: ${res.status}`);
    return res.json();
  }

  /**
   * Initiates the call record in Backend's PostgreSQL database.
   * Target endpoint: POST /api/custom/voice/calls
   */
  static async initiateCall(
    session: SessionContext,
    rideId: string,
    clientRequestId: string
  ): Promise<VoiceCallInitResponse> {
    const res = await fetch('/api/custom/voice/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
        'x-user-id': session.userId,
        'x-device-id': session.deviceId,
        'x-app-context': session.appContext,
      },
      body: JSON.stringify({ rideId, clientRequestId }),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `Failed to initiate call: ${res.status}`);
    }
    return res.json();
  }

  /**
   * Triggers the force hangup request on Backend.
   * Target endpoint: POST /api/custom/voice/calls/:id/end
   */
  static async endCall(session: SessionContext, callId: string): Promise<any> {
    const res = await fetch(`/api/custom/voice/calls/${callId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
        'x-user-id': session.userId,
        'x-device-id': session.deviceId,
        'x-app-context': session.appContext,
      },
      body: JSON.stringify({ reason: 'user_hangup' }),
    });
    if (!res.ok) throw new Error(`Failed to end call: ${res.statusText}`);
    return res.json();
  }
}
```

### 7. `src/device-simulator.ts`
Wraps the globally available `Twilio` client library, registers events, and logs signaling info.
```typescript
import { SessionContext, ApiClient } from './api';

// Globally loaded Twilio SDK (from CDN script in index.html)
declare global {
  const Twilio: any;
}

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
  }

  log(message: string, isError = false) {
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.style.color = isError ? '#ef4444' : '#34d399';
    line.textContent = `[${time}] ${message}`;
    this.logContainer.appendChild(line);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
    console.log(`[${this.element.id}] ${message}`);
  }

  /**
   * Registers this device with Twilio's cloud signaling servers.
   */
  async register(session: SessionContext) {
    this.session = session;
    this.element.querySelector('.val-userId')!.textContent = session.userId;
    this.log(`Requesting Twilio token for user...`);

    try {
      const response = await ApiClient.getTwilioToken(session);
      const token = response.data.token;
      this.log(`Token fetched successfully. Launching Twilio SDK...`);

      // Initialize the Device instance from CDN SDK
      this.device = new Twilio.Device(token, {
        logLevel: 1,
        codecPreferences: ['opus', 'pcmu'],
      });

      this.registerDeviceEvents();
      await this.device.register();
    } catch (err: any) {
      this.log(`Failed during SDK initialization: ${err.message}`, true);
      this.statusVal.textContent = 'Error';
    }
  }

  private registerDeviceEvents() {
    this.device.on('registered', () => {
      this.log(`Twilio Device successfully registered & ready!`);
      this.statusVal.textContent = 'Registered';
      this.statusVal.style.color = '#10b981';
    });

    this.device.on('unregistered', () => {
      this.log(`Twilio Device offline.`);
      this.statusVal.textContent = 'Offline';
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

  /**
   * Initiates outbound call. Triggers Backend PostgreSQL audit record first,
   * then connects the Twilio outbound connection with { callId }.
   */
  async startCall(rideId: string, onConnected: (callId: string) => void, onEnded: () => void) {
    if (!this.session || !this.device) return;
    this.onCallConnectedCallback = onConnected;
    this.onCallEndedCallback = onEnded;

    this.log(`Creating call record on Backend...`);
    this.statusLabel.textContent = 'Calling...';

    // Unique clientRequestId avoids double tap or duplicate active call records
    const clientRequestId = crypto.randomUUID();

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
      if (this.callId && this.onCallConnectedCallback) {
        this.onCallConnectedCallback(this.callId);
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

  acceptIncoming(onEnded: () => void) {
    if (!this.incomingInvite) return;
    this.onCallEndedCallback = onEnded;
    this.log(`Accepting incoming call...`);
    
    const call = this.incomingInvite.accept();
    this.activeCall = call;
    
    this.statusLabel.textContent = 'Connected';
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
    this.statusLabel.textContent = 'Idle';
    this.timerVal.textContent = '00:00';
    this.activeCall = null;
    this.incomingInvite = null;

    this.showButtons(['call']);
    this.hideButtons(['answer', 'decline', 'hangup']);
  }

  private showButtons(keys: ('call' | 'answer' | 'decline' | 'hangup')[]) {
    keys.forEach(k => this.element.querySelector(`.btn-${k}`)?.classList.remove('hide'));
  }

  private hideButtons(keys: ('call' | 'answer' | 'decline' | 'hangup')[]) {
    keys.forEach(k => this.element.querySelector(`.btn-${k}`)?.classList.add('hide'));
  }
}
```

### 8. `src/main.ts`
Orchestrates buttons, instantiates simulated devices, and manages UI timer.
```typescript
import { DeviceSimulator } from './device-simulator';
import { ApiClient, SessionContext } from './api';

let riderSim: DeviceSimulator;
let driverSim: DeviceSimulator;

let riderSession: SessionContext | null = null;
let driverSession: SessionContext | null = null;
let rideId: string | null = null;

let callTimerInterval: any = null;
let timerSeconds = 0;

function startGlobalTimer(elements: HTMLElement[]) {
  stopGlobalTimer();
  timerSeconds = 0;
  callTimerInterval = setInterval(() => {
    timerSeconds++;
    const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const secs = (timerSeconds % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;
    elements.forEach(el => el.textContent = timeStr);
  }, 1000);
}

function stopGlobalTimer() {
  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Bind UI to DeviceSimulators
  riderSim = new DeviceSimulator('rider-device');
  driverSim = new DeviceSimulator('driver-device');

  const btnInit = document.getElementById('btn-init-sessions') as HTMLButtonElement;
  const spanRide = document.getElementById('span-ride-id') as HTMLElement;

  btnInit.addEventListener('click', async () => {
    btnInit.disabled = true;
    btnInit.textContent = 'Initializing...';
    try {
      riderSim.log('Fetching mock session configurations from BE...');
      driverSim.log('Fetching mock session configurations from BE...');

      const config = await ApiClient.initializeSessions();
      riderSession = config.data.rider;
      driverSession = config.data.driver;
      rideId = config.data.rideId;

      spanRide.textContent = rideId;
      btnInit.textContent = 'Sessions Initialized';

      // Register both devices with Twilio Voice SDK
      await Promise.all([
        riderSim.register(riderSession),
        driverSim.register(driverSession)
      ]);
    } catch (err: any) {
      btnInit.disabled = false;
      btnInit.textContent = 'Retry Initialization';
      riderSim.log(`Error during initialization: ${err.message}`, true);
      driverSim.log(`Error during initialization: ${err.message}`, true);
    }
  });

  // --- RIDER ACTION BINDINGS ---
  const riderCallBtn = document.querySelector('#rider-device .btn-call') as HTMLButtonElement;
  const riderAnswerBtn = document.querySelector('#rider-device .btn-answer') as HTMLButtonElement;
  const riderDeclineBtn = document.querySelector('#rider-device .btn-decline') as HTMLButtonElement;
  const riderHangupBtn = document.querySelector('#rider-device .btn-hangup') as HTMLButtonElement;

  riderCallBtn.addEventListener('click', () => {
    if (!rideId) return;
    riderSim.startCall(
      rideId,
      () => {
        // Triggered when call is active
        startGlobalTimer([
          document.querySelector('#rider-device .call-timer')!,
          document.querySelector('#driver-device .call-timer')!
        ]);
      },
      () => {
        // Triggered when call ends
        stopGlobalTimer();
        driverSim.resetCallUi();
      }
    );
  });

  riderAnswerBtn.addEventListener('click', () => {
    riderSim.acceptIncoming(() => {
      stopGlobalTimer();
      driverSim.resetCallUi();
    });
    startGlobalTimer([
      document.querySelector('#rider-device .call-timer')!,
      document.querySelector('#driver-device .call-timer')!
    ]);
  });

  riderDeclineBtn.addEventListener('click', () => {
    riderSim.declineIncoming();
    driverSim.resetCallUi();
  });

  riderHangupBtn.addEventListener('click', () => {
    riderSim.hangup();
  });

  // --- DRIVER ACTION BINDINGS ---
  const driverCallBtn = document.querySelector('#driver-device .btn-call') as HTMLButtonElement;
  const driverAnswerBtn = document.querySelector('#driver-device .btn-answer') as HTMLButtonElement;
  const driverDeclineBtn = document.querySelector('#driver-device .btn-decline') as HTMLButtonElement;
  const driverHangupBtn = document.querySelector('#driver-device .btn-hangup') as HTMLButtonElement;

  driverCallBtn.addEventListener('click', () => {
    if (!rideId) return;
    driverSim.startCall(
      rideId,
      () => {
        startGlobalTimer([
          document.querySelector('#rider-device .call-timer')!,
          document.querySelector('#driver-device .call-timer')!
        ]);
      },
      () => {
        stopGlobalTimer();
        riderSim.resetCallUi();
      }
    );
  });

  driverAnswerBtn.addEventListener('click', () => {
    driverSim.acceptIncoming(() => {
      stopGlobalTimer();
      riderSim.resetCallUi();
    });
    startGlobalTimer([
      document.querySelector('#rider-device .call-timer')!,
      document.querySelector('#driver-device .call-timer')!
    ]);
  });

  driverDeclineBtn.addEventListener('click', () => {
    driverSim.declineIncoming();
    riderSim.resetCallUi();
  });

  driverHangupBtn.addEventListener('click', () => {
    driverSim.hangup();
  });
});
```

---

## 🏃 Setup and Run Instructions for the Frontend Agent

1. Create a clean project folder named `apps/voice-call-simulator/`.
2. Add the file structure and copy the blueprint contents above.
3. Install Vite and TypeScript dependencies locally:
   ```bash
   npm install
   ```
4. Start the frontend developer server:
   ```bash
   npm run dev
   ```
5. In your web browser, open the URL printed by Vite (usually `http://localhost:3005`).
6. Grant microphone permission to `localhost` or the public secure ngrok domain.
7. Click the **"Initialize Simulator Sessions"** button to automatically authenticate and register both virtual devices.
8. Click **"Call Driver"** on the Rider screen, then click **"Answer"** on the Driver screen to simulate an active call!
