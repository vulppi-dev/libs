import {
  collection,
  CollectionReference,
  doc,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  onSnapshot,
  Query,
  QuerySnapshot,
} from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'

type WithId<T> = T & { id: string }

interface DocOptionsProps<T> {
  dependencies?: any[]
  block?: boolean
  parser?: (value: WithId<DocumentData>) => WithId<T>
  fallback?: T | WithId<T>
}

interface CollectionOptionsProps<T> {
  dependencies?: any[]
  block?: boolean
  filter?: (ref: CollectionReference<T>) => Query<T> | CollectionReference<T>
  parser?: (value: WithId<DocumentData>) => WithId<T>
  fallback?: WithId<T>[]
}

const autoFallback = <T extends any>(fb?: T) => fb ?? (((e: any) => e) as T)

export function useFirestoreDoc<T = DocumentData>(
  db: Firestore,
  path: string,
  options?: DocOptionsProps<T>,
) {
  const [loading, setLoading] = useState(true)
  const [snap, setSnap] = useState<DocumentSnapshot<T> | null>(null)
  const [data, setData] = useState<T | WithId<T> | null>(
    options?.fallback || null,
  )
  const segments = useMemo(
    () => path.replace(/^\//, '').replace(/\/$/, '').split('/'),
    [path],
  )
  const ref = useMemo(() => {
    if (
      !!(segments.length % 2) ||
      segments.includes('') ||
      segments.includes('undefined') ||
      segments.includes('null')
    )
      return null
    return doc(db, path) as DocumentReference<T>
  }, [path, segments.length])
  const parser = options?.parser || ((e: any) => e)

  useEffect(() => {
    setData(null)
    setSnap(null)
    if (!ref || options?.block) return

    const unregister = onSnapshot(ref, (snap) => {
      setLoading(false)
      setSnap(snap as any)
      if (snap.exists())
        setData(parser({ ...(snap.data() || {}), id: snap.id }))
      else setData(options?.fallback || null)
    })

    return () => unregister()
  }, [path, ref].concat(options?.dependencies || []))

  return { data, snap, ref, loading }
}

export function useFirestoreCollection<T = DocumentData>(
  db: Firestore,
  path: string,
  options?: CollectionOptionsProps<T>,
) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<WithId<T>[] | null>(
    options?.fallback || null,
  )
  const [snap, setSnap] = useState<QuerySnapshot<T> | null>(null)
  const segments = useMemo(
    () => path.replace(/^\//, '').replace(/\/$/, '').split('/'),
    [path],
  )
  const ref = useMemo(() => {
    if (
      !(segments.length % 2) ||
      segments.includes('') ||
      segments.includes('undefined') ||
      segments.includes('null')
    )
      return null
    return collection(db, path) as CollectionReference<T>
  }, [path, segments.length])
  const filter = autoFallback(options?.filter)
  const parser = autoFallback(options?.parser)

  useEffect(() => {
    setData(null)
    setSnap(null)
    if (!ref || options?.block) return

    const unregister = onSnapshot(filter(ref), (snap) => {
      setLoading(false)
      setSnap(snap as any)
      if (!snap.empty)
        setData(snap.docs.map((d) => parser({ ...(d.data() || {}), id: d.id })))
      else setData(options?.fallback || null)
    })

    return () => unregister()
  }, [path, ref].concat(options?.dependencies || []))

  return { data, snap, ref, loading }
}
