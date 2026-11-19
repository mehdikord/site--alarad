export interface GatewayRequest {
  amount: number; // Toman
  callbackUrl: string;
  description: string;
  mobile?: string;
  orderCode: string;
}

export interface GatewayRequestResult {
  ok: boolean;
  authority?: string;
  redirectUrl?: string;
  message?: string;
  raw?: unknown;
}

export interface GatewayVerifyResult {
  ok: boolean;
  refId?: string;
  cardPan?: string;
  cardHash?: string;
  message?: string;
  alreadyVerified?: boolean;
  raw?: unknown;
}

export interface PaymentDriver {
  name: string;
  request(input: GatewayRequest): Promise<GatewayRequestResult>;
  /** `query` = callback query string params */
  verify(input: { authority: string; amount: number; query: Record<string, string> }): Promise<GatewayVerifyResult>;
}
