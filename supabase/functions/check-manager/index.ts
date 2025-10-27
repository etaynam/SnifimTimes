import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ exists: false }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if phone exists in managers table
    const { data, error } = await supabaseAdmin
      .from('managers')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ exists: false }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ exists: !!data }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ exists: false }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
})

