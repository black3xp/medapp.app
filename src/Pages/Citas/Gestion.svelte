<script>
  import Aside from "../../Layout/Aside.svelte";
  import Header from "../../Layout/Header.svelte";
  import { connection, activePage, session, axios, dataCita, errorConexion, toast }
    from "../../store.js";
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import moment from "moment";
  import Swal from 'sweetalert2';
  let citas = [];
  let buscarPaciente = ''
  let tiempoRecarga = 1.8e+6;
  let fechaInicio = new Date().toISOString().split('T')[0]
  let fechaFin = new Date().toISOString().split('T')[0]
  let estados = []
  let sltEstado = ""
  let detallesCita = []
  let pacienteModal = []
  let consultorios = []
  let sltConsultorios = ""

  $axios.defaults.headers.common = {
        Authorization: $session.authorizationHeader.Authorization
    };
  $activePage = "citasProgramadas";

  onMount(() => {
    cargarConsultorios()
    moment.locale('es-DO');
    setInterval(()=>{
      cargarCitas()
      console.log('Refrescando')
    },tiempoRecarga)
    cargarEstados()
  });

  function filtroObjeto(obj){
    let a = new Object()
    for (const i in obj) {
      if(obj[i] != null && obj[i] != ""){
        a[i] = obj[i]
      }
    }
    return a
  }

  function colorEstado(code) {
    if (code == 'p') {
      return 'badge-secondary';
    }
    if (code == 't') {
      return 'badge-primary';
    }
    if (code == 'Nueva') {
      return 'badge-success';
    }
    if (code == 'Cancelada / Renegada') {
      return 'badge-danger';
    }
  }

  function cargarConsultorios(){
    $axios.get(`users/consultorios`)
    .then(res => {
      consultorios = res.data
      sltConsultorios = consultorios[0].consultorioId
      cargarCitas()
    })
  }

  function cambiarEstado(idCita, estado){
    switch (estado) {
      case 'eliminar':
      Swal.fire({
          title: 'Estas seguro?',
          text: "Estas a punto de cancelar una cita!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Si!',
          cancelButtonText: 'No'
        }).then((result) => {
          if (result.isConfirmed) {
            $axios.put(`/citas/${idCita}/establecerEstado`, {estadoId: 'X'})
            .then(res => {
              cargarCitas()
              Swal.fire(
                'Cancelada!',
                'La cita se ha cancelado con exito',
                'success'
              )
            })
          }
        })
          
        break;
      case 'confirmar':

        break;
    
      default:
        break;
    }
    
  }

  function editarPaciente(idCita){
    $axios.get(`citas/${idCita}`)
    .then(res => {
      detallesCita = res.data
      pacienteModal = res.data.paciente
    })
  }

  function cargarEstados(){
    $axios.get('estadosCita')
    .then(res =>{
      estados = res.data
    })
  }


  function cargarCitas() {
    let filtro = {
        consultorioId: sltConsultorios,
        paciente: buscarPaciente,
        aseguradoraId: null,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        estadoId: sltEstado
      }
    let filtrado = filtroObjeto(filtro)
    let qs = new URLSearchParams(filtrado).toString()
    setTimeout(() => {
      $axios.get("citas?" + qs)
      .then(res => {
        citas = res.data;
      })
      .catch(err => {
        console.error(err);
        $errorConexion()
      });
    }, 1000)
  }
  
  function btnFiltro() {
    jQuery("#filtroAvanzado").slideToggle(500);
  }

</script>

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

<Aside />

<main class="admin-main">
  <Header />
  <section class="admin-content">
    <div class="container mt-3">
      <div class="col-md-12">
        <div class="row">

          <div class="col-lg-4 mt-2">
            <label>Buscar por paciente</label>
            <input type="text" class="form-control" bind:value={buscarPaciente} on:input={cargarCitas} placeholder="Buscar paciente">
          </div>

          <div class="col-lg-3 col-md-3 mt-2">
            <label>Desde</label>
            <input type="date" class="form-control" bind:value={fechaInicio} on:input={cargarCitas}>
          </div>
          <div class="col-lg-3 col-md-3 mt-2">
            <label>Hasta</label>
            <input type="date" class="form-control" bind:value={fechaFin} on:input={cargarCitas}>
          </div>
          
          <div class="col-lg-2">
            <button class="btn btn-primary" id="btnFiltro" on:click={btnFiltro} style="margin-top: 38px;">Filtros</button>
          </div>
          <div id="filtroAvanzado" class="col-lg-12 mt-2" style="display: none;">
              <div class="alert alert-secondary">
                <div class="row">
                  <div class="col-lg-4">
                    <label>Especialista</label>
                    <select class="form-control" id="sltMedicos" bind:value={sltConsultorios} on:change={cargarCitas} style="width: 100%">
                        {#each consultorios as consultorio}
                           <!-- content here -->
                           <option value={consultorio.consultorioId}>{consultorio.consultorio}</option>
                        {/each}
                    </select>
                  </div>
                  <div class="col-lg-3 col-md-6">
                    <label>Estados</label>
                    <select class="form-control" bind:value={sltEstado} on:change={cargarCitas}>
                      <option value="" disabled selected>- Buscar por estado -</option>
                      <option value={""}>Todos</option>
                        {#each estados as estado}
                           <!-- content here -->
                           <option value={estado.id}>{estado.descripcion}</option>
                        {/each}
                    </select>
                  </div>
                </div>
              </div>
          </div>

          <div class="col-md-12 mt-3">
            <div class="alert alert-primary" role="alert">
                {#if !citas}
                   <!-- content here -->
                   <h4 >No hay cita</h4>
                {/if}

              <div class="table-responsive">
                {#if citas}
                   <!-- content here -->
                   <table class="table align-td-middle table-card">
                     <thead>
                       <tr>
                         <th>Nombre</th>
                         <th>Estado</th>
                         <th>Fecha</th>
                         <th>Hora</th>
                         <th>Celular</th>
                         <th />
                       </tr>
                     </thead>
                     <tbody>
                       {#each citas as cita}
                          <!-- content here -->
                          <tr class="cursor-table">
                            <td>{cita.nombre} {cita.apellidos}</td>
                            <td>
                              <span class="badge {colorEstado(cita.estado)}">{cita.estado}</span>
                            </td>
                            <td>{new Date(cita.fecha).toLocaleDateString('es-DO')}</td>
                            <td>{new Date(cita.fecha).toLocaleTimeString('es-DO')}</td>
                            <td>{cita.celular}</td>
                            <td />
                            <td style="text-align: right;">
                              <button
                                class="btn btn-success btn-sm mb-1"
                                data-toggle="modal"
                                data-target="#modalPaciente" 
                                on:click={() => editarPaciente(cita.id)}>
                                <i class="mdi mdi-account-search-outline" />
                                Ver cita
                              </button>
  
                              <!-- <button
                                class="btn btn-success btn-sm mb-1"
                                data-toggle="modal"
                                data-target="#modalCambiarCita" >
                                <i class="mdi mdi-calendar-remove" /> Cambiar cita
                              </button> -->

                              {#if cita.estadoId !== "X"}
                                <button
                                class="btn btn-danger btn-sm mb-1"
                                on:click={() => cambiarEstado(cita.id, 'eliminar')}>
                                <i class="mdi mdi-close"></i>
                              </button>
                              {/if}
  
                            </td>
                          </tr>
                          {:else}
                          <div class="col-12">
                            No hay resultados
                          </div>
                       {/each}
 
                     </tbody>
                   </table>
                {/if}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>
</main>

<form id="frmPaciente" >
<div
  class="modal fade modal-slide-right"
  id="modalPaciente"
  tabindex="-1"
  role="dialog"
  aria-labelledby="modalPacienteLabel"
  style="display: none; padding-right: 16px;"
  aria-modal="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modalPacienteLabel">
          <i class="mdi mdi-account-search-outline" />
          Paciente
        </h5>
        <button
          type="button"
          class="close"
          data-dismiss="modal"
          aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div class="modal-body">
          <input type="hidden" name="IdUser" value="0" />
          <div class="form-row">
            <div class="form-group col-md-12">
              <label for="">Nombre</label>
              <input
                type="name"
                class="form-control"
                name="Name"
                maxlength="200"
                readonly bind:value={pacienteModal.nombre}/>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-md-12">
              <label for="">Apellido</label>
              <input
                type="name"
                class="form-control"
                name="Name"
                maxlength="200"
                readonly bind:value={pacienteModal.apellidos}/>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-md-12">
              <label for="">Cedula</label>
              <input
                type="name"
                class="form-control"
                name="Name"
                maxlength="200" readonly bind:value={pacienteModal.cedula}/>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-md-12">
              <label for="">Telefono</label>
              <input
                type="tel"
                class="form-control"
                name="Name"
                maxlength="200"
                readonly bind:value={pacienteModal.telefono}/>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-md-12">
              <label for="">Celular</label>
              <input
                type="tel"
                class="form-control"
                name="Name"
                maxlength="200"
                readonly bind:value={pacienteModal.celular}/>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-md-12">
              <label for="">Correo electronico</label>
              <input
                type="email"
                class="form-control"
                name="Name"
                maxlength="200" readonly bind:value={pacienteModal.email}/>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-md-12">
              <label for="">Motivo de consulta</label>
              <textarea
                class="form-control"
                rows="3" readonly bind:value={detallesCita.observaciones}/>
            </div>
          </div>

          <br />
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-danger"
            data-dismiss="modal">
            Cerrar
          </button>
          <!-- <button type="submit" class="btn btn-outline-primary">
            Guardar
            <i class="mdi mdi-content-save-outline" />
          </button> -->
        </div>
        
      </div>
    </div>
  </div>
</form>

<div
  class="modal fade modal-slide-right"
  id="modalCambiarCita"
  tabindex="-1"
  role="dialog"
  aria-labelledby="modalCrearCitaLabel"
  style="display: none; padding-right: 16px;"
  aria-modal="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modalCrearCitaLabel">
          <i class="mdi mdi-calendar-plus" />
          Reprogramacion de cita
        </h5>
        <button
          type="button"
          class="close"
          data-dismiss="modal"
          aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div class="modal-body" style="height: 100%; top: 0; overflow: auto;">

        <div class="row">
          <div class="col-lg-6">
            <div class="form-group">
              <label for="inputAddress">Fecha</label>
              <input
                type="date"
                class="form-control form-control-sm"/>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="form-group ">
              <label class="font-secondary">Especialista</label>
              <select
                class="form-control form-control-sm js-select2">
                <option value={0} disabled>- Seleccionar -</option>
                <option value={1}>Dr. Ramon Mena</option>
                <option value={2}>Dra. Lourde Rivas</option>
              </select>
            </div>
          </div>
        </div>
        <div class="list-group list">
            <div class="alert alert-success" role="alert">
              No hay disponibilidad en este horario
            </div>
            <div
              class="list-group-item d-flex align-items-center svelte-1nu1nbu">
              <div class="">
                <div class="name">Hora</div>
              </div>
              <div class="ml-auto">
                <button
                  class="btn btn-outline-success btn-sm">
                  Seleccionar
                </button>
              </div>
            </div>
        </div>

      </div>
    </div>
  </div>
</div>
