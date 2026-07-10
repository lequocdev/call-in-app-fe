export interface SessionContext {
  userId: string;
  deviceId: string;
  appContext: 'rider' | 'driver';
  token: string;
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

export class ApiClient {
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
