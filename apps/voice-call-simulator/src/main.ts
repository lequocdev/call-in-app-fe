import { DeviceSimulator } from './device-simulator';
import { SessionContext } from './api';

let deviceSim: DeviceSimulator;
let rideId: string = '';
let callTimerInterval: any = null;
let timerSeconds = 0;

function startGlobalTimer(timerElement: HTMLElement) {
  stopGlobalTimer();
  timerSeconds = 0;
  timerElement.textContent = '00:00';
  callTimerInterval = setInterval(() => {
    timerSeconds++;
    const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const secs = (timerSeconds % 60).toString().padStart(2, '0');
    timerElement.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopGlobalTimer() {
  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Select DOM Elements
  const appContextSelect = document.getElementById('input-app-context') as HTMLSelectElement;
  const userIdInput = document.getElementById('input-user-id') as HTMLInputElement;
  const deviceIdInput = document.getElementById('input-device-id') as HTMLInputElement;
  const tokenInput = document.getElementById('input-token') as HTMLTextAreaElement;
  const rideIdInput = document.getElementById('input-ride-id') as HTMLInputElement;
  const clientRequestIdInput = document.getElementById('input-client-request-id') as HTMLInputElement;
  const genUuidBtn = document.getElementById('btn-gen-uuid') as HTMLButtonElement;
  const registerBtn = document.getElementById('btn-register-device') as HTMLButtonElement;

  const screenLabel = document.getElementById('device-screen-label') as HTMLElement;
  const partnerLabel = document.getElementById('call-partner-label') as HTMLElement;
  const avatarEl = document.getElementById('call-avatar') as HTMLElement;
  const callBtn = document.getElementById('btn-call') as HTMLButtonElement;
  const timerVal = document.querySelector('#device-container .call-timer') as HTMLElement;

  // Initialize Simulator
  deviceSim = new DeviceSimulator('device-container');

  // Autofill helpers depending on chosen App Context
  function applyAutofillDefaults() {
    const role = appContextSelect.value;
    rideIdInput.value = '7';
    clientRequestIdInput.value = crypto.randomUUID();

    if (role === 'rider') {
      screenLabel.textContent = 'RIDER APP';
      partnerLabel.textContent = 'Driver Partner';
      avatarEl.textContent = '🚗';
      callBtn.innerHTML = '<span class="icon">📞</span> Call Driver';

      userIdInput.value = '6';
      deviceIdInput.value = 'demo-device-rider';
    } else {
      screenLabel.textContent = 'DRIVER APP';
      partnerLabel.textContent = 'Rider Partner';
      avatarEl.textContent = '👤';
      callBtn.innerHTML = '<span class="icon">📞</span> Call Rider';

      userIdInput.value = '7';
      deviceIdInput.value = 'demo-device-driver';
    }
  }

  // Handle context changes
  appContextSelect.addEventListener('change', () => {
    applyAutofillDefaults();
    deviceSim.log(`Switched App Context to: ${appContextSelect.value.toUpperCase()}`);
    deviceSim.resetCallUi();
  });

  // Handle manual UUID generation
  genUuidBtn.addEventListener('click', () => {
    const newUuid = crypto.randomUUID();
    clientRequestIdInput.value = newUuid;
    deviceSim.log(`Generated new Client Request ID: ${newUuid}`);
  });

  // Apply initially on load
  applyAutofillDefaults();

  // Handle SDK Register
  registerBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const userId = userIdInput.value.trim();
    const deviceId = deviceIdInput.value.trim();
    const token = tokenInput.value.trim();
    rideId = rideIdInput.value.trim();

    if (!userId || !deviceId || !token || !rideId) {
      deviceSim.log('Error: All configuration fields must be filled before registering.', true);
      alert('Please fill out all fields before registering.');
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Connecting Twilio SDK...';

    const session: SessionContext = {
      userId,
      deviceId,
      appContext: appContextSelect.value as 'rider' | 'driver',
      token
    };

    try {
      deviceSim.log(`Registering device with identity: ${userId}`);
      await deviceSim.register(session);
      registerBtn.disabled = false;
      registerBtn.innerHTML = '<span class="icon">⚡</span> Re-register & Connect';
    } catch (err: any) {
      registerBtn.disabled = false;
      registerBtn.innerHTML = '<span class="icon">⚡</span> Retry Connection';
      const errMsg = err?.message || (typeof err === 'string' ? err : '') || 'Unknown Connection Error';
      deviceSim.log(`Registration Failed: ${errMsg}`, true);
    }
  });

  // Bind call controls
  const answerBtn = document.getElementById('btn-answer') as HTMLButtonElement;
  const declineBtn = document.getElementById('btn-decline') as HTMLButtonElement;
  const hangupBtn = document.getElementById('btn-hangup') as HTMLButtonElement;

  callBtn.addEventListener('click', () => {
    const activeRideId = rideIdInput.value.trim();
    const clientRequestId = clientRequestIdInput.value.trim();

    if (!activeRideId) {
      deviceSim.log('Error: No active Ride ID specified.', true);
      return;
    }
    if (!clientRequestId) {
      deviceSim.log('Error: Client Request ID (Idempotency Key) is required to call.', true);
      return;
    }

    deviceSim.startCall(
      activeRideId,
      clientRequestId,
      () => {
        // Connected
        startGlobalTimer(timerVal);
      },
      () => {
        // Ended
        stopGlobalTimer();
      }
    );
  });

  answerBtn.addEventListener('click', () => {
    deviceSim.acceptIncoming(() => {
      stopGlobalTimer();
    });
    startGlobalTimer(timerVal);
  });

  declineBtn.addEventListener('click', () => {
    deviceSim.declineIncoming();
  });

  hangupBtn.addEventListener('click', () => {
    deviceSim.hangup();
  });
});
