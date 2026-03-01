import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';

export interface BillingStatus {
  plano: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
}

export interface BillingInvoice {
  id: string;
  number: string;
  status: string;
  statusLabel: string;
  amount_paid: number;
  amount_refunded: number;
  currency: string;
  created: string | null;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
}

export interface BillingPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  funding: string | null;
}

export function useBilling() {
  const { makeRequest } = useApi();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<BillingPaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await makeRequest(API_ENDPOINTS.BILLING.STATUS, { method: 'GET' });
      const billing = res?.billing as BillingStatus | undefined;
      setStatus(billing || null);
      return billing || null;
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar status de assinatura');
      setStatus(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const fetchInvoices = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await makeRequest(API_ENDPOINTS.BILLING.INVOICES, { method: 'GET' });
      setInvoices((res?.invoices ?? []) as BillingInvoice[]);
      return res?.invoices ?? [];
    } catch (e: any) {
      setInvoices([]);
      return [];
    } finally {
      setLoadingHistory(false);
    }
  }, [makeRequest]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const res = await makeRequest(API_ENDPOINTS.BILLING.PAYMENT_METHODS, { method: 'GET' });
      setPaymentMethods((res?.payment_methods ?? []) as BillingPaymentMethod[]);
      return res?.payment_methods ?? [];
    } catch {
      setPaymentMethods([]);
      return [];
    }
  }, [makeRequest]);

  const fetchBillingHistory = useCallback(async () => {
    await Promise.all([fetchInvoices(), fetchPaymentMethods()]);
  }, [fetchInvoices, fetchPaymentMethods]);
 
  const createCheckoutSession = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await makeRequest(API_ENDPOINTS.BILLING.CHECKOUT_SESSION, {
        method: 'POST',
        body: { planId },
      });
      return { url: res?.url as string | undefined };
    } catch (e: any) {
      setError(e?.message || 'Erro ao iniciar checkout');
      return { url: undefined };
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);
 
  const createPortalSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await makeRequest(API_ENDPOINTS.BILLING.PORTAL_SESSION, {
        method: 'POST',
      });
      return { url: res?.url as string | undefined };
    } catch (e: any) {
      setError(e?.message || 'Erro ao abrir portal');
      return { url: undefined };
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);
 
  return {
    status,
    invoices,
    paymentMethods,
    loading,
    loadingHistory,
    error,
    fetchStatus,
    fetchInvoices,
    fetchPaymentMethods,
    fetchBillingHistory,
    createCheckoutSession,
    createPortalSession,
  };
}
 
