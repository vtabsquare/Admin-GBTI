-- ============================================================
-- GBTI Admin Panel — Authentication Setup
-- Run this ENTIRE script in your Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN DEFAULT FALSE,
  reset_code TEXT,
  reset_code_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Disable RLS (access is controlled via SECURITY DEFINER functions)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- ─── RPC Functions ───────────────────────────────────────────

-- Verify login credentials
CREATE OR REPLACE FUNCTION verify_admin_login(p_email TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user admin_users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM admin_users
  WHERE email = LOWER(TRIM(p_email));

  IF v_user.id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'must_change_password', v_user.must_change_password
    );
  END IF;

  RETURN NULL;
END;
$$;

-- Create a new admin user
CREATE OR REPLACE FUNCTION create_admin_user(p_email TEXT, p_display_name TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user admin_users%ROWTYPE;
BEGIN
  INSERT INTO admin_users (email, display_name, password_hash, must_change_password)
  VALUES (LOWER(TRIM(p_email)), p_display_name, crypt(p_password, gen_salt('bf')), TRUE)
  RETURNING * INTO v_user;

  RETURN json_build_object(
    'id', v_user.id,
    'email', v_user.email,
    'display_name', v_user.display_name
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'A user with this email already exists';
END;
$$;

-- Change password (and clear must_change_password flag)
CREATE OR REPLACE FUNCTION change_admin_password(p_user_id UUID, p_new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_users
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      must_change_password = FALSE,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Generate and store a 6-digit reset code (15 min expiry)
CREATE OR REPLACE FUNCTION set_admin_reset_code(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_found BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM admin_users WHERE email = LOWER(TRIM(p_email))
  ) INTO v_found;

  IF NOT v_found THEN
    RETURN NULL;
  END IF;

  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  UPDATE admin_users
  SET reset_code = v_code,
      reset_code_expires_at = NOW() + INTERVAL '15 minutes',
      updated_at = NOW()
  WHERE email = LOWER(TRIM(p_email));

  RETURN v_code;
END;
$$;

-- Verify reset code and set new password
CREATE OR REPLACE FUNCTION verify_admin_reset_code(p_email TEXT, p_code TEXT, p_new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user admin_users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM admin_users
  WHERE email = LOWER(TRIM(p_email))
    AND reset_code = p_code
    AND reset_code_expires_at > NOW();

  IF v_user.id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE admin_users
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      reset_code = NULL,
      reset_code_expires_at = NULL,
      must_change_password = FALSE,
      updated_at = NOW()
  WHERE id = v_user.id;

  RETURN TRUE;
END;
$$;

-- List all admin users (no password hashes)
CREATE OR REPLACE FUNCTION list_admin_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', id,
        'email', email,
        'display_name', display_name,
        'created_at', created_at
      ) ORDER BY created_at
    ) FROM admin_users),
    '[]'::json
  );
END;
$$;

-- Delete an admin user
CREATE OR REPLACE FUNCTION delete_admin_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM admin_users WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- ─── Seed Initial Admin ──────────────────────────────────────

INSERT INTO admin_users (email, display_name, password_hash, must_change_password)
VALUES (
  'admin@gbti.com',
  'Admin',
  crypt('Admin@123', gen_salt('bf')),
  FALSE
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- DONE! Your admin_users table and auth functions are ready.
-- Default login: admin@gbti.com / Admin@123
-- ============================================================
