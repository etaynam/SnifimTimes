import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  console.log('=== Trigger Make Webhook ===');
  
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const webhookUrl = Deno.env.get('MAKE_WEBHOOK_URL')!;
    
    let requestData;
    const text = await req.text();
    requestData = JSON.parse(text);
    
    console.log('Data received:', requestData);
    
    // Forward to Make webhook with API key
    const makeApiKey = Deno.env.get('MAKE_API_KEY');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-make-apikey': makeApiKey || ''
      },
      body: JSON.stringify(requestData)
    });
    
    // Handle both text and JSON responses
    const responseText = await response.text();
    console.log('Make response status:', response.status);
    console.log('Make response text:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { text: responseText };
    }
    
    return new Response(
      JSON.stringify({ success: response.ok, result, status: response.status }),
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
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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
