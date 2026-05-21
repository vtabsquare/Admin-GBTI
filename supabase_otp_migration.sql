-- ============================================================
-- GBTI Admin Panel — OTP Login Migration
-- Run this in your Supabase Dashboard SQL Editor
-- ============================================================

-- Generate and store a 6-digit login OTP (10 min expiry)
-- Returns the OTP code so the frontend can email it via Brevo
CREATE OR REPLACE FUNCTION send_admin_login_otp(p_email TEXT)
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
      reset_code_expires_at = NOW() + INTERVAL '10 minutes',
      updated_at = NOW()
  WHERE email = LOWER(TRIM(p_email));

  RETURN v_code;
END;
$$;

-- Verify login OTP and return user data
CREATE OR REPLACE FUNCTION verify_admin_login_otp(p_email TEXT, p_otp TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user admin_users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM admin_users
  WHERE email = LOWER(TRIM(p_email))
    AND reset_code = p_otp
    AND reset_code_expires_at > NOW();

  IF v_user.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Clear the OTP after successful use
  UPDATE admin_users
  SET reset_code = NULL,
      reset_code_expires_at = NULL,
      updated_at = NOW()
  WHERE id = v_user.id;

  RETURN json_build_object(
    'id', v_user.id,
    'email', v_user.email,
    'display_name', v_user.display_name
  );
END;
$$;

-- ============================================================
-- DONE! OTP login functions are ready.
-- ============================================================
