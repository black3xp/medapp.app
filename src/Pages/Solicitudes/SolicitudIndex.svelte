<script>
    import Aside from "../../Layout/Aside.svelte";
    import Header from "../../Layout/Header.svelte";
    import { activePage, session, axios } from "../../store.js";
    import { onDestroy, onMount } from "svelte";
    import { push, link } from "svelte-spa-router";
    import Loading from '../../Components/Loading.svelte'

    let solicitudes = []
    let sltAseguradora = ''
    let sltEstado = 'N'
    let inpBusqueda = ''
    let inpNumeroSolicitud = ''
    let inpFechaInicio = '' //new Date().toISOString().split('T')[0]
    let inpFechaFin = '' //new Date().toISOString().split('T')[0]
    let aseguradoras = []
    let cargando = false
    let estados = []

    function filtrar(obj){
        let a = new Object();
        for(const i in obj){
            if(obj[i] != null && obj[i]!=""){
            a[i] =obj[i]
            }
        }
        return a;
    }

    function cargarSolicitudes(){
        cargando = true
        let filtro = {
            Aseguradora: sltAseguradora,
            Estado: sltEstado,
            Busqueda: inpBusqueda,
            NumeroSolicitud: inpNumeroSolicitud,
            FechaInicio: inpFechaInicio,
            FechaFin: inpFechaFin
        }
        let x =filtrar(filtro)
        
        let query = new URLSearchParams(x).toString()

        setTimeout(function(){
            $axios.get(`/solicitudes?${query}`)
            .then(res => {
                solicitudes = res.data
                cargando = false
            })
        }, 1000)
        
    }

    function cargarAseguradoras(){
            $axios.get(`/aseguradoras`)
                .then(res =>{
                aseguradoras = res.data
            })
    }

    function cargarEstados(){
            $axios.get(`/estadossolicitud`)
                .then(res =>{
                estados = res.data
            })
    }

    onMount(()=>{
        cargarSolicitudes()
        cargarAseguradoras()
        cargarEstados()
    })
  </script>
  
  <Aside />
  
  <main class="admin-main">
    <Header />
    <section class="admin-content">
        <div class="container-fluid mt-3">
            <h4>Solicitudes</h4><hr>
            <div class="row">
            <div class="col-lg-12">
                    <div class="form-row">
                        <div class="mb-3 col-lg-3 col-md-4">
                            <label for="">Buscar pacientes</label>
                            <input type="search" bind:value={inpBusqueda} on:input={cargarSolicitudes} class="form-control form-control-sm" placeholder="nombre, cedula, etc.">
                        </div>
                        <div class="mb-3 col-lg-3 col-md-4">
                            <label for="">No. solicitud</label>
                            <input type="search" bind:value={inpNumeroSolicitud} on:input={cargarSolicitudes} class="form-control form-control-sm" placeholder="Buscar numero solicitud">
                        </div>
                        <div class="mb-3 col-lg-2 col-md-4">
                            <label for="">Por estados</label>
                            <select class="form-control form-control-sm" bind:value={sltEstado} on:change={cargarSolicitudes}>
                                <option value=""> - estados - </option>
                                {#each estados as estado}
                                <option value={estado.id}>{estado.descripcion}</option>
                                     <!-- content here -->
                                {/each}
                            </select>
                        </div>
                        <div class="mb-3 col-lg-2 col-md-4">
                            <label for="">Fecha inicio</label>
                            <input type="date" bind:value={inpFechaInicio} on:change={cargarSolicitudes} class="form-control form-control-sm">
                        </div>
                        <div class="mb-3 col-lg-2 col-md-4">
                            <label for="">Fecha fin</label>
                            <input type="date" bind:value={inpFechaFin} on:change={cargarSolicitudes} class="form-control form-control-sm">
                        </div>
                    </div>
                </div>
            </div>
            <div class="card m-b-30">
                <div class="card-header">
                    <!-- <h5 class="card-title m-b-0">Solicitudes </h5> -->
                    {#if cargando}
                         <div class="col-1">
                            <Loading />
                         </div>
                    {/if}
                    <div class="card-controls">
                        <a href="#!" on:click={cargarSolicitudes} class="js-card-refresh icon"></a>
                        <div class="dropdown">
                            <a href="#!" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <i class="icon mdi  mdi-dots-vertical"></i> </a>

                            <div class="dropdown-menu dropdown-menu-right">
                                <button class="dropdown-item" type="button">Action</button>
                                <button class="dropdown-item" type="button">Another action</button>
                                <button class="dropdown-item" type="button">Something else here</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive mt-3">

                        <table class="table table-hover">
                            <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>No. Solicitud</th>
                                <th>Cedula</th>
                                <th>No. Seguro</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                                {#each solicitudes as solicitud}
                                     <tr>
                                         <td>{solicitud.nombre} {solicitud.apellidos}</td>
                                         <td>{solicitud.codigo}</td>
                                         <td>{solicitud.cedula || 'N/A'}</td>
                                         <td>{solicitud.numeroAsegurado || 'N/A'}</td>
                                         <td>{new Date(solicitud.createdAt).toLocaleString('es-DO')}</td>
                                         <td><span class="badge" class:badge-primary={solicitud.estadoId == 'N'} class:badge-success={solicitud.estadoId == 'F'}>{solicitud.estadoId}</span></td>
                                         <td><a href="/Solicitud/Detalle/{solicitud.id}" use:link class="btn btn-outline-success btn-sm">VER <i class="mdi mdi-send"></i></a></td>
                                     </tr>                       
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    </section>
  </main>
  