<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { SyncClient } from '@vulppi/data-sync-client'

  let text: string
  let conn: SyncClient
  let unSub: (() => void)[] = []
  let store: any = null

  onMount(async () => {
    const {
      SyncClient,
      default: D,
      subscribe,
    } = await import('@vulppi/data-sync-client')
    conn = new SyncClient('ws://localhost:3333/sync')
    const [storeSync, leave] = conn.getData('docs:myDoc')
    unSub.push(leave)

    store = {
      subscribe: (run: (v: any) => void, invalidate?: (v?: any) => void) => {
        run(storeSync)
        return subscribe(storeSync, () => {
          run(storeSync)
        })
      },
      set: (v: any) => {
        console.log('set', v?.text)
        const dataKeys = Object.keys(storeSync)
        const vKeys = Object.keys(v)
        vKeys.forEach((key) => (storeSync[key] = v[key]))
        const toRemoveKeys = dataKeys.filter((key) => !vKeys.includes(key))
        toRemoveKeys.forEach((key) => delete storeSync[key])
      },
    }
  })

  onDestroy(() => {
    conn?.disconnect()
    unSub.forEach((u) => u())
  })
</script>

{#if store}
  <textarea rows="16" bind:value={$store.text} />
{/if}

<style>
  textarea {
    resize: none;
    font-size: 1rem;
  }
</style>
