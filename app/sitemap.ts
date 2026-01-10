// app/sitemap.ts
import { MetadataRoute } from 'next'

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const SERVICE_CATEGORIES = [
  'Mechanics', 'Electricians', 'Plumbers', 'Carpenters', 'Painters',
  'Tailors', 'Cleaners', 'Chefs', 'Drivers', 'Gardeners', 'Security',
  'Makeup Artists', 'Photographers', 'Videographers', 'Tutors',
  'IT Support', 'Web Developers', 'Graphic Designers', 'Accountants',
  'Lawyers', 'Doctors', 'Nurses', 'Fitness Trainers', 'Caterers',
  'Event Planners', 'Interior Designers', 'Architects', 'Builders'
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nimart.ng'
  const currentDate = new Date()
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: currentDate,
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/provider/register`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]
  
  // Service category pages
  const servicePages = SERVICE_CATEGORIES.map(service => ({
    url: `${baseUrl}/marketplace?service=${encodeURIComponent(service.toLowerCase().replace(/\s+/g, '-'))}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))
  
  // State pages
  const statePages = NIGERIAN_STATES.map(state => ({
    url: `${baseUrl}/marketplace?state=${encodeURIComponent(state.toLowerCase().replace(/\s+/g, '-'))}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))
  
  // Combine all (limit to 5000 URLs for sitemap limits)
  const allUrls = [
    ...staticPages,
    ...servicePages,
    ...statePages,
  ]
  
  return allUrls.slice(0, 5000)
}