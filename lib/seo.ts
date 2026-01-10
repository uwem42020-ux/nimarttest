// lib/seo.ts - COMPLETE VERSION
interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export function generateSEOMetadata({
  title,
  description,
  keywords = [],
  url = 'https://nimart.ng',
  image = '/og-image.png',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
}: SEOProps) {
  const fullTitle = title.includes('Nimart') ? title : `${title} | Nimart`;
  const fullUrl = url.startsWith('http') ? url : `https://nimart.ng${url}`;
  const fullImage = image.startsWith('http') ? image : `https://nimart.ng${image}`;
  
  const metadata: any = {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: 'Nimart',
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      type,
      locale: 'en_NG',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [fullImage],
      site: '@nimartng',
      creator: '@nimartng',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: fullUrl,
    },
  };

  // Add optional Open Graph properties
  if (author) {
    metadata.openGraph.authors = [author];
  }
  if (publishedTime) {
    metadata.openGraph.publishedTime = publishedTime;
  }
  if (modifiedTime) {
    metadata.openGraph.modifiedTime = modifiedTime;
  }

  return metadata;
}

// Homepage SEO
export function generateHomepageSEO() {
  return generateSEOMetadata({
    title: 'Nimart - Nigeria\'s #1 Service Marketplace | Find Verified Professionals',
    description: 'Find trusted and verified service providers in Nigeria. Connect with mechanics, electricians, plumbers, carpenters, painters, tailors, cleaners, chefs, and 50+ other services.',
    keywords: [
      'Nimart', 'service providers Nigeria', 'mechanics near me', 'electricians near me',
      'plumbers near me', 'carpenters near me', 'painters near me', 'tailors near me',
      'cleaners near me', 'chefs near me', 'service marketplace', 'Nigeria services',
      'verified professionals', 'home services', 'professional services',
    ],
    url: 'https://nimart.ng',
    image: '/og-image.png',
  });
}

// Provider SEO
export function generateProviderSEO(provider: any) {
  const providerImage = provider.profile_picture_url || '/default-provider.png';
  const location = provider.states?.[0]?.name || 'Nigeria';
  const experienceText = provider.years_experience ? `${provider.years_experience} years experience` : 'Professional';
  
  return generateSEOMetadata({
    title: `${provider.business_name} | ${provider.service_type} in ${location} | Nimart`,
    description: provider.bio || `${experienceText} ${provider.service_type} in ${location}. ${provider.is_verified ? 'Verified and trusted professional.' : ''} Book now on Nimart.`,
    keywords: [
      provider.business_name,
      provider.service_type,
      `${provider.service_type} in ${location}`,
      'service provider',
      'Nigeria',
      location,
      'nimart',
      'professional services',
      provider.service_type.toLowerCase(),
    ],
    url: `/providers/${provider.id}`,
    image: providerImage,
    type: 'profile',
  });
}

// Marketplace SEO
export function generateMarketplaceSEO(filters?: { service?: string; state?: string }) {
  let title = 'Service Marketplace | Find Professionals | Nimart';
  let description = 'Browse and find verified service providers in Nigeria. All categories available.';
  
  if (filters?.service) {
    const serviceName = filters.service.charAt(0).toUpperCase() + filters.service.slice(1);
    title = `${serviceName}s in Nigeria | Find ${serviceName}s | Nimart`;
    description = `Find and hire verified ${serviceName.toLowerCase()}s in Nigeria. Compare ratings, prices, and availability.`;
  }
  
  if (filters?.state) {
    const stateName = filters.state.charAt(0).toUpperCase() + filters.state.slice(1);
    if (filters?.service) {
      const serviceName = filters.service.charAt(0).toUpperCase() + filters.service.slice(1);
      title = `${serviceName}s in ${stateName} | Local ${serviceName}s | Nimart`;
      description = `Find and hire verified ${serviceName.toLowerCase()}s in ${stateName}. Local professionals near you.`;
    } else {
      title = `Service Providers in ${stateName} | Nimart`;
      description = `Find verified service providers in ${stateName}, Nigeria. All service categories available.`;
    }
  }
  
  const keywords = filters?.service 
    ? [`${filters.service}s in Nigeria`, `${filters.service} services`, `${filters.service} near me`]
    : ['service marketplace', 'find professionals', 'hire services Nigeria'];
    
  if (filters?.state) {
    keywords.push(`${filters.state} service providers`, `services in ${filters.state}`);
  }
  
  return generateSEOMetadata({
    title,
    description,
    keywords: [
      ...keywords,
      'Nimart',
      'service providers',
      'verified professionals',
    ],
    url: filters?.service || filters?.state ? `/marketplace?${new URLSearchParams(filters as any).toString()}` : '/marketplace',
    image: '/og-marketplace.png',
  });
}

// Structured Data generators
export function generateStructuredData(type: 'Organization' | 'Service' | 'WebSite' | 'LocalBusiness' | 'Person', data?: any) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
    name: 'Nimart',
    description: "Nigeria's premier service marketplace connecting customers with trusted professionals",
    url: 'https://nimart.ng',
    logo: 'https://nimart.ng/logo.png',
    sameAs: [
      'https://facebook.com/nimart',
      'https://instagram.com/nimart',
      'https://twitter.com/nimartng',
      'https://youtube.com/@nimart'
    ],
  };

  switch (type) {
    case 'Organization':
      return {
        ...baseData,
        '@type': 'Organization',
        foundingDate: '2024',
        foundingLocation: 'Nigeria',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'NG',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: 'info@nimart.ng',
          telephone: '+2348038887589',
        },
      };
      
    case 'Service':
      return {
        ...baseData,
        '@type': 'Service',
        serviceType: data?.serviceType || [
          'Mechanics',
          'Electricians',
          'Plumbers',
          'Carpenters',
          'Painters',
          'Tailors',
          'Cleaners',
          'Chefs',
        ],
        areaServed: {
          '@type': 'Country',
          name: 'Nigeria',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'NGN',
        },
        ...data,
      };
      
    case 'WebSite':
      return {
        ...baseData,
        '@type': 'WebSite',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://nimart.ng/marketplace?search={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      };
      
    case 'LocalBusiness':
      return {
        ...baseData,
        '@type': 'LocalBusiness',
        name: data?.business_name || 'Nimart Marketplace',
        image: data?.profile_picture_url || 'https://nimart.ng/logo.png',
        telephone: data?.phone || '+2348038887589',
        address: {
          '@type': 'PostalAddress',
          addressLocality: data?.states?.[0]?.name || 'Nigeria',
          addressRegion: data?.states?.[0]?.name || 'NG',
          addressCountry: 'NG',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: data?.latitude || 9.081999,
          longitude: data?.longitude || 8.675277,
        },
        openingHours: 'Mo-Su 08:00-20:00',
        priceRange: '₦₦',
        ...data,
      };
      
    case 'Person':
      return {
        ...baseData,
        '@type': 'Person',
        name: data?.name || 'Service Provider',
        jobTitle: data?.service_type || 'Professional',
        worksFor: {
          '@type': 'Organization',
          name: 'Nimart',
        },
        ...data,
      };
      
    default:
      return baseData;
  }
}

// Generate Breadcrumb structured data
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `https://nimart.ng${item.url}`,
    })),
  };
}

// FAQ Schema generator
export function generateFAQSchema(questions: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

// Service Category SEO
export function generateServiceCategorySEO(category: any) {
  return generateSEOMetadata({
    title: `${category.name} Services in Nigeria | Find ${category.name}s | Nimart`,
    description: category.description || `Find and hire verified ${category.name.toLowerCase()}s in Nigeria. Professional ${category.name.toLowerCase()} services near you.`,
    keywords: [
      `${category.name} services`,
      `${category.name.toLowerCase()} near me`,
      `${category.name} in Nigeria`,
      `hire ${category.name.toLowerCase()}`,
      `${category.name} professionals`,
      'Nimart',
    ],
    url: `/marketplace?service=${encodeURIComponent(category.name.toLowerCase())}`,
    image: '/og-category.png',
  });
}