# Vulppi React Hooks for firebase

## useFirestoreDoc

```tsx
const Component: React.FC = () => {
  const { data, ref, snap, loading } = useFirestoreDoc<DocType>(
    'collection/doc-id',
    {
      block: false,
      dependencies: ['foo'],
      parser: (data) => data,
      fallback: {}, // default value in data
    },
  )

  return <></>
}
```

## useFirestoreCollection

```tsx
const Component: React.FC = () => {
  const { data, ref, snap, loading } = useFirestoreCollection<DocType>(
    'collection',
    {
      block: false,
      dependencies: ['foo'],
      parser: (data) => data,
      fallback: [], // default value in data
      filter: (ref) =>
        query(ref, where('createdAt', '<=', new Date()), limit(10)),
    },
  )

  return <></>
}
```

## CLient side functions (firebase)

### Load client service

```ts
import { createFirebaseClientService } from '@vulppi/use-firebase/client'

export const { app, db, auth } = createFirebaseClientService(
  firebaseClientCredentials,
)
```

## Server side functions (firebase-admin)

### Load static contents

```ts
import { createFirebaseAdminApp } from '@vulppi/use-firebase/admin'

export const { app, db, auth, getStaticContent, getStaticContents } =
  createFirebaseAdminApp(firebaseAdminCredentials)

// using

const snapDoc = getStaticContent<DocType>('collection', 'doc-id')
const snapCollection = getStaticContents('collection', (query) =>
  query.where('createdAt', '>=', new Date()).limit(10),
)
```

### Update custom claims for users

_claims in firestore collection `users/{uid}/claims`_

```ts
const test = await handleRefreshClaims(FirebaseAdminApp, 'uid')
```
