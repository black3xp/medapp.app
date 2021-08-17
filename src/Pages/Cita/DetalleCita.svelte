<script>
    import Aside from "../../Layout/Aside.svelte";
    import Header from "../../Layout/Header.svelte";
    import { activePage, session } from "../../store.js";
    import { onDestroy, onMount } from "svelte";
    import { push } from "svelte-spa-router";
    export let params = {}
    
    onMount(()=>{
        console.log(params)
    })
  </script>
  
  <Aside />
  
  <main class="admin-main">
    <Header />
    <section class="admin-content">
      <div class="container-fluid mt-3">
        <h1>Cita id: {params.id}</h1>
      </div>
    </section>
  </main>
  