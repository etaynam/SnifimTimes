import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// In-memory storage for OTP codes (in production, use a database or cache)
const otpStore = new Map();

serve(async (req) => {
  console.log('=== Verify OTP Edge Function called ===');
  console.log('Request method:', req.method);
  
  try {
    // Security: Validate request body exists
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Security: Validate request body
    let requestData;
    try {
      const text = await req.text();
      console.log('Raw body:', text);
      
      if (!text || text.trim() === '') {
        console.log('Empty body');
        return new Response(
          JSON.stringify({ success: false, error: 'Empty request body' }),
          { headers: { 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      requestData = JSON.parse(text);
      console.log('Request data:', requestData);
    } catch (err) {
      console.error('JSON parse error:', err);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request body' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { phone, code } = requestData || {};

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing parameters' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get stored OTP from server-side storage
    const key = `${phone}_otp`;
    const storedData = otpStore.get(key);
    
    if (!storedData) {
      console.log('No stored OTP found for phone:', phone);
      return new Response(
        JSON.stringify({ success: false, error: 'קוד לא נמצא או פג תוקף' }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          status: 400
        }
      )
    }

    // Check if OTP expired
    if (new Date(storedData.expires_at) < new Date()) {
      console.log('OTP expired for phone:', phone);
      otpStore.delete(key);
      return new Response(
        JSON.stringify({ success: false, error: 'קוד פג תוקף' }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          status: 400
        }
      )
    }

    // Security: Constant-time comparison to prevent timing attacks
    const verifyOTP = (input: string, stored: string) => {
      if (input.length !== stored.length) return false
      let result = 0
      for (let i = 0; i < input.length; i++) {
        result |= input.charCodeAt(i) ^ stored.charCodeAt(i)
      }
      return result === 0
    }

    const isValid = verifyOTP(code.toString(), storedData.code.toString())
    
    console.log('OTP verification result:', isValid);
    
    // Remove OTP after verification attempt (one-time use)
    if (isValid) {
      otpStore.delete(key);
    }
    
    return new Response(
      JSON.stringify({ success: isValid }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        } 
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        } 
      }
    )
  }
})

// Export the OTP store so generate-otp can use it
export { otpStore };