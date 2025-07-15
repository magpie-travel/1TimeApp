#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

console.log('🚀 Building application manually...')

try {
  // Create dist directory structure
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true })
  }
  if (!existsSync('dist/public')) {
    mkdirSync('dist/public', { recursive: true })
  }

  console.log('📦 Setting up build environment...')
  
  // Create a temporary build directory in client
  const tempBuildDir = path.join('client', 'dist')
  if (!existsSync(tempBuildDir)) {
    mkdirSync(tempBuildDir, { recursive: true })
  }

  // Copy necessary config files to client if they don't exist
  if (!existsSync('client/tailwind.config.ts')) {
    copyFileSync('tailwind.config.ts', 'client/tailwind.config.ts')
  }
  if (!existsSync('client/postcss.config.js')) {
    copyFileSync('postcss.config.js', 'client/postcss.config.js')
  }

  console.log('🔧 Building frontend in client directory...')
  
  // Build from within client directory using its own vite config
  execSync('cd client && npx vite build --outDir dist', { 
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('📂 Moving build files to dist/public...')
  
  // Move files from client/dist to dist/public
  execSync('cp -r client/dist/* dist/public/', { 
    stdio: 'inherit' 
  })

  console.log('🔧 Building backend...')
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18', { 
    stdio: 'inherit' 
  })

  console.log('🧹 Cleaning up temp files...')
  execSync('rm -rf client/dist', { stdio: 'inherit' })

  console.log('✅ Build completed successfully!')
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}