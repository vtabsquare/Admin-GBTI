import { supabase } from './supabase';
import { useAuth } from '@/auth/AuthContext';
import { useRef, useCallback } from 'react';

/**
 * useAdminApi - provides invokeAdminApi() for admin data operations.
 * Currently uses direct supabase calls. Once the admin-api Edge Function
 * is deployed, swap the internals to supabase.functions.invoke().
 */
export const useAdminApi = () => {
  const { sessionToken } = useAuth();
  // Store token in a ref so invokeAdminApi never changes identity
  const tokenRef = useRef(sessionToken);
  tokenRef.current = sessionToken;

  const invokeAdminApi = useCallback(async (action: string, payload: any = {}): Promise<{ data: any; error: any }> => {
    try {
      let data: any = null;
      let error: any = null;

      switch (action) {
        // ── Leads ────────────────────────────────────────────────
        case 'get_leads': {
          const res = await supabase.from('leads').select('*').order('created_at', { ascending: false });
          data = res.data;
          error = res.error;
          break;
        }
        case 'delete_lead': {
          const res = await supabase.from('leads').delete().eq('id', payload.id);
          data = res.data;
          error = res.error;
          break;
        }

        // ── Admin Settings (pricing) ─────────────────────────────
        case 'get_admin_settings': {
          const res = await supabase.from('admin_settings').select('*');
          data = res.data;
          error = res.error;
          break;
        }
        case 'upsert_admin_settings': {
          const res = await supabase
            .from('admin_settings')
            .upsert({ key: payload.key, value: payload.value, updated_at: new Date().toISOString() });
          data = res.data;
          error = res.error;
          break;
        }

        // ── Mortgage Settings ─────────────────────────────────────
        case 'get_mortgage_settings': {
          const res = await supabase.from('mortgage_settings').select('*').limit(1).maybeSingle();
          data = res.data;
          error = res.error;
          break;
        }
        case 'upsert_mortgage_settings': {
          const { id, updated_at: _t, ...fields } = payload;
          if (id) {
            const res = await supabase
              .from('mortgage_settings')
              .update({ ...fields, updated_at: new Date().toISOString() })
              .eq('id', id);
            data = res.data;
            error = res.error;
          } else {
            const res = await supabase.from('mortgage_settings').insert(fields);
            data = res.data;
            error = res.error;
          }
          break;
        }

        // ── Fee Rules ─────────────────────────────────────────────
        case 'get_fee_rules': {
          const res = await supabase.from('fee_rules').select('*').limit(1).maybeSingle();
          data = res.data;
          error = res.error;
          break;
        }
        case 'update_fee_rules': {
          const res = await supabase.rpc('update_fee_rules', payload);
          data = res.data;
          error = res.error;
          break;
        }

        default:
          return { data: null, error: new Error(`Unknown action: ${action}`) };
      }

      return { data, error };
    } catch (err: any) {
      console.error(`Admin API Error (${action}):`, err);
      return { data: null, error: err };
    }
  }, []); // empty deps — uses supabase singleton which never changes

  return { invokeAdminApi };
};
