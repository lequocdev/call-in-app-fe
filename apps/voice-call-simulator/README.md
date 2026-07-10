# Twilio Voice Call Simulator Frontend

A premium simulated UI to test Rider & Driver in-app calling capabilities. Built using **Vite + TypeScript + Vanilla CSS**, integrating the **Twilio Voice JS SDK**.

## Prerequisites
- Node.js (v18+)
- Active backend running and exposing an API (configured in proxy).

## Getting Started

1. Navigate to the project directory:
   ```bash
   cd apps/voice-call-simulator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open the app in your browser: `http://localhost:3005` (or the local link provided by Vite).

## Simulating a Call
1. Click **Initialize Simulator Sessions** in the top bar. This will mock and retrieve credentials for both devices from the backend.
2. Grant microphone permissions in the browser when requested.
3. Once both devices show **Registered** status, click **Call Driver** or **Call Rider** to start a call.
4. On the receiving device, click **Answer** to connect, or **Decline** to reject.
5. While connected, you can speak and hear audio loopback (if testing on the same system) and view log signaling details. Click **Hang Up** to terminate.
