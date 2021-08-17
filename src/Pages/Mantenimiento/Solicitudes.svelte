<script>
    import Aside from "../../Layout/Aside.svelte";
    import Header from "../../Layout/Header.svelte";
    import { activePage, session, axios } from "../../store.js";
    import { onDestroy, onMount } from "svelte";
    import { push } from "svelte-spa-router";
    let activarSolicitudPCR = false
    let solicitudActiva = []
    let cargando = false
    
    function solicitudActivarPCR(){
        $axios.put(`/ajustes/${solicitudActiva.id}`, {solicitudPruebaInactiva: activarSolicitudPCR})
            .then(res => {
                console.log(res)
            })
    }
    function disponibilidad(){
        cargando = true
        $axios.get(`/ajustes`)
            .then(res => {
                solicitudActiva = res.data
                console.log(solicitudActiva)
                if(res.data.solicitudPruebaInactiva){
                    activarSolicitudPCR = false
                }else{
                    activarSolicitudPCR = true
                }
                cargando = false
            })
    }
    onMount(()=>{
        disponibilidad()
    })
  </script>
  
  <Aside />
  
  <main class="admin-main">
    <Header />
    <section class="admin-content">
      <div class="container mt-3">
        <h1>Solicitudes</h1>
        {#if cargando}
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-6">
                            <p class="font-flow" style="margin: 0"><strong>Activar solicitudes para pruebas PCR</strong></p>
                            <p class="font-flow" style="font-size: 12px; margin-bottom: 0; font-weight: lighter;">El formulario en la web para pruebas de PCR Covid-19 se desactivara y las personas no podran hacer mas solicitudes</p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
        {#if !cargando}
        <div class="card">
            <div class="card-body">
                <div class="row">
                    <div class="col-lg-6">
                        <p style="margin: 0"><strong>Activar solicitudes para pruebas PCR</strong></p>
                        <p style="font-size: 12px; margin-bottom: 0; font-weight: lighter;">El formulario en la web para pruebas de PCR Covid-19 se desactivara y las personas no podran hacer mas solicitudes</p>
                    </div>
                    <div class="col-lg-6 text-right">
                        <label class="cstm-switch">
                            <input type="checkbox" bind:checked={activarSolicitudPCR} on:click={solicitudActivarPCR} name="option" value="1" class="cstm-switch-input">
                            <span class="cstm-switch-indicator bg-success "></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
        {/if}
      </div>
    </section>
  </main>
  