import generatePayload from 'promptpay-qr';

/**
 * Utility to generate PromptPay EMVCo payload
 * Standard for Thailand QR Payment
 */
export function generatePromptPayPayload(id: string, amount?: number): string {
  // sanitize ID (remove non-digits)
  const sanitizedId = id.replace(/[^0-9]/g, '');
  return generatePayload(sanitizedId, { amount });
}
