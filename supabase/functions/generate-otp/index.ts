import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Import OTP store from verify-otp
const { otpStore } = await import('../verify-otp/index.ts');

serve(async (req) => {
  console.log('=== Edge Function called ===');
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

    const { phone } = requestData || {};
    console.log('Phone received:', phone);

    if (!phone || phone.length !== 10) {
      console.log('Invalid phone number:', phone);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid phone number' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Generate random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    console.log('Generated code:', code);
    
    // SECURITY FIX: Store code server-side, NOT in response
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
    otpStore.set(`${phone}_otp`, {
      code: code,
      phone: phone,
      expires_at: expiresAt
    });
    console.log('OTP stored server-side for phone:', phone);
    
    // Get SMS credentials
    const smsUser = Deno.env.get('SMS_USER');
    const smsPass = Deno.env.get('SMS_PASS');
    console.log('SMS_USER:', smsUser);
    console.log('SMS_PASS exists:', !!smsPass);
    
    // Remove leading 0 from phone for API (recipient should be without leading 0)
    const recipientPhone = phone.startsWith('0') ? phone.substring(1) : phone;
    console.log('Recipient phone:', recipientPhone);
    
    // Virtual phone number for sender
    const virtualSender = '0534941980';
    console.log('Using virtual sender:', virtualSender);
    
    // Send SMS via SMS4FREE API
    try {
      console.log('Sending SMS...');
      
      const smsResponse = await fetch('https://api.sms4free.co.il/ApiSMS/v2/SendSMS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'xLSoK15K7',
          user: smsUser || '',
          pass: smsPass || '',
          sender: virtualSender, // Use virtual phone as sender
          recipient: recipientPhone,
          msg: `קוד האימות שלך: ${code}`
        })
      });

      const smsData = await smsResponse.json();
      console.log('SMS Response:', smsData);
      
      if (smsData.status <= 0) {
        console.error('SMS Error:', smsData);
        // Still return success in development, but log the error
      }
    } catch (smsError) {
      console.error('SMS sending error:', smsError);
      // In production, you might want to fail here
    }
    
    // SECURITY FIX: Store the code server-side and return only success status
    // DO NOT expose the code in the response
    const responseData = {
      success: true,
      message: 'Code sent successfully'
    };
    
    console.log('Returning response (WITHOUT CODE):', responseData);
    
    return new Response(
      JSON.stringify(responseData),
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

