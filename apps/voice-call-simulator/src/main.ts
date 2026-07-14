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
  const loginRegisterBtn = document.getElementById('btn-login-register') as HTMLButtonElement;
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

      userIdInput.value = '6';
      deviceIdInput.value = 'demo-device-rider';
      phoneInput.value = '+12015550199';
      passwordInput.value = 'Password123!';
    } else {
      screenLabel.textContent = 'DRIVER APP';
      partnerLabel.textContent = 'Rider Partner';
      avatarEl.textContent = '👤';
      callBtn.innerHTML = '<span class="icon">📞</span> Call Rider';

      userIdInput.value = '7';
      deviceIdInput.value = 'demo-device-driver';
      phoneInput.value = '+12015550199';
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

  // Handle Auto-Login & SDK Register
  loginRegisterBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const phone = phoneInput.value.trim();
    const password = passwordInput.value.trim();
    const deviceId = deviceIdInput.value.trim();
    const appContext = appContextSelect.value as 'rider' | 'driver';
    rideId = rideIdInput.value.trim();

    if (!phone || !password || !deviceId || !rideId) {
      deviceSim.log('Error: Phone, Password, Device ID, and Ride ID must be filled for Auto-Login.', true);
      alert('Please fill out Phone, Password, Device ID, and Ride ID.');
      return;
    }

    loginRegisterBtn.disabled = true;
    loginRegisterBtn.textContent = 'Logging in to Backend...';
    deviceSim.log(`Logging in via API (Phone: ${phone})...`);

    try {
      // 1. Perform login
      const loginRes = await ApiClient.login(phone, password, deviceId, appContext);
      const sessionToken = loginRes.data.token;
      const responseUserId = loginRes.data.user.id.toString();

      deviceSim.log(`Login Successful! Session Token retrieved.`);
      // Update UI form fields
      tokenInput.value = sessionToken;
      userIdInput.value = responseUserId;

      // 2. Initialize and Register Twilio Device
      loginRegisterBtn.textContent = 'Connecting Twilio SDK...';
      deviceSim.log(`Registering device with identity: ${responseUserId}`);

      const session: SessionContext = {
        userId: responseUserId,
        deviceId,
        appContext,
        token: sessionToken
      };

      await deviceSim.register(session);
      loginRegisterBtn.disabled = false;
      loginRegisterBtn.innerHTML = '<span class="icon">⚡</span> Auto-Login & Connect SDK';
    } catch (err: any) {
      loginRegisterBtn.disabled = false;
      loginRegisterBtn.innerHTML = '<span class="icon">⚡</span> Retry Auto-Login';
      const errMsg = err?.message || (typeof err === 'string' ? err : '') || 'Unknown Connection Error';
      deviceSim.log(`Auto-Login / Connection Failed: ${errMsg}`, true);
    }
  });

  // Handle Custom Connect (Direct Connection bypasses login)
  registerBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const userId = userIdInput.value.trim();
    const deviceId = deviceIdInput.value.trim();
    const token = tokenInput.value.trim();
    rideId = rideIdInput.value.trim();

    if (!userId || !deviceId || !token || !rideId) {
      deviceSim.log('Error: User ID, Device ID, Bearer Token, and Ride ID must be filled to connect manually.', true);
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
      deviceSim.log(`Connecting device manually with identity: ${userId}`);
      await deviceSim.register(session);
      registerBtn.disabled = false;
      registerBtn.innerHTML = '<span class="icon">🔗</span> Connect with Custom Tokens';
    } catch (err: any) {
      registerBtn.disabled = false;
      registerBtn.innerHTML = '<span class="icon">🔗</span> Retry Manual Connect';
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
