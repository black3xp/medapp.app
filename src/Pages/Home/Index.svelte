<script>
  import Aside from "../../Layout/Aside.svelte";
  import Header from "../../Layout/Header.svelte";
  import { activePage, session } from "../../store.js";
  import { onDestroy } from "svelte";
  import { push } from "svelte-spa-router";
  $activePage = "home.index";
  onDestroy(() => {
    $activePage = "";
  });
</script>

<Aside />

<main class="admin-main">
  <Header />
  <section class="admin-content">
    <div class="container mt-3">
      <div class="jumbotron jumbotron-fluid">
      
        <div class="row justify-content-center">
          <div class="col-4 container">
            <h1 class="display-4">Bienvenido</h1>
            <p>Al sistema de gestion de citas</p>
          </div>
        </div>

      </div>
    </div>
  </section>
</main>
