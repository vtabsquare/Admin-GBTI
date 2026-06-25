import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Trash2, X, Send, RefreshCw, Users, Mail, User } from 'lucide-react';
import { useReauth } from '@/hooks/useReauth';

const INFOBIP_API_KEY = import.meta.env.VITE_INFOBIP_API_KEY;
const INFOBIP_BASE_URL = import.meta.env.VITE_INFOBIP_BASE_URL;
const INFOBIP_SENDER_EMAIL = import.meta.env.VITE_INFOBIP_SENDER_EMAIL;
const INFOBIP_SENDER_NAME = import.meta.env.VITE_INFOBIP_SENDER_NAME || 'GBTI Architectural Team';

interface AdminUserRow {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}


const UsersTab = () => {
  const { user: currentUser, sessionToken } = useAuth();
  const { requireReauth, ReauthModal } = useReauth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data: result, error } = await supabase.functions.invoke('admin-api', {
      body: { action: 'list_admin_users' },
      headers: { 'x-session-token': sessionToken || '' },
    });
    if (!error && result?.data) {
      setUsers(Array.isArray(result.data) ? result.data : []);
    } else if (error || result?.error) {
      toast.error('Failed to load users');
    }
    setLoading(false);
  }, [currentUser?.sessionToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const sendWelcomeEmail = async (email: string, displayName: string) => {
    if (!INFOBIP_API_KEY || !INFOBIP_BASE_URL || !INFOBIP_SENDER_EMAIL) {
      toast.warning('Email service is not configured — welcome email could not be sent.');
      return;
    }

    const adminUrl = window.location.origin;

    try {
      const form = new FormData();
      form.append('from', `${INFOBIP_SENDER_NAME} <${INFOBIP_SENDER_EMAIL}>`);
      form.append('to', `${displayName} <${email}>`);
      form.append('subject', 'Your GBTI Admin Panel Account');
      form.append('html', `
        <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;max-width:560px;margin:0 auto;padding:32px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#b8956a,#a07850);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:20px;">G</div>
          </div>
          <h2 style="text-align:center;margin:0 0 8px;color:#111;font-size:20px;">Welcome to GBTI Admin</h2>
          <p style="text-align:center;color:#6b7280;margin:0 0 24px;font-size:14px;">An admin account has been created for you</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Your login email</p>
            <p style="margin:0;font-weight:700;font-size:16px;color:#111;">${email}</p>
          </div>
          <p style="text-align:center;color:#6b7280;font-size:13px;margin:0 0 16px;">To sign in, visit the Admin Panel and enter your email. A one-time login code (OTP) will be sent to this email address each time you log in.</p>
          <div style="text-align:center;margin:0 0 24px;">
            <a href="${adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#b8956a,#a07850);color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px;">Open Admin Panel</a>
          </div>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;"/>
          <p style="text-align:center;font-size:11px;color:#9ca3af;">GBTI Architectural Team</p>
        </div>
      `);
      form.append('text', `Welcome to GBTI Admin!\n\nAn admin account has been created for you.\n\nYour login email: ${email}\n\nTo sign in, visit ${adminUrl} and enter your email. A one-time login code (OTP) will be sent each time you log in.\n\n-- GBTI Architectural Team`);
      const res = await fetch(`${INFOBIP_BASE_URL}/email/3/send`, {
        method: 'POST',
        headers: { Authorization: `App ${INFOBIP_API_KEY}` },
        body: form,
      });

      if (!res.ok) {
        toast.warning('Welcome email could not be sent.');
      }
    } catch {
      toast.warning('Welcome email could not be sent.');
    }
  };

  const addUser = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setAdding(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('admin-api', {
        body: {
          action: 'create_admin_user',
          payload: {
            email: newEmail.trim(),
            display_name: newDisplayName.trim() || newEmail.trim().split('@')[0],
          },
        },
        headers: { 'x-session-token': sessionToken || '' },
      });

      if (error || result?.error) {
        toast.error(result?.error || 'Failed to create user');
        setAdding(false);
        return;
      }

      const data = result?.data;
      if (data) {
        await sendWelcomeEmail(data.email, data.display_name);
        toast.success(`User created! Welcome email sent to ${data.email}`);
        setShowAddModal(false);
        setNewEmail('');
        setNewDisplayName('');
        await fetchUsers();
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setAdding(false);
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (userId === currentUser?.id) {
      toast.error("You can't delete your own account");
      return;
    }
    if (!confirm(`Delete admin user "${userEmail}" permanently?`)) return;

    // Re-authentication required for user deletion
    const verified = await requireReauth();
    if (!verified) return;

    const { error } = await supabase.functions.invoke('admin-api', {
      body: { action: 'delete_admin_user', payload: { user_id: userId } },
      headers: { 'x-session-token': sessionToken || '' },
    });
    if (error) {
      toast.error('Failed to delete user');
    } else {
      toast.success('User deleted — their session has been invalidated.');
      await fetchUsers();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 md:p-8 max-w-[1400px] mx-auto"
    >
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage admin panel access · {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-muted/30 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clay text-white text-sm font-medium hover:brightness-110 transition-all"
          >
            <UserPlus size={14} />
            Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
              className="w-6 h-6 border-2 border-clay/20 border-t-clay rounded-full"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/20 border-b border-border">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                    User
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                    Added On
                  </th>
                  <th className="px-5 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-clay/10 flex items-center justify-center text-clay font-display font-bold text-xs">
                          {(u.display_name || u.email)[0].toUpperCase()}
                        </div>
                        <span className="font-medium">
                          {u.display_name || '—'}
                          {u.id === currentUser?.id && (
                            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-clay/10 text-clay">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => deleteUser(u.id, u.email)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground/50">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !adding && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl border border-border max-w-md w-full p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-semibold">Add New User</h3>
                <button
                  onClick={() => !adding && setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-5">
                The user will receive a welcome email with login instructions. They'll sign in using their email and a one-time OTP code.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 block">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    <input
                      id="add-user-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-clay/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 block">
                    Display Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    <input
                      id="add-user-name"
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      placeholder="John Doe (optional)"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-clay/40 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => !adding && setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addUser}
                  disabled={adding || !newEmail.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-30"
                >
                  {adding ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
                      className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                    />
                  ) : (
                    <Send size={14} />
                  )}
                  {adding ? 'Creating…' : 'Create & Send Invite'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ReauthModal />
    </motion.div>
  );
};

export default UsersTab;
