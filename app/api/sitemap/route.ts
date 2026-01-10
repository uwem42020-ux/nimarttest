// app/api/sitemap/route.ts - COMPLETE VERSION
import { NextResponse } from 'next/server'

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const SERVICE_TYPES = [
  'Mechanic', 'Electrician', 'Plumber', 'Carpenter', 'Painter',
  'Tailor', 'Cleaner', 'Chef'
]

export async function GET() {
  const baseUrl = 'https://nimart.ng'
  const today = new Date().toISOString().split('T')[0]
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

  // Static pages
  const staticPages = [
    { url: baseUrl, priority: 1.0, freq: 'daily' },
    { url: `${baseUrl}/marketplace`, priority: 0.9, freq: 'hourly' },
    { url: `${baseUrl}/login`, priority: 0.5, freq: 'monthly' },
    { url: `${baseUrl}/register`, priority: 0.5, freq: 'monthly' },
    { url: `${baseUrl}/provider/register`, priority: 0.8, freq: 'monthly' },
    { url: `${baseUrl}/about`, priority: 0.7, freq: 'monthly' },
    { url: `${baseUrl}/contact`, priority: 0.7, freq: 'monthly' },
    { url: `${baseUrl}/forgot-password`, priority: 0.3, freq: 'yearly' },
    { url: `${baseUrl}/reset-password`, priority: 0.3, freq: 'yearly' },
    { url: `${baseUrl}/verify`, priority: 0.3, freq: 'yearly' },
  ]

  // Add static pages
  staticPages.forEach(page => {
    xml += `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.freq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  })

  // Add service category pages
  SERVICE_TYPES.forEach(service => {
    const serviceSlug = service.toLowerCase()
    xml += `
  <url>
    <loc>${baseUrl}/marketplace?service=${encodeURIComponent(serviceSlug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  })

  // Add state pages
  NIGERIAN_STATES.forEach(state => {
    const stateSlug = state.toLowerCase().replace(/\s+/g, '-')
    
    // State-only page
    xml += `
  <url>
    <loc>${baseUrl}/marketplace?state=${encodeURIComponent(stateSlug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
    
    // State + Service combination pages
    SERVICE_TYPES.forEach(service => {
      const serviceSlug = service.toLowerCase()
      xml += `
  <url>
    <loc>${baseUrl}/marketplace?service=${encodeURIComponent(serviceSlug)}&amp;state=${encodeURIComponent(stateSlug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
    })
  })

  xml += '\n</urlset>'
  
  // Count URLs for logging
  const urlCount = (xml.match(/<loc>/g) || []).length
  console.log(`✅ Generated sitemap with ${urlCount} URLs`)

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}