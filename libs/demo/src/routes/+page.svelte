<script lang="ts">
  import '$lib/styles/common.css'

  import MessageBox from '$lib/components/MessageBox.svelte'
</script>

<main>
  <MessageBox />
  <MessageBox />
</main>

<style>
  main {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding: 1rem;
  }
</style>
