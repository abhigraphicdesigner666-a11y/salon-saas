import { NextResponse } from 'next/server'
import { DEMO_MODE, APP_VERSION } from '@/lib/constants'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    database: 'connected',
    demo_mode: DEMO_MODE,
    uptime_seconds: process.uptime()
  }, { status: 200 })
}
