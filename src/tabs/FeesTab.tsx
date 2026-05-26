import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Settings, Landmark, FileText, Receipt } from 'lucide-react';
import { useReauth } from '@/hooks/useReauth';

interface FeeRules {
  solicitor_fee_percent: number;
  solicitor_fixed_charge: number;
  registry_fee_percent: number;
  stamp_duty_percent: number;
  misc_fee: number;
  vat_enabled: boolean;
  vat_percent: number;
}

const DEFAULT_FEES: FeeRules = {
  solicitor_fee_percent: 0.8,
  solicitor_fixed_charge: 340,
  registry_fee_percent: 0.12,
  stamp_duty_percent: 0.20,
  misc_fee: 10000,
  vat_enabled: false,
  vat_percent: 14.0,
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
      <input type="number" step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="w-full bg-transparent outline-none text-sm font-display font-semibold text-right" />
      {suffix && <span className="text-muted-foreground/50 text-sm">{suffix}</span>}
    </div>
  </div>
);

const ToggleInput = ({ label, value, onChange }: any) => (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <label className="text-sm text-foreground/80 flex-1">{label}</label>
    <button 
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-clay' : 'bg-muted'}`}
    >
      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${value ? 'translate-x-6' : ''}`} />
    </button>
  </div>
);

export default function FeesTab() {
  const [fees, setFees] = useState<FeeRules>(DEFAULT_FEES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { requireReauth, ReauthModal } = useReauth();

  const fetchFees = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('fee_rules').select('*').limit(1).maybeSingle();
    if (!error && data) {
      setFees(data as FeeRules);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const save = async () => {
    const verified = await requireReauth();
    if (!verified) return;

    setSaving(true);
    const { error } = await supabase.rpc('update_fee_rules', {
      p_solicitor: fees.solicitor_fee_percent,
      p_solicitor_fixed: fees.solicitor_fixed_charge,
      p_registry: fees.registry_fee_percent,
      p_stamp: fees.stamp_duty_percent,
      p_misc: fees.misc_fee,
      p_vat_enabled: fees.vat_enabled,
      p_vat_percent: fees.vat_percent
    });
    setSaving(false);
    if (error) toast.error('Failed to save fees: ' + error.message);
    else toast.success('Fee rules saved successfully!');
  };

  const updateField = (key: keyof FeeRules, value: number | boolean) => {
    setFees((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading fees...</div>;
  }

  return (
    <>
    <TabWrapper 
      title="Closing Fees & Taxes" 
      subtitle="Configure standard registry percentages, stamp duties, and VAT applied to legal fees."
      actions={
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-30">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PricingCard title="Property Fees" icon={<Landmark size={16} />}>
          <PriceInput label="Solicitor / Legal Fee (%)" value={fees.solicitor_fee_percent} onChange={(v: number) => updateField('solicitor_fee_percent', v)} suffix="% of Total" />
          <PriceInput label="Solicitor Fixed Charge" value={fees.solicitor_fixed_charge} onChange={(v: number) => updateField('solicitor_fixed_charge', v)} prefix="$" />
          <PriceInput label="Registry Fee (%)" value={fees.registry_fee_percent} onChange={(v: number) => updateField('registry_fee_percent', v)} suffix="% of Total" />
          <PriceInput label="Stamp Duty (%)" value={fees.stamp_duty_percent} onChange={(v: number) => updateField('stamp_duty_percent', v)} suffix="% of Total" />
        </PricingCard>

        <PricingCard title="Additional Charges" icon={<FileText size={16} />}>
          <PriceInput label="Fixed Miscellaneous Fee" value={fees.misc_fee} onChange={(v: number) => updateField('misc_fee', v)} prefix="$" />
        </PricingCard>

        <PricingCard title="VAT Settings" icon={<Receipt size={16} />}>
          <ToggleInput label="Apply VAT on Legal Fees" value={fees.vat_enabled} onChange={(v: boolean) => updateField('vat_enabled', v)} />
          {fees.vat_enabled && (
            <PriceInput label="VAT Percentage" value={fees.vat_percent} onChange={(v: number) => updateField('vat_percent', v)} suffix="%" />
          )}
        </PricingCard>
      </div>
    </TabWrapper>
    <ReauthModal />
    </>
  );
}
