<script>
    import Aside from "../../Layout/Aside.svelte";
    import Header from "../../Layout/Header.svelte";
    import { activePage, session, axios } from "../../store.js";
    import { onDestroy, onMount } from "svelte";
    import { push, link } from "svelte-spa-router";

    let aseguradoras = []
    let citas = []
    let estadosCitas = []
    let modalidadesServicios = []
    let servicios = []
    let inpBuscarPacientes = ''
    let sltEstado = ''
    let sltServicio = ''
    let sltModalidad = ''
    let inpFechaInicio = ''
    let inpFechaFin = ''
    let sltAseguradora = ''

    function filtrar(obj){
        let a = new Object();
        for(const i in obj){
            if(obj[i] != null && obj[i]!=""){
                a[i] =obj[i]
            }
        }
        return a;
    }

    function btnFiltro() {
        jQuery("#filtroAvanzado").slideToggle(500);
    }

    function cargarServicios(){
        $axios.get(`/servicios`)
            .then(res => {
                servicios = res.data
            })
    }

    function cargarCitas(){
        let filtro = {
            servicioId: sltServicio,
            paciente: inpBuscarPacientes,
            aseguradoraId: sltAseguradora,
            fechaInicio: inpFechaInicio,
            fechaFin: inpFechaFin,
            estadoId: sltEstado,
            modalidadId: sltModalidad
        }
        let x =filtrar(filtro)
        
        let query = new URLSearchParams(x).toString()
        setTimeout(function(){
            $axios.get(`/citas?${query}`)
            .then(res => {
                citas = res.data
            })
        },1000)
    }

    function cargarModalidades(){
        $axios.get(`/modalidadesServicios`)
            .then(res => {
                modalidadesServicios = res.data
            })
    }

    function cargarEstados(){
        $axios.get(`/estadosCitas`)
            .then(res => {
                estadosCitas = res.data
            })
    }

    function cargarAseguradoras(){
        $axios.get(`/aseguradoras`)
            .then(res => {
                aseguradoras = res.data
            })
    }

    onMount(()=>{
        cargarModalidades()
        cargarServicios()
        cargarEstados()
        cargarAseguradoras()
        cargarCitas()
    })

  </script>
  
  <Aside />
  
  <main class="admin-main">
    <Header />
    <section class="admin-content">
      <div class="container-fluid mt-3">
        <div class="row">
            <div class="col-lg-3">
                <div class="card">
                    <div class="card-body">
                        <div class="form-group ">
                            <label class="font-secondary">Buscar paciente</label> 
                            <input type="search" bind:value={inpBuscarPacientes} on:input={() => cargarCitas()} class="form-control">
                        </div>
                        <div class="form-group ">
                            <label class="font-secondary">Estado</label> 
                            <select class="form-control" bind:value={sltEstado} on:change={() => cargarCitas()} style="width: 100%;" aria-hidden="true">
                                <option value="">Todas</option>
                                {#each estadosCitas as estado}
                                     <option value={estado.id}>{estado.descripcion}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="form-group ">
                            <label class="font-secondary">Servicio</label> 
                            <select class="form-control" bind:value={sltServicio} on:change={() => cargarCitas()} style="width: 100%;" aria-hidden="true">
                                <option value="">Todas</option>
                                {#each servicios as servicio}
                                    <option value={servicio.id}>{servicio.descripcion}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="form-group ">
                            <label class="font-secondary">Modalidad</label> 
                            <select class="form-control" bind:value={sltModalidad} on:change={() => cargarCitas()} style="width: 100%;" aria-hidden="true">
                                <option value="">Todas</option>
                                {#each modalidadesServicios as modalidad}
                                    <option value={modalidad.id}>{modalidad.descripcion}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="inputAddress2">Fecha inicio</label> 
                            <input type="date" bind:value={inpFechaInicio} on:change={() => cargarCitas()} class="form-control mb-2" id="inputAddress2">
                        </div>
                        <div class="form-group">
                            <label for="inputAddress2">Fecha fin</label> 
                            <input type="date" bind:value={inpFechaFin} on:change={() => cargarCitas()} class="form-control mb-2" id="inputAddress2">
                        </div>
                        <div class="form-group ">
                            <label class="font-secondary">Aseguradora</label> 
                            <select class="form-control" bind:value={sltAseguradora} on:change={() => cargarCitas()}>
                                <option value="">Todas</option>
                                {#each aseguradoras as aseguradora}
                                    <option value={aseguradora.id}>{aseguradora.nombre}</option>
                                {/each}
                            </select>
                        </div> 
                        <button class="btn btn-secondary btn-block" on:click={cargarCitas}>Limpiar</button>
                    </div>
                </div>
            </div>
            <div class="col-lg-9">
                <div class="row">
                    <div class="col-lg-12 text-right">
                        <a href="/Cita/CrearCita" use:link class="btn btn-outline-success btn-sm"><i class="mdi mdi-plus"></i> NUEVA CITA</a>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table align-td-middle table-card">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Cedula</th>
                                <th>Telefono</th>
                                <th>Estado</th>
                                <th>Servicio</th>
                                <th>Fecha</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each citas as cita}
                                <tr>
                                    <td>
                                        {cita.nombre} {cita.apellidos}
                                    </td>
                                    <td>{cita.cedula || 'N/A'}</td>
                                    <td>{cita.telefono}</td>
                                    <td>{cita.estado}</td>
                                    <td>{cita.servicio}</td>
                                    <td>{new Date(cita.fecha).toLocaleDateString('es-DO')}</td>
                                    <td>
                                        <a href="/Cita/DetalleCita/{cita.id}" use:link class="btn btn-success btn-sm">VER <i class="mdi mdi-send"></i></a>
                                    </td>
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

  <style>
    .modal-slide-right {
      top: 0;
      bottom: 0;
    }
  
    .modal-slide-right .modal-dialog {
      height: 100% !important;
      top: 0;
      position: fixed !important;
    }
  
    .modal-slide-right .modal-body {
      height: 100% !important;
      top: 0;
      overflow: auto;
    }
  </style>
  