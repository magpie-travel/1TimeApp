#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, mkdirSync, copyFileSync } from 'fs'

console.log('🚀 Building application...')

try {
  // Create dist directory
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true })
  }
  if (!existsSync('dist/public')) {
    mkdirSync('dist/public', { recursive: true })
  }

  console.log('📦 Copying config files...')
  
  // Copy config files to client directory if they don't exist
  if (!existsSync('client/tailwind.config.ts')) {
    copyFileSync('tailwind.config.ts', 'client/tailwind.config.ts')
  }
  if (!existsSync('client/postcss.config.js')) {
    copyFileSync('postcss.config.js', 'client/postcss.config.js')
  }

  console.log('🔧 Building frontend...')
  
  // Use the root vite config which has proper setup
  execSync('npx vite build', { 
    stdio: 'inherit' 
  })

  console.log('🔧 Building backend...')
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18', { 
    stdio: 'inherit' 
  })

  console.log('✅ Build completed successfully!')
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}