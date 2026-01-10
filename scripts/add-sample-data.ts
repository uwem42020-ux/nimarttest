// scripts/add-sample-data.ts
import { supabase } from '@/lib/supabase'

async function addSampleProviders() {
  console.log('📝 Adding sample providers...')

  try {
    // Get states first
    const { data: states } = await supabase
      .from('states')
      .select('id, name')
    
    if (!states || states.length === 0) {
      console.error('No states found. Please run the SQL script first.')
      return
    }

    const sampleProviders = [
      {
        business_name: 'Premium Auto Repairs',
        phone: '08012345678',
        email: 'auto@example.com',
        service_type: 'Mechanic',
        bio: 'Expert car repairs and maintenance with 10+ years experience.',
        state_id: states.find(s => s.name === 'Lagos')?.id,
        lga_id: 'lga-1', // Using sample LGA IDs
        is_verified: true,
        verification_status: 'verified',
        rating: 4.5,
        total_reviews: 24
      },
      {
        business_name: 'Spark Electricals',
        phone: '08023456789',
        email: 'electrical@example.com',
        service_type: 'Electrician',
        bio: 'Licensed electrician for homes and offices.',
        state_id: states.find(s => s.name === 'Abuja')?.id,
        lga_id: 'lga-2',
        is_verified: true,
        verification_status: 'verified',
        rating: 4.8,
        total_reviews: 18
      },
      {
        business_name: 'Flow Plumbing Solutions',
        phone: '08034567890',
        email: 'plumbing@example.com',
        service_type: 'Plumber',
        bio: '24/7 emergency plumbing services.',
        state_id: states.find(s => s.name === 'Rivers')?.id,
        lga_id: 'lga-3',
        is_verified: false,
        verification_status: 'pending',
        rating: 4.2,
        total_reviews: 12
      }
    ]

    for (const provider of sampleProviders) {
      // Create auth user first (simplified - in real app, you'd use proper auth)
      const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email: provider.email,
        phone: provider.phone,
        password: 'Sample123!',
        email_confirm: true,
        user_metadata: {
          user_type: 'provider',
          business_name: provider.business_name
        }
      })

      if (userError) {
        console.error(`Failed to create user for ${provider.business_name}:`, userError)
        continue
      }

      // Add provider profile
      const { error: providerError } = await supabase
        .from('providers')
        .insert({
          ...provider,
          user_id: user.user.id
        })

      if (providerError) {
        console.error(`Failed to insert provider ${provider.business_name}:`, providerError)
        // Clean up user
        await supabase.auth.admin.deleteUser(user.user.id)
      } else {
        console.log(`✅ Added provider: ${provider.business_name}`)
      }
    }

    console.log('✅ Sample providers added successfully!')

  } catch (error) {
    console.error('Error adding sample providers:', error)
  }
}

// Run if called directly
if (require.main === module) {
  addSampleProviders().then(() => {
    console.log('✅ Sample data script complete')
    process.exit(0)
  })
}


export { addSampleProviders }
