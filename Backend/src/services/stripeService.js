import axios from 'axios';
import crypto from 'crypto';
import { URLSearchParams } from 'url';
 
const STRIPE_API_BASE_URL = 'https://api.stripe.com';
const DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300; // 5 min
 
function isUnsetOrPlaceholder(value) {
  const v = String(value || '').trim();
  return !v || v.toLowerCase().startsWith('change_me');
}

export function isStripeConfigured() {
  return !isUnsetOrPlaceholder(process.env.STRIPE_SECRET_KEY);
}
 
export function getStripePriceIdForPlan(planId) {
  const normalized = String(planId || '').trim().toLowerCase();
  const clean = (value) => (isUnsetOrPlaceholder(value) ? undefined : value);
  switch (normalized) {
    case 'starter':
      return clean(process.env.STRIPE_PRICE_STARTER);
    case 'professional':
      return clean(process.env.STRIPE_PRICE_PROFESSIONAL);
    case 'enterprise':
      return clean(process.env.STRIPE_PRICE_ENTERPRISE);
    default:
      return undefined;
  }
}
 
function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe não configurado (STRIPE_SECRET_KEY ausente)');
  }
 
  return axios.create({
    baseURL: STRIPE_API_BASE_URL,
    timeout: 20000,
    auth: { username: process.env.STRIPE_SECRET_KEY, password: '' },
    headers: {
      // Stripe espera x-www-form-urlencoded para endpoints v1
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
}
 
export function toFormBody(paramsObject) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(paramsObject)) {
    if (v === undefined || v === null) continue;
    body.append(k, String(v));
  }
  return body;
}
 
export async function stripePost(path, formBody) {
  const client = stripeClient();
  const res = await client.post(path, formBody);
  return res.data;
}
 
export async function stripeGet(path) {
  const client = stripeClient();
  const res = await client.get(path);
  return res.data;
}
 
export async function createStripeCustomer({ email, name, metadata = {} }) {
  const body = new URLSearchParams();
  if (email) body.append('email', email);
  if (name) body.append('name', name);
  for (const [k, v] of Object.entries(metadata)) {
    if (v === undefined || v === null) continue;
    body.append(`metadata[${k}]`, String(v));
  }
  return stripePost('/v1/customers', body);
}
 
export async function createStripeCheckoutSession({
  customerId,
  tenantId,
  planId,
  priceId,
  successUrl,
  cancelUrl,
}) {
  const body = new URLSearchParams();
  body.append('mode', 'subscription');
  body.append('customer', customerId);
  body.append('success_url', successUrl);
  body.append('cancel_url', cancelUrl);
  body.append('allow_promotion_codes', 'true');
 
  // Linha do plano
  body.append('line_items[0][price]', priceId);
  body.append('line_items[0][quantity]', '1');
 
  // Ajuda a reconciliar no webhook
  if (tenantId !== undefined && tenantId !== null) {
    body.append('client_reference_id', String(tenantId));
    body.append('metadata[tenant_id]', String(tenantId));
    body.append('subscription_data[metadata][tenant_id]', String(tenantId));
  }
  if (planId) {
    body.append('metadata[plan_id]', String(planId));
    body.append('subscription_data[metadata][plan_id]', String(planId));
  }
  if (priceId) {
    body.append('metadata[price_id]', String(priceId));
    body.append('subscription_data[metadata][price_id]', String(priceId));
  }
 
  return stripePost('/v1/checkout/sessions', body);
}
 
export async function createStripeBillingPortalSession({ customerId, returnUrl }) {
  const body = new URLSearchParams();
  body.append('customer', customerId);
  if (returnUrl) body.append('return_url', returnUrl);
  return stripePost('/v1/billing_portal/sessions', body);
}
 
export async function retrieveStripeSubscription(subscriptionId) {
  return stripeGet(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

/** Lista assinaturas do cliente (fallback quando não há subscription_id salvo) */
export async function listStripeSubscriptions(customerId, limit = 5) {
  const params = new URLSearchParams();
  params.append('customer', customerId);
  params.append('limit', String(limit));
  params.append('status', 'all');
  return stripeGet(`/v1/subscriptions?${params.toString()}`);
}

/** Lista faturas do cliente (histórico de pagamentos); expand charge para ver reembolsos */
export async function listStripeInvoices(customerId, limit = 30) {
  const params = new URLSearchParams();
  params.append('customer', customerId);
  params.append('limit', String(limit));
  params.append('expand[0]', 'data.charge');
  return stripeGet(`/v1/invoices?${params.toString()}`);
}

/** Lista métodos de pagamento (cartões) do cliente */
export async function listStripePaymentMethods(customerId, type = 'card') {
  const params = new URLSearchParams();
  params.append('customer', customerId);
  params.append('type', type);
  return stripeGet(`/v1/payment_methods?${params.toString()}`);
}
 
function timingSafeEqualHex(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'hex');
  const bBuf = Buffer.from(String(b || ''), 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
 
export function verifyStripeWebhookSignature({
  payload,
  signatureHeader,
  webhookSecret,
  toleranceSeconds = DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
}) {
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET ausente');
  }
  if (!signatureHeader) {
    throw new Error('Cabeçalho stripe-signature ausente');
  }
 
  // stripe-signature: t=timestamp,v1=signature,...
  const parts = signatureHeader.split(',').map((p) => p.trim());
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const v1Part = parts.find((p) => p.startsWith('v1='));
 
  if (!timestampPart || !v1Part) {
    throw new Error('Cabeçalho stripe-signature inválido');
  }
 
  const timestamp = parseInt(timestampPart.slice(2), 10);
  const signature = v1Part.slice(3);
  if (!Number.isFinite(timestamp) || !signature) {
    throw new Error('Cabeçalho stripe-signature inválido');
  }
 
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    throw new Error('Assinatura Stripe expirada (tolerance excedida)');
  }
 
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex');
 
  if (!timingSafeEqualHex(expected, signature)) {
    throw new Error('Assinatura Stripe inválida');
  }
 
  return true;
}
 
