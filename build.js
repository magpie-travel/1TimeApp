#!/usr/bin/env node

import { build } from 'vite'
import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'

console.log('🚀 Building application...')

async function buildApp() {
  try {
    // Create dist directory
    if (!existsSync('dist')) {
      mkdirSync('dist', { recursive: true })
    }
    if (!existsSync('dist/public')) {
      mkdirSync('dist/public', { recursive: true })
    }

    console.log('📦 Building frontend...')
    
    // Build frontend with explicit configuration
    await build({
      root: process.cwd() + '/client',
      build: {
        outDir: process.cwd() + '/dist/public',
        emptyOutDir: true,
        rollupOptions: {
          input: process.cwd() + '/client/index.html'
        }
      },
      resolve: {
        alias: {
          '@': process.cwd() + '/client/src',
          '@shared': process.cwd() + '/shared',
          '@assets': process.cwd() + '/attached_assets'
        }
      }
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
}

buildApp()