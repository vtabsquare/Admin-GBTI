import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Settings, Percent, Clock, CreditCard } from 'lucide-react';
import { useReauth } from '@/hooks/useReauth';
import { useAuth } from '@/auth/AuthContext';

interface MortgageSettings {
  id?: string;
  default_interest_rate: number;
  min_interest_rate: number;
  max_interest_rate: number;
  default_tenure: number;
  min_tenure: number;
  max_tenure: number;
  min_down_payment_percent: number;
  max_ltv: number;
}

const DEFAULT_MORTGAGE: MortgageSettings = {
  default_interest_rate: 6.5,
  min_interest_rate: 2.0,
  max_interest_rate: 15.0,
  default_tenure: 25,
  min_tenure: 5,
  max_tenure: 40,
  min_down_payment_percent: 10.0,
  max_ltv: 90.0,
};

const TabWrapper = ({ children, title, subtitle, actions }: any) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="p-6 md:p-8 max-w-[1400px] mx-auto">
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
    {children}
  </motion.div>
);

const PricingCard = ({ title, icon, children }: any) => (
  <div className="rounded-2xl border border-border bg-surface p-6">
    <div className="flex items-center gap-2 mb-5"><span className="text-clay">{icon}</span><h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{title}</h3></div>
    <div className="space-y-3">{children}</div>
  </div>
);

const PriceInput = ({ label, value, onChange, prefix, suffix }: any) => (
  <div className="flex items-center justify-between gap-4">
    <label className="text-sm text-foreground/80 flex-1">{label}</label>
    <div className="flex items-center gap-1 bg-background rounded-lg border border-border px-3 py-1.5 w-36">
      {prefix && <span className="text-muted-foreground/50 text-sm">{prefix}</span>}
      <input type="number" step="0.1" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="w-full bg-transparent outline-none text-sm font-display font-semibold text-right" />
      {suffix && <span className="text-muted-foreground/50 text-sm">{suffix}</span>}
    </div>
  </div>
);

export default function FinancingTab() {
  const [settings, setSettings] = useState<MortgageSettings>(DEFAULT_MORTGAGE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { requireReauth, ReauthModal } = useReauth();
  const { sessionToken } = useAuth();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data: result, error } = await supabase.functions.invoke('admin-api', {
      body: { action: 'get_mortgage_settings' },
      headers: { 'x-session-token': sessionToken },
    });
    if (!error && result?.data) {
      setSettings(result.data as MortgageSettings);
    }
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const save = async () => {
    const verified = await requireReauth();
    if (!verified) return;

    setSaving(true);
    const { error } = await supabase.functions.invoke('admin-api', {
      body: {
        action: 'upsert_mortgage_settings',
        payload: {
          id: settings.id || null,
          default_interest_rate: settings.default_interest_rate,
          min_interest_rate: settings.min_interest_rate,
          max_interest_rate: settings.max_interest_rate,
          default_tenure: settings.default_tenure,
          min_tenure: settings.min_tenure,
          max_tenure: settings.max_tenure,
          min_down_payment_percent: settings.min_down_payment_percent,
          max_ltv: settings.max_ltv,
        }
      },
      headers: { 'x-session-token': sessionToken },
    });
    setSaving(false);
    if (error) toast.error('Failed to save mortgage settings: ' + error.message);
    else toast.success('Mortgage settings saved successfully!');
  };

  const updateField = (key: keyof MortgageSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading settings...</div>;
  }

  return (
    <>
    <TabWrapper 
      title="Mortgage Settings" 
      subtitle="Configure global interest rates, tenure limits, and default values."
      actions={
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-30">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PricingCard title="Interest Rate Rules" icon={<Percent size={16} />}>
          <PriceInput label="Default Interest Rate" value={settings.default_interest_rate} onChange={(v: number) => updateField('default_interest_rate', v)} suffix="%" />
          <PriceInput label="Minimum Interest Rate" value={settings.min_interest_rate} onChange={(v: number) => updateField('min_interest_rate', v)} suffix="%" />
          <PriceInput label="Maximum Interest Rate" value={settings.max_interest_rate} onChange={(v: number) => updateField('max_interest_rate', v)} suffix="%" />
        </PricingCard>

        <PricingCard title="Loan Tenure (Years)" icon={<Clock size={16} />}>
          <PriceInput label="Default Tenure" value={settings.default_tenure} onChange={(v: number) => updateField('default_tenure', v)} suffix="Yrs" />
          <PriceInput label="Minimum Tenure" value={settings.min_tenure} onChange={(v: number) => updateField('min_tenure', v)} suffix="Yrs" />
          <PriceInput label="Maximum Tenure" value={settings.max_tenure} onChange={(v: number) => updateField('max_tenure', v)} suffix="Yrs" />
        </PricingCard>

        <PricingCard title="Down Payment & Equity" icon={<CreditCard size={16} />}>
          <PriceInput label="Minimum Down Payment" value={settings.min_down_payment_percent} onChange={(v: number) => updateField('min_down_payment_percent', v)} suffix="%" />
          <PriceInput label="Maximum Loan-to-Value (LTV)" value={settings.max_ltv} onChange={(v: number) => updateField('max_ltv', v)} suffix="%" />
        </PricingCard>
      </div>
    </TabWrapper>
    <ReauthModal />
    </>
  );
}
