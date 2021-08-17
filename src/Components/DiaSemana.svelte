<script>
  import { createEventDispatcher } from 'svelte';
  import Horario from "./Horario.svelte";
  import Tanda from "./Tanda.svelte";

  export let item = {};
  export let tandas = {};
  export let horarios = {};
  export let medicoID = {};
  $: horariosFiltrados = horarios.filter(x => x.dia == item.dia);

  const dispatch = createEventDispatcher();
  
  const actualizar = function () {
    dispatch('cambioHorario')
  }
</script>

<style>
  .card.card-vnc {
    box-shadow: none;
    border: #687ae8 solid 1px;
  }
</style>

<div class="card m-b-30 card-vnc">
  <div class="card-header">
    <h5 class="m-b-0">
      <div
        class="custom-control custom-checkbox"
        style="margin-left: 15px; padding-left: 0;">
        <input
          type="checkbox"
          class="custom-control-input"
          id={item.dia}
          bind:checked={item.check}
          disabled />
        <label class="custom-control-label" for={item.dia}>{item.nombre}</label>
      </div>
    </h5>
  </div>
  <div class="card-body">
    <div class="row">
      {#each tandas as i}
        <Tanda on:cambioHorario={actualizar} {i} {horarios} dia={item.dia} {medicoID}/>
      {/each}
    </div>

    {#each horariosFiltrados as horario}
      <Horario on:cambioHorario={actualizar} {horario} />
    {/each}

  </div>
</div>
