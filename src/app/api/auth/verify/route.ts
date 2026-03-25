export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value
  if (!sessionCookie) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    return NextResponse.json({ uid: decoded.uid, email: decoded.email, role: decoded.role ?? 'viewer' })
  } catch {
    return NextResponse.json({ error: 'Session inválida' }, { status: 401 })
  }
}
