import { getApp, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export interface FirebaseClientCredentials {
  apiKey: string
  authDomain: string
  databaseURL: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

export function createFirebaseClientApp(
  config: FirebaseClientCredentials,
  name?: string,
) {
  try {
    return getApp(name)
  } catch (err) {
    return initializeApp(config, name)
  }
}

export function createFirebaseClientService(
  config: FirebaseClientCredentials,
  name?: string,
) {
  const app = createFirebaseClientApp(config, name)
  const db = getFirestore(app)
  const auth = getAuth(app)

  return {
    app,
    db,
    auth,
  }
}
