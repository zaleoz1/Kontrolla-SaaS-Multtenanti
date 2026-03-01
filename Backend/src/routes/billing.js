import express from 'express';
import {
  authenticateToken,
  requireAdmin,
} from '../middleware/auth.js';
import { query, queryWithResult } from '../database/connection.js';
import {
  isStripeConfigured,
  getStripePriceIdForPlan,
  createStripeCustomer,
  createStripeCheckoutSession,
  createStripeBillingPortalSession,
  retrieveStripeSubscription,
  listStripeSubscriptions,
  listStripeInvoices,
  listStripePaymentMethods,
  verifyStripeWebhookSignature,
} from '../services/stripeService.js';
 
const router = express.Router();
 
function getSuccessUrl() {
  return (
    process.env.STRIPE_SUCCESS_URL ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173/dashboard?stripe=success'
  );
}
 
function getCancelUrl() {
  return (
    process.env.STRIPE_CANCEL_URL ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173/signup?stripe=cancel'
  );
}
 
async function getTenantById(tenantId) {
  const tenants = await query('SELECT * FROM tenants WHERE id = ?', [tenantId]);
  return tenants[0] || null;
}
 
async function updateTenantStripeFields(tenantId, fields) {
  const allowed = {
    stripe_customer_id: fields.stripe_customer_id,
    stripe_subscription_id: fields.stripe_subscription_id,
    stripe_price_id: fields.stripe_price_id,
    subscription_status: fields.subscription_status,
    subscription_current_period_end: fields.subscription_current_period_end,
    stripe_checkout_session_id: fields.stripe_checkout_session_id,
  };
 
  const keys = Object.keys(allowed).filter((k) => allowed[k] !== undefined);
  if (keys.length === 0) return;
 
  const setSql = keys
    .map((k) => `${k} = ?`)
    .join(', ');
  const params = keys.map((k) => allowed[k]);
  params.push(tenantId);
 
  await query(
    `UPDATE tenants SET ${setSql}, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?`,
    params
  );
}
 
async function ensureStripeCustomerForTenant(tenant) {
  if (tenant.stripe_customer_id) return tenant.stripe_customer_id;
 
  const customer = await createStripeCustomer({
    email: tenant.email,
    name: tenant.nome,
    metadata: {
      tenant_id: tenant.id,
      tenant_slug: tenant.slug,
    },
  });
 
  await updateTenantStripeFields(tenant.id, {
    stripe_customer_id: customer.id,
  });
 
  return customer.id;
}
 
// =====================================================
// API (autenticada) - Checkout/Portal/Status
// =====================================================
router.use(authenticateToken);
 
router.get('/status', async (req, res) => {
  try {
    const tenant = await getTenantById(req.user.tenant_id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    let subscription_status = tenant.subscription_status || null;
    let subscription_current_period_end = tenant.subscription_current_period_end;
    let plano = tenant.plano || null;
    let subscription = null;

    // 1) Tentar por subscription_id salvo no tenant
    if (tenant.stripe_subscription_id && isStripeConfigured()) {
      try {
        subscription = await retrieveStripeSubscription(tenant.stripe_subscription_id);
      } catch (stripeErr) {
        console.warn('Stripe subscription by id (status):', stripeErr?.message || stripeErr);
      }
    }

    // 2) Fallback: buscar assinaturas do cliente quando não temos subscription ou dados incompletos
    if ((!subscription || !subscription.status) && tenant.stripe_customer_id && isStripeConfigured()) {
      try {
        const listRes = await listStripeSubscriptions(tenant.stripe_customer_id, 5);
        const subs = listRes?.data || [];
        const active = subs.find((s) => ['active', 'trialing'].includes(s?.status));
        subscription = subscription || active || subs[0] || null;
      } catch (stripeErr) {
        console.warn('Stripe list subscriptions (status):', stripeErr?.message || stripeErr);
      }
    }

    if (subscription) {
      if (subscription.status) subscription_status = subscription.status;
      if (subscription.current_period_end) {
        subscription_current_period_end =
          typeof subscription.current_period_end === 'number'
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : subscription.current_period_end;
      }
      const planId =
        subscription?.metadata?.plan_id ||
        subscription?.items?.data?.[0]?.price?.metadata?.plan_id;
      if (planId) {
        const p = String(planId).trim().toLowerCase();
        if (['starter', 'professional', 'enterprise'].includes(p)) plano = p;
      }
    }

    // Normalizar data para ISO string quando vier do DB (Date ou string)
    if (subscription_current_period_end && typeof subscription_current_period_end !== 'string') {
      subscription_current_period_end =
        subscription_current_period_end instanceof Date
          ? subscription_current_period_end.toISOString()
          : String(subscription_current_period_end);
    }

    res.json({
      billing: {
        plano,
        subscription_status,
        subscription_current_period_end: subscription_current_period_end || null,
        stripe_customer_id: tenant.stripe_customer_id || null,
        stripe_subscription_id: tenant.stripe_subscription_id || null,
        stripe_price_id: tenant.stripe_price_id || null,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar status de billing:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
 
router.post('/checkout-session', requireAdmin, async (req, res) => {
  let planId;
  let priceId;

  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({
        error: 'Stripe não configurado no servidor',
      });
    }
 
    planId = req.body?.planId || req.body?.plano || req.body?.selectedPlan;
    priceId = getStripePriceIdForPlan(planId);
    if (!planId || !priceId) {
      return res.status(400).json({
        error: 'Plano inválido (planId) ou Price ID não configurado no servidor',
      });
    }
 
    const tenant = await getTenantById(req.user.tenant_id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
 
    const customerId = await ensureStripeCustomerForTenant(tenant);
 
    const session = await createStripeCheckoutSession({
      customerId,
      tenantId: tenant.id,
      planId,
      priceId,
      successUrl: getSuccessUrl(),
      cancelUrl: getCancelUrl(),
    });
 
    await updateTenantStripeFields(tenant.id, {
      stripe_checkout_session_id: session.id,
      stripe_price_id: priceId,
    });
 
    res.json({ url: session.url, session_id: session.id });
  } catch (error) {
    const stripeErr = error?.response?.data?.error;
    if (stripeErr?.code === 'resource_missing' && stripeErr?.param === 'line_items[0][price]') {
      return res.status(400).json({
        error: 'Price ID da Stripe não encontrado. Verifique se STRIPE_PRICE_* está correto e se corresponde ao mesmo modo (test/live) da STRIPE_SECRET_KEY.',
        details: {
          message: stripeErr.message,
          planId: req.body?.planId || req.body?.plano || req.body?.selectedPlan,
          priceId,
          request_log_url: stripeErr.request_log_url,
        },
      });
    }

    console.error('Erro ao criar checkout session (Stripe):', error?.response?.data || error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? (stripeErr?.message || error?.message) : undefined,
    });
  }
});
 
router.post('/portal-session', requireAdmin, async (req, res) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({
        error: 'Stripe não configurado no servidor',
      });
    }
 
    const tenant = await getTenantById(req.user.tenant_id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    if (!tenant.stripe_customer_id) {
      return res.status(400).json({ error: 'Tenant ainda não possui customer no Stripe' });
    }
 
    const portal = await createStripeBillingPortalSession({
      customerId: tenant.stripe_customer_id,
      returnUrl: process.env.STRIPE_BILLING_PORTAL_RETURN_URL || process.env.FRONTEND_URL,
    });
 
    res.json({ url: portal.url });
  } catch (error) {
    console.error('Erro ao criar billing portal session (Stripe):', error?.response?.data || error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Histórico de faturas (pagamentos, reembolsos, cancelamentos)
router.get('/invoices', async (req, res) => {
  try {
    const tenant = await getTenantById(req.user.tenant_id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    if (!tenant.stripe_customer_id) {
      return res.json({ invoices: [] });
    }
    if (!isStripeConfigured()) {
      return res.json({ invoices: [] });
    }
    const result = await listStripeInvoices(tenant.stripe_customer_id, 50);
    const raw = result?.data || [];
    const invoices = raw.map((inv) => {
      const charge = inv.charge && typeof inv.charge === 'object' ? inv.charge : null;
      const amountPaid = inv.amount_paid != null ? Number(inv.amount_paid) / 100 : 0;
      const amountRefunded = charge?.amount_refunded != null ? Number(charge.amount_refunded) / 100 : 0;
      const refunded = Boolean(charge?.refunded);
      let statusLabel = (inv.status || '').toLowerCase();
      if (refunded || amountRefunded > 0) statusLabel = 'refunded';
      return {
        id: inv.id,
        number: inv.number || inv.id,
        status: inv.status,
        statusLabel,
        amount_paid: amountPaid,
        amount_refunded: amountRefunded,
        currency: (inv.currency || 'brl').toUpperCase(),
        created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
        invoice_pdf: inv.invoice_pdf || null,
        hosted_invoice_url: inv.hosted_invoice_url || null,
      };
    });
    res.json({ invoices });
  } catch (error) {
    console.error('Erro ao listar faturas (Stripe):', error?.message || error);
    res.status(500).json({ error: 'Erro ao carregar histórico de pagamentos', invoices: [] });
  }
});

// Cartões / métodos de pagamento do cliente
router.get('/payment-methods', async (req, res) => {
  try {
    const tenant = await getTenantById(req.user.tenant_id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    if (!tenant.stripe_customer_id) {
      return res.json({ payment_methods: [] });
    }
    if (!isStripeConfigured()) {
      return res.json({ payment_methods: [] });
    }
    const result = await listStripePaymentMethods(tenant.stripe_customer_id, 'card');
    const raw = result?.data || [];
    const payment_methods = raw.map((pm) => {
      const card = pm.card || {};
      return {
        id: pm.id,
        brand: (card.brand || 'card').toLowerCase(),
        last4: card.last4 || '****',
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        funding: card.funding || null,
      };
    });
    res.json({ payment_methods });
  } catch (error) {
    console.error('Erro ao listar payment methods (Stripe):', error?.message || error);
    res.status(500).json({ error: 'Erro ao carregar cartões', payment_methods: [] });
  }
});

// =====================================================
// WEBHOOK (sem auth) - exposto via server.js com body raw
// =====================================================
export async function billingWebhookHandler(req, res) {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).send('Stripe not configured');
    }
 
    const signatureHeader = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
 
    const payloadBuffer = req.body;
    const payload = Buffer.isBuffer(payloadBuffer)
      ? payloadBuffer.toString('utf8')
      : String(payloadBuffer || '');
 
    verifyStripeWebhookSignature({
      payload,
      signatureHeader,
      webhookSecret,
    });
 
    const event = JSON.parse(payload);
    const eventType = event?.type;
    const obj = event?.data?.object;
 
    const normalizePlanId = (planId) => {
      const p = String(planId || '').trim().toLowerCase();
      if (p === 'starter' || p === 'professional' || p === 'enterprise') return p;
      return null;
    };

    const updateFromSubscription = async (tenantId, subscription) => {
      const priceId =
        subscription?.items?.data?.[0]?.price?.id ||
        subscription?.items?.data?.[0]?.plan?.id;
      const planId = normalizePlanId(subscription?.metadata?.plan_id);
      const status = subscription?.status || null;
      const currentPeriodEnd = subscription?.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;
 
      await updateTenantStripeFields(tenantId, {
        stripe_subscription_id: subscription?.id,
        stripe_customer_id: subscription?.customer,
        stripe_price_id: priceId,
        subscription_status: status,
        subscription_current_period_end: currentPeriodEnd,
      });

      if (planId) {
        await query('UPDATE tenants SET plano = ? WHERE id = ?', [planId, tenantId]);
      }
    };
 
    if (eventType === 'checkout.session.completed') {
      const tenantId = parseInt(obj?.client_reference_id || obj?.metadata?.tenant_id, 10);
      if (Number.isFinite(tenantId)) {
        const subscriptionId = obj?.subscription;
        if (subscriptionId) {
          const subscription = await retrieveStripeSubscription(subscriptionId);
          await updateFromSubscription(tenantId, subscription);
        } else {
          await updateTenantStripeFields(tenantId, {
            stripe_customer_id: obj?.customer,
            stripe_checkout_session_id: obj?.id,
          });
          const planId = normalizePlanId(obj?.metadata?.plan_id);
          if (planId) {
            await query('UPDATE tenants SET plano = ? WHERE id = ?', [planId, tenantId]);
          }
        }
      }
    } else if (
      eventType === 'customer.subscription.updated' ||
      eventType === 'customer.subscription.deleted' ||
      eventType === 'customer.subscription.created'
    ) {
      const tenantIdRaw = obj?.metadata?.tenant_id;
      const tenantId = parseInt(tenantIdRaw, 10);
 
      if (Number.isFinite(tenantId)) {
        await updateFromSubscription(tenantId, obj);
      } else if (obj?.customer) {
        // Fallback: localizar tenant por customer_id
        const tenants = await query('SELECT id FROM tenants WHERE stripe_customer_id = ? LIMIT 1', [
          obj.customer,
        ]);
        const tenant = tenants[0];
        if (tenant?.id) {
          await updateFromSubscription(tenant.id, obj);
        }
      }
    }
 
    res.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook Stripe:', error?.message || error);
    res.status(400).send('Webhook Error');
  }
}
 
export default router;

