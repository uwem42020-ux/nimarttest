// app/api/send-otp/route.ts - COMPLETE FILE
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendNimartOtpEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, type = 'signup' } = await request.json();
    
    console.log('📧 API: Sending OTP to:', email);
    
    // Get app URL from environment variable
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nimart.ng';
    
    // 1. First try to send via Supabase (for the OTP verification system)
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${appUrl}/verify`,
      }
    });

    if (supabaseError) {
      console.log('Supabase OTP error (non-fatal):', supabaseError.message);
    }

    // 2. Generate our own OTP and send via Resend
    const otp = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    // Store in a temporary table for verification
    const { error: dbError } = await supabase
      .from('otp_storage')
      .upsert({
        email: email.trim(),
        otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        type,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // 3. Send beautiful email via Resend
    await sendNimartOtpEmail(email, otp);

    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent successfully',
      note: 'Check your inbox (and spam folder if not found)'
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}