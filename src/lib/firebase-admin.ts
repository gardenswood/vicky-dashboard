import { getApps, initializeApp, cert, getApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let adminApp: App | null = null

function getAdminApp(): App {
  if (adminApp) return adminApp

  if (getApps().find((a) => a.name === 'admin')) {
    adminApp = getApp('admin')
    return adminApp
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin: faltan variables de entorno FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL o FIREBASE_ADMIN_PRIVATE_KEY'
    )
  }

  adminApp = initializeApp(
    { credential: cert({ projectId, clientEmail, privateKey }) },
    'admin'
  )
  return adminApp
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}

// Backward-compat exports used in route handlers
export const adminAuth = {
  createSessionCookie: (...args: Parameters<Auth['createSessionCookie']>) =>
    getAdminAuth().createSessionCookie(...args),
  verifySessionCookie: (...args: Parameters<Auth['verifySessionCookie']>) =>
    getAdminAuth().verifySessionCookie(...args),
  createUser: (...args: Parameters<Auth['createUser']>) =>
    getAdminAuth().createUser(...args),
  setCustomUserClaims: (...args: Parameters<Auth['setCustomUserClaims']>) =>
    getAdminAuth().setCustomUserClaims(...args),
}

export const adminDb = {
  collection: (path: string) => getAdminDb().collection(path),
}
