// scripts/init-db.ts
import { supabase } from '@/lib/supabase'

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...')

  try {
    // Check if tables exist
    const tables = ['states', 'lgas', 'providers', 'services']
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true })
        
      if (error) {
        console.error(`❌ Table "${table}" might not exist:`, error.message)
        
        // Try to create the table (you'll need to adjust based on your SQL)
        console.log(`Attempting to create ${table} table...`)
      } else {
        console.log(`✅ Table "${table}" exists`)
      }
    }

    // Check if states have data
    const { data: states, error: statesError } = await supabase
      .from('states')
      .select('*')
      .limit(5)
    
    if (statesError) {
      console.error('Error checking states:', statesError)
    } else {
      console.log(`📊 Found ${states?.length || 0} states`)
      if (states && states.length > 0) {
        console.log('Sample states:', states.slice(0, 3))
      }
    }

    // Check if services have data
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
    
    if (servicesError) {
      console.error('Error checking services:', servicesError)
    } else {
      console.log(`📊 Found ${services?.length || 0} services`)
      if (services && services.length > 0) {
        console.log('Available services:', services.map(s => s.name))
      } else {
        console.log('Inserting sample services...')
        // Insert sample services if table is empty
        const sampleServices = [
          'Mechanic', 'Electrician', 'Plumber', 'Carpenter',
          'Tailor', 'Hair Stylist', 'Makeup Artist', 'Painter',
          'Mason', 'AC Technician', 'Generator Repair', 'Welder'
        ]
        
        for (const serviceName of sampleServices) {
          const { error } = await supabase
            .from('services')
            .insert({ name: serviceName })
          
          if (error) console.error(`Failed to insert ${serviceName}:`, error)
          else console.log(`✅ Added service: ${serviceName}`)
        }
      }
    }

  } catch (error) {
    console.error('Database verification failed:', error)
  }
}

// Run if called directly
if (require.main === module) {
  verifyDatabase().then(() => {
    console.log('✅ Database verification complete')
    process.exit(0)
  })
}


export { verifyDatabase }
