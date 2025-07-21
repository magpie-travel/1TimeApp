#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

console.log('🚀 Building application...')

try {
  // Create dist directory
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true })
  }
  if (!existsSync('dist/public')) {
    mkdirSync('dist/public', { recursive: true })
  }

  console.log('📦 Building frontend...')
  
  // Build frontend using vite CLI with explicit paths
  const clientPath = path.resolve(process.cwd(), 'client')
  const outputPath = path.resolve(process.cwd(), 'dist/public')
  
  execSync(`cd ${clientPath} && npx vite build --outDir ${outputPath}`, { 
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