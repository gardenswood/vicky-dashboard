export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

// POST /api/auth - login: receives idToken, creates session cookie
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    if (!idToken) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    // Verify the ID token and create a session cookie (14 days)
    const expiresIn = 60 * 60 * 24 * 14 * 1000
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

    const response = NextResponse.json({ success: true })
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
}

// DELETE /api/auth - logout
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('session')
  return response
}
