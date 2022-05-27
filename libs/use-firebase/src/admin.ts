import type { ServiceAccount } from 'firebase-admin'
import { App, cert, getApp, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import {
  CollectionReference,
  DocumentReference,
  getFirestore,
  Query,
} from 'firebase-admin/firestore'

type O = Record<string, string>
type QueryCB<E extends O> = (query: CollectionReference<E>) => Query<E>

type DataType<E> = {
  id: string
} & E

export interface FirebaseAdminCredentials {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
}

export function createFirebaseAdminApp(
  config: FirebaseAdminCredentials,
  name?: string,
) {
  try {
    return getApp(name)
  } catch (err) {
    return initializeApp(
      {
        credential: cert(config as ServiceAccount),
        databaseURL: `https://${config.project_id}.firebaseio.com`,
      },
      name,
    )
  }
}

export function createFirebaseAdminService(
  config: FirebaseAdminCredentials,
  name?: string,
) {
  const app = createFirebaseAdminApp(config, name)
  const db = getFirestore(app)
  const auth = getAuth(app)

  return {
    app,
    db,
    auth,
    async getStaticContent<E extends O>(collectionName: string, id: string) {
      const doc = db.doc(`${collectionName}/${id}`) as DocumentReference<E>
      const docData = await doc.get()
      return {
        id: docData.id,
        ...(docData.data() || {}),
      } as DataType<E>
    },
    async getStaticContents<E extends O>(
      collectionName: string,
      query?: QueryCB<E>,
    ) {
      const col = db.collection(collectionName) as CollectionReference<E>
      const q = (query && query(col)) || col
      const snap = await q.get()

      return snap.docs.map<E>((doc) => {
        return {
          id: doc.id,
          ...doc.data(),
        } as DataType<E>
      })
    },
  }
}

export async function handleRefreshClaims(
  app: App,
  uid: string,
): Promise<boolean> {
  try {
    const auth = getAuth(app)
    const db = getFirestore(app)
    const userClaimsRef = db.collection(`users/${uid}/claims`)
    const claimsSnap = await userClaimsRef.get()
    const customClaims: Record<string, any> = {}
    claimsSnap.docs.forEach((d) => {
      customClaims[d.id] = d.data()
    })
    await auth.setCustomUserClaims(uid, customClaims)
    return true
  } catch (err) {
    return false
  }
}
