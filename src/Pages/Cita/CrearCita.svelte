<script>
    import Aside from "../../Layout/Aside.svelte";
    import Header from "../../Layout/Header.svelte";
    import { push, link } from "svelte-spa-router";
    import { activePage, dataCita, axios, session, errorConexion, toast } from "../../store";
    import { onMount } from "svelte";
    import moment from 'moment';
    import Swal from 'sweetalert2';

    let pacientes = []
    let inpBuscarPaciente = []
    let pacienteFormulario = []
    let modalidadesServicios = []
    let servicios = []
    let sltModalidad = ''
    let sltServicio = ''
    let inpFecha = ''
    let horasServicios = []
    let sltHora = ''
    let txtObservaciones = ''
    let nombrePaciente = ''
    let apellidosPaciente = ''
    let telefonoPaciente = ''
    let correoPaciente = ''
    let direccionPaciente = ''
    
    function seleccionarPaciente(id){
        let paciente = pacientes.filter(x => x.id == id)
        pacienteFormulario = paciente[0]
        console.log(pacienteFormulario)
        jQuery('#modalPacientes').modal('hide')
    }

    function cargarPacientes(){
        setTimeout(function(){
            $axios.get(`/pacientes?keyword=${inpBuscarPaciente}`)
            .then(res => {
                pacientes = res.data
            })
        },1000)
    }

    function cargarModalidades(){
        $axios.get(`/modalidadesServicios`)
            .then(res => {
                modalidadesServicios = res.data
            })
    }

    function cargarServicios(){
        $axios.get(`/servicios`)
            .then(res => {
                servicios = res.data
            })
    }

    function cargarHorasServicios(){
        let filtro = {
            fecha: inpFecha,
            modalidadId: sltModalidad
        }
        let query = new URLSearchParams(filtro).toString()
        $axios.get(`/servicios/${sltServicio}/disponibilidad?${query}`)
            .then(res => {
                horasServicios = res.data
            })
    }

    function guardarCita(idPaciente){
        let fechaHora = inpFecha + 'T' + sltHora
        let objCita = {
            ServicioId: sltServicio,
            PacienteId: idPaciente,
            AseguradoraId: pacienteFormulario.aseguradoraId,
            Fecha: fechaHora,
            Observaciones: txtObservaciones,
            ModalidadId: sltModalidad
        }
        if(idPaciente){
            $axios.post(`/citas`, objCita)
                .then(res => {
                    console.log(res.data)
                    sltModalidad = ''
                    sltServicio = ''
                    inpFecha = ''
                    horasServicios = []
                    sltHora = ''
                    txtObservaciones = ''
                    pacienteFormulario.nombre = ''
                    pacienteFormulario.apellidos = ''
                    pacienteFormulario.telefono = ''
                    pacienteFormulario.email = ''
                    pacienteFormulario.direccion = ''
                    pacienteFormulario.id = ''
                })
        }else{
            let form = new FormData()
            form.append('nombre', pacienteFormulario.nombre)
            form.append('apellidos', pacienteFormulario.apellidos)
            form.append('telefono', pacienteFormulario.telefono)
            form.append('email', pacienteFormulario.email)
            // form.append('municipioId', null)
            // form.append('userId', null)
            // form.append('provinciaId', null)
            form.append('noParentesco', true)
            form.append('direccion', pacienteFormulario.direccion)

            $axios.post(`/pacientes`, form)
                .then(res => {
                    let idPaciente = res.data.data
                    let objCita = {
                        ServicioId: sltServicio,
                        PacienteId: idPaciente,
                        AseguradoraId: 6,
                        Fecha: fechaHora,
                        Observaciones: txtObservaciones,
                        ModalidadId: sltModalidad
                    }
                    $axios.post(`/citas`, objCita)
                        .then(res => {
                            console.log(res.data)
                            sltModalidad = ''
                            sltServicio = ''
                            inpFecha = ''
                            horasServicios = []
                            sltHora = ''
                            txtObservaciones = ''
                            pacienteFormulario.nombre = ''
                            pacienteFormulario.apellidos = ''
                            pacienteFormulario.telefono = ''
                            pacienteFormulario.email = ''
                            pacienteFormulario.direccion = ''
                            pacienteFormulario.id = ''
                        })
                })
        }
    }
  
    onMount(() => {
        cargarPacientes()
        cargarModalidades()
        cargarServicios()
    });

  </script>
  
  <style>
    .modal-slide-right .modal-body {
      height: 100% !important;
      top: 0;
      overflow: auto;
    }
    .list-group-item {
      border-top: none;
      border-left: none;
      border-right: none;
      background-color: transparent;
      border-radius: 0 !important;
    }
  
    .link-pacientes {
      width: 100%;
      border-radius: 5px;
    }
  
    .link-pacientes:hover {
      background-color: rgba(241, 241, 241, 0.247);
    }
    .borde-derecho {
      border-right: 1px solid rgb(236, 236, 236);
    }
    .nombre-apellido{
      text-transform:capitalize !important
    }
  </style>
  
  <Aside />
  
  <main class="admin-main">
    <Header />
    <section class="admin-content">
      <div class="container mt-3">
        <div class="row">
          <div class="col-lg-12 mb-3 text-right">
            <a href="/Citas/Index" class="btn btn-outline-primary" use:link>Lista de citas</a>
          </div>
          <div class="col-lg-12 mb-5">
            <div class="card">
              <div class="card-header">
                <h5>
                  <i class="mdi mdi-checkbox-intermediate" />
                  Creando cita
                </h5>
                <div class="card-controls"></div>
              </div>
              <div class="card-body">
                <form class="row" on:submit|preventDefault={() => guardarCita(pacienteFormulario.id)}>
                  <div class="col-lg-5 borde-derecho">
                    <div class="col-lg-12 mt-2" style="padding: 0; margin: 0;">
                        <button class="btn btn-primary btn-sm" data-toggle="modal" style="position: absolute; top: -30px; right: 0;" data-target="#modalPacientes" type="button">
                      <i class="mdi mdi-search-web" />
                      Buscar paciente
                    </button>
                    </div>
  
                    <div class="form-group">
                      <label for="inpNombre">Nombre paciente <span class="text-danger">*</span> </label>
                      <input
                        type="text"
                        class="form-control"
                        id="inpNombre"
                        required bind:value={pacienteFormulario.nombre}/>
                    </div>
                    <div class="form-group">
                      <label for="inpApellido">Apellidos paciente <span class="text-danger">*</span></label>
                      <input
                        type="text"
                        class="form-control"
                        id="inpApellido"
                        required bind:value={pacienteFormulario.apellidos}/>
                    </div>
                    <div class="form-group">
                      <label for="inpTelefono">Telefono / Celular <span class="text-danger">*</span></label>
                      <input
                        type="tel"
                        class="form-control"
                        id="inpTelefono"
                        required bind:value={pacienteFormulario.telefono}/>
                    </div>
                    <div class="form-group">
                      <label for="inpCorreo">Correo electronico</label>
                      <input
                        type="email"
                        class="form-control"
                        id="inpCorreo" bind:value={pacienteFormulario.email}/>
                    </div>
  
                    <div class="form-group ">
                      <label class="font-secondary">Direccion</label>
                      <textarea
                        class="form-control"
                        rows="3" bind:value={pacienteFormulario.direccion}/>
                    </div>
                    <p>Los campos con un ( <span class="text-danger">*</span> ) son obligatorios</p>
  
                  </div>
                  <div class="col-lg-7">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="form-group ">
                              <label class="font-secondary">Servicios</label>
                              <select class="form-control js-select2" id="sltMedicos" on:change={cargarHorasServicios} bind:value={sltServicio} required>
                                <option value={''} disabled selected>- Seleccionar -</option>
                                {#each servicios as servicio}
                                    <option value={servicio.id}>{servicio.descripcion}</option>
                                {/each}
                              </select>
                            </div>
                          </div>

                          <div class="col-lg-6">
                            <div class="form-group ">
                              <label class="font-secondary">Modalidad</label>
                              <select class="form-control"
                                required bind:value={sltModalidad} on:change={cargarHorasServicios}>
                                <option value={''} disabled selected>- Seleccionar -</option>
                                {#each modalidadesServicios as modalidad}
                                    <option value={modalidad.id}>{modalidad.descripcion}</option>
                                {/each}
                              </select>
                            </div>
                          </div>

                      <div class="col-lg-6">
                        <div class="form-group">
                          <label for="Fecha">Fecha cita</label>
                          <input
                            type="date"
                            class="form-control mb-2"
                            id="Fecha" required bind:value={inpFecha} on:change={cargarHorasServicios}/>
                        </div>
                      </div>

                      <div class="col-lg-6">
                        <div class="form-group">
                          <label class="font-secondary">Hora</label>
                          <select class="form-control"
                            required bind:value={sltHora}>
                            <option value={""} disabled selected>- Seleccionar -</option>
                            {#each horasServicios as hora}
                                <option value={hora}>{hora}</option>
                            {/each}
                          </select>
                        </div>
                      </div>
                      <div class="col-lg-12">
                        <div class="form-group ">
                          <label class="font-secondary">Observaciones</label>
                          <textarea class="form-control" rows="5" bind:value={txtObservaciones}></textarea>
                        </div>
                      </div>
                      <div class="col-lg-12 p-t-80" style="text-align: right;">
                        <button type="submit" class="btn btn-success" style="position: fixed; height: 50px; width: 50px; border-radius: 50%; right: 40px; bottom: 40px;" title="Guardar">
                          <i class="mdi mdi-content-save-outline" style="font-size: 23px;"/>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
  
  <!-- Modal -->
  <div
    class="modal fade modal-slide-right"
    id="modalPacientes"
    tabindex="-1"
    role="dialog"
    aria-labelledby="modalPacientes"
    style="display: none; padding-right: 16px;"
    aria-modal="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="modalPacientes">Buscar pacientes</h5>
          <button
            type="button"
            class="close"
            data-dismiss="modal"
            aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div class="modal-body">
  
          <div class="input-group input-group-flush mb-3">
            <input
              type="search"
              class="form-control form-control-appended"
              placeholder="Buscar" bind:value={inpBuscarPaciente} on:input={cargarPacientes}/>
            <div class="input-group-append">
              <div class=" input-group-text">
                <span class="mdi mdi-magnify" />
              </div>
            </div>
          </div>
          {#each pacientes as paciente}
               <!-- content here -->
               <div class="list-group list ">
                 <div
                   style="cursor:pointer;"
                   class="list-group-item d-flex align-items-center link-pacientes" on:click={() => seleccionarPaciente(paciente.id)}>
                   <div class="row">
                     <div class="text-primary">
                       <div class="name">
                         <span class="nombre-apellido" style="font-weight: bold;">{paciente.nombre} {paciente.apellidos}</span>
                         »
                         <span>Tel.: {paciente.telefono}</span>
                         »
                         <span>ID: {paciente.cedula}</span>
                       </div>
                       <div class="text-muted">
                         {paciente.direccion}
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
          {/each}
        </div>
        <div class="modal-footer">
          <div class="row text-center p-b-5">
            <div class="col">
              <a href="#!" class="btn btn-secondary" data-dismiss="modal">
                Cerrar
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  