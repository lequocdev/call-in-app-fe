import { DeviceSimulator } from './device-simulator';
import { SessionContext, ApiClient } from './api';

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
  const phoneInput = document.getElementById('input-phone') as HTMLInputElement;
  const passwordInput = document.getElementById('input-password') as HTMLInputElement;
  const userIdInput = document.getElementById('input-user-id') as HTMLInputElement;
  const deviceIdInput = document.getElementById('input-device-id') as HTMLInputElement;
  const tokenInput = document.getElementById('input-token') as HTMLTextAreaElement;
  const twilioTokenInput = document.getElementById('input-twilio-token') as HTMLTextAreaElement;
  const rideIdInput = document.getElementById('input-ride-id') as HTMLInputElement;
  const clientRequestIdInput = document.getElementById('input-client-request-id') as HTMLInputElement;
  const genUuidBtn = document.getElementById('btn-gen-uuid') as HTMLButtonElement;
  const loginOnlyBtn = document.getElementById('btn-login-only') as HTMLButtonElement;
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
    tokenInput.value = '';
    twilioTokenInput.value = '';

    if (role === 'rider') {
      screenLabel.textContent = 'RIDER APP';
      partnerLabel.textContent = 'Driver Partner';
      avatarEl.textContent = '🚗';
      callBtn.innerHTML = '<span class="icon">📞</span> Call Driver';

      userIdInput.value = '';
      deviceIdInput.value = 'demo-device-rider';
      phoneInput.value = '+12015550199';
      passwordInput.value = 'Password123!';
    } else {
      screenLabel.textContent = 'DRIVER APP';
      partnerLabel.textContent = 'Rider Partner';
      avatarEl.textContent = '👤';
      callBtn.innerHTML = '<span class="icon">📞</span> Call Rider';

      userIdInput.value = '';
      deviceIdInput.value = 'demo-device-driver';
      phoneInput.value = '+12015550299';
      passwordInput.value = 'Password123!';
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

  // Handle User Login Only
  loginOnlyBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const phone = phoneInput.value.trim();
    const password = passwordInput.value.trim();
    const deviceId = deviceIdInput.value.trim();
    const appContext = appContextSelect.value as 'rider' | 'driver';

    if (!phone || !password || !deviceId) {
      deviceSim.log('Error: Phone, Password, and Device ID must be filled to Login.', true);
      alert('Please fill out Phone, Password, and Device ID.');
      return;
    }

    loginOnlyBtn.disabled = true;
    loginOnlyBtn.textContent = 'Logging in...';
    deviceSim.log(`Performing login via API (Phone: ${phone})...`);

    try {
      const loginRes = await ApiClient.login(phone, password, deviceId, appContext);
      const sessionToken = loginRes.data.token;
      const responseUserId = loginRes.data.user.id.toString();

      deviceSim.log(`Login successful! Session token populated.`);
      tokenInput.value = sessionToken;
      userIdInput.value = responseUserId;

      loginOnlyBtn.disabled = false;
      loginOnlyBtn.innerHTML = '<span class="icon">🔑</span> Login User';
    } catch (err: any) {
      loginOnlyBtn.disabled = false;
      loginOnlyBtn.innerHTML = '<span class="icon">🔑</span> Retry Login';
      const errMsg = err?.message || (typeof err === 'string' ? err : '') || 'Unknown Login Error';
      deviceSim.log(`Login failed: ${errMsg}`, true);
    }
  });

  // Handle SDK Register & Connect (Direct connection using form fields)
  registerBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const userId = userIdInput.value.trim();
    const deviceId = deviceIdInput.value.trim();
    const token = tokenInput.value.trim();
    rideId = rideIdInput.value.trim();

    if (!userId || !deviceId || !token || !rideId) {
      deviceSim.log('Error: User ID, Device ID, Bearer Session Token, and Ride ID must be filled to connect.', true);
      alert('Please fill out User ID, Device ID, Bearer Session Token, and Ride ID.');
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
      registerBtn.innerHTML = '<span class="icon">⚡</span> Connect Twilio SDK';
    } catch (err: any) {
      registerBtn.disabled = false;
      registerBtn.innerHTML = '<span class="icon">⚡</span> Connect Twilio SDK';
      const errMsg = err?.message || (typeof err === 'string' ? err : '') || 'Unknown Connection Error';
      deviceSim.log(`Connection Failed: ${errMsg}`, true);
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
    deviceSim.acceptIncoming(
      () => {
        startGlobalTimer(timerVal);
      },
      () => {
        stopGlobalTimer();
      }
    );
  });

  declineBtn.addEventListener('click', () => {
    deviceSim.declineIncoming();
  });

  hangupBtn.addEventListener('click', () => {
    deviceSim.hangup();
  });
});
