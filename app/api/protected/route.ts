// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient({ req: request })
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user data
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Return protected data
    return NextResponse.json({
      user: {
        id: user.user.id,
        email: user.user.email,
        user_type: user.user.user_metadata?.user_type,
      },
      message: 'This is protected data',
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}