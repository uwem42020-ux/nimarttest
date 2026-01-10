import Image from 'next/image'
import { ReactNode } from 'react'

export default function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="Nimart Logo" 
              width={200} 
              height={80}
              className="h-16 w-auto"
              priority
            />
          </div>
          <p className="text-gray-600">Nigeria's Service Marketplace</p>
        </div>
        {children}
      </div>
    </div>
  )
}