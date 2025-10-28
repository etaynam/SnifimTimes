import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          checkAdminRole(session.user.id);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await checkAdminRole(session.user.id);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const checkAdminRole = async (userId) => {
    // Check if phone is the admin phone
    if (userId && userId.toString().includes('demo')) {
      const adminPhones = ['0542323965', '0523693649', '0542323903'];
      // Remove all dashes from userId for comparison
      const cleanUserId = userId.replace(/-/g, '');
      const isDemoAdmin = adminPhones.some(phone => cleanUserId.includes(phone));
      setIsAdmin(isDemoAdmin);
      return;
    }

    /* REAL SUPABASE CODE - Uncomment when ready:
    try {
      const { data } = await supabase
        .from('managers')
        .select('is_admin')
        .eq('user_id', userId)
        .single();

      if (data && data.is_admin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      setIsAdmin(false);
    }
    */
  };

  const signInWithPhone = async (phone) => {
    try {
      // Call edge function to generate OTP
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        return { success: false, error: 'Failed to generate OTP' };
      }

      // SECURITY FIX: Do not store code from response (it's no longer sent)
      // The code is sent only via SMS, not returned in the response
      // The user must enter the code they receive via SMS
      
      // Store phone for verification
      sessionStorage.setItem('otp_phone', phone);
      sessionStorage.setItem('otp_expires', new Date(Date.now() + 5 * 60 * 1000).toISOString());
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const verifyOTP = async (phone, token, isMasterCode = false) => {
    try {
      // Security: Clean phone number for comparison
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      
      // Master code bypass (for emergency access without SMS)
      const masterCode = process.env.REACT_APP_MASTER_CODE || '9517';
      if (isMasterCode && token === masterCode) {
        // Security: Check if manager exists
        const { data: managerData } = await supabase
          .from('managers')
          .select('id, phone, name')
          .eq('phone', cleanPhone)
          .maybeSingle();
        
        if (!managerData) {
          return { success: false, error: 'מספר טלפון לא נמצא במערכת' };
        }

        // Create user session with master code
        const user = {
          id: `demo-${cleanPhone}`,
          phone: cleanPhone,
          created_at: new Date().toISOString()
        };
        
        setUser(user);
        await checkAdminRole(user.id);
        
        return { success: true, data: { user, session: { demo: true, masterCode: true } } };
      }
      
      // SECURITY FIX: No longer store code in sessionStorage
      // The verification happens server-side via Edge Function
      const storedPhone = sessionStorage.getItem('otp_phone');
      const expiresAt = sessionStorage.getItem('otp_expires');

      // Security: Verify phone matches
      if (cleanPhone !== storedPhone) {
        return { success: false, error: 'Phone mismatch' };
      }

      // Security: Check expiration
      if (!expiresAt || new Date(expiresAt) < new Date()) {
        sessionStorage.removeItem('otp_phone');
        sessionStorage.removeItem('otp_expires');
        return { success: false, error: 'קוד פג תוקף' };
      }

      // Call edge function to verify OTP server-side
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ phone: cleanPhone, code: token })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        return { success: false, error: 'קוד לא תקין' };
      }

      // Security: Clear OTP from storage after successful verification
      sessionStorage.removeItem('otp_phone');
      sessionStorage.removeItem('otp_expires');

      // Create user session
      const user = {
        id: `demo-${cleanPhone}`,
        phone: cleanPhone,
        created_at: new Date().toISOString()
      };
      
      setUser(user);
      await checkAdminRole(user.id);
      
      return { success: true, data: { user, session: { demo: true } } };
    } catch (error) {
      return { success: false, error: 'קוד לא תקין' };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      // Error handled silently
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    signInWithPhone,
    verifyOTP,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
