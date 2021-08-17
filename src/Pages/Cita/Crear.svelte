<script>
  import Aside from "../../Layout/Aside.svelte";
  import Header from "../../Layout/Header.svelte";
  import { push } from "svelte-spa-router";
  import { activePage, dataCita, axios, session, errorConexion, toast } from "../../store";
  import { onMount } from "svelte";
  import moment from 'moment';
  import Swal from 'sweetalert2';

  $axios.defaults.headers.common = {
    Authorization: $session.authorizationHeader.Authorization
  };

  $activePage = "citas.crear";

  onMount(() => {
    jQuery("#sltMedicos").select2();
    jQuery("#sltMedicos").on("select2:select", e => {
      let data = e.params.data;
      obj.MedicoID = data.id;
      cargarHoras();
    });

    cargarPacientes();
    cargarTandas();
    cargarHoras();
    cargarMedicos();
  });

  let data = $dataCita;
  let obj = {
    Observaciones: "",
    Fecha: data.fechaCita || "",
    MedicoID: data.medicoId,
    PacienteID: data.pacienteId || "",
    AseguradoraID: 1,
    EstadoID: 1,
    Nombre: "",
    Apellidos: "",
    Telefono: "",
    Correo: "",
    Sexo: '',
    Direccion: "",
    tandaID: data.tandaID,
    hora: ""
  };
  let tandas = [];
  let horas = [];
  let pacientes = [];
  let medicos = [];
  $: faltaLaTanda = obj.tandaID == 0 || obj.tandaID == undefined;
  let busquedaPacientes = "";

  function cargarMedicos() {
    $axios.get("/Medicos/Query")
    .then(res => {
        medicos = res.data;
        setTimeout(x => jQuery("#sltMedicos").val(obj.MedicoID).trigger('change'), 10);
      }).catch(err => {
        console.error(err);
        $errorConexion()
      });
  }
  function cargarPacientes() {
    let qs = busquedaPacientes != "" ? "?keyword=" + busquedaPacientes : "";
    $axios.get("/Pacientes/Query" + qs)
    .then(res => {
        pacientes = res.data;

        if (obj.PacienteID != "") {
          let select = pacientes.find(x => x.id == obj.PacienteID)
          seleccionarPaciente(select)
        }
      }).catch(err => {
        console.error(err);
        $errorConexion()
      });
  }
  function cargarTandas() {
    $axios.get("/Tandas/GetAll")
    .then(res => {
        tandas = res.data;
        obj.tandaID = $dataCita.tandaID || 0;
      }).catch(err => {
        console.error(err);
        $errorConexion()
      });
  }
  function cargarHoras() {
    let params = "?date=" + obj.Fecha + "&" + "tandiID=" + obj.tandaID;

    if (obj.Fecha == "" || obj.tandaID <= 0 || obj.MedicoID == "" || obj.MedicoID == 0) {
      horas = [];
      return;  
    }

    $axios.get("/Medicos/HorasDisponibles/" + obj.MedicoID + params)
    .then(res => {
      horas = res.data.map(x => {
        return {
          time: x,
          hora: moment(x, 'LT').format('LT')
        }
      });
      obj.hora = $dataCita.hora || "";
    }).catch(err => {
      horas = [];
      console.error(err);
      $errorConexion()
    })
  }

  function seleccionarPaciente(item) {
    obj.PacienteID = item.id;
    obj.Nombre = item.nombre;
    obj.Apellidos = item.apellidos;
    obj.Telefono = item.telefono;
    obj.Direccion = item.direccion;
    
    jQuery('#modalPacientes').modal('hide');
  }

  function guardarPaciente() {
    let method = ''

    if (obj.PacienteID == "") {
      $axios.post("/Pacientes", obj)
      .then(res => {
        obj.PacienteID = res.data.data;
        crearCita();
      })
      .catch(err => {
        console.error(err);
        $errorConexion()
      })
    } else {
      $axios.put("/Pacientes/" + obj.PacienteID, obj)
      .then(res => {
        if (res.data.success) {
          obj.PacienteID = res.data.data;
          crearCita();
        } else {
          console.log(res);
        }
      }).catch(err => {
        console.error(err);
        $errorConexion()
      })
    }
  }

  function crearCita() {
    obj.Fecha = obj.Fecha + "T" + obj.hora;

    $axios.post("/Citas", obj)
    .then(res => {
      if (res.data.success) {
        $dataCita = {};
        $toast(5000).fire({
            icon: 'success',
            title: 'La cita fue creada con exito'
          })
        push('/Cita/Gestionar');
      } else {
        console.log(res);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrio un error al crear la cita, intente de nuevo',
          icon: 'error'
        });
      }
    }).catch(err => {
      console.error(err);
      $errorConexion()
    })
  }
</script>

<style>
  .modal-slide-right .modal-body {
    height: 100% !important;
    top: 0;
    overflow: auto;
  }

  .list-group-item:nth-child(2n+1) {
    background-color: #3e46760c;
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
              <form class="row" on:submit|preventDefault={guardarPaciente}>
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
                      bind:value={obj.Nombre} required />
                  </div>
                  <div class="form-group">
                    <label for="inpApellido">Apellidos paciente <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      class="form-control"
                      id="inpApellido"
                      bind:value={obj.Apellidos} required />
                  </div>
                  <div class="form-group">
                    <label for="inpTelefono">Telefono / Celular <span class="text-danger">*</span></label>
                    <input
                      type="tel"
                      class="form-control"
                      id="inpTelefono"
                      bind:value={obj.Telefono} required />
                  </div>
                  <div class="form-group">
                    <label for="inpCorreo">Correo electronico</label>
                    <input
                      type="email"
                      class="form-control"
                      id="inpCorreo"
                      bind:value={obj.Correo} />
                  </div>
                  <!-- <div class="form-group">
                    <label for="">Sexo</label>
                      <div class="m-b-10">
                        <label class="cstm-switch ">
                          <input type="radio" name="radioSexo" class="cstm-switch-input" 
                            value={'M'} bind:group={obj.Sexo} required>
                            <span class="cstm-switch-indicator"></span>
                            <span class="cstm-switch-description">Masculino</span>
                        </label>
                        <label class="cstm-switch m-l-10 ">
                            <input type="radio" name="radioSexo" class="cstm-switch-input"
                            value={'F'} bind:group={obj.Sexo} required>
                            <span class="cstm-switch-indicator"></span>
                            <span class="cstm-switch-description">Femenino</span>
                        </label>
                      </div>
                  </div> -->

                  <div class="form-group ">
                    <label class="font-secondary">Direccion</label>
                    <textarea
                      class="form-control"
                      rows="3"
                      bind:value={obj.Direccion} />
                  </div>
                  <p>Los campos con un ( <span class="text-danger">*</span> ) son obligatorios</p>

                </div>
                <div class="col-lg-7">
                  <div class="row">
                    <div class="col-lg-6">
                      <div class="form-group">
                        <label for="Fecha">Fecha cita</label>
                        <input
                          type="date"
                          class="form-control mb-2"
                          id="Fecha"
                          bind:value={obj.Fecha} on:change={() => {
                            cargarHoras();
                          }} required/>
                      </div>
                    </div>
                    <div class="col-lg-6">
                      <div class="form-group ">
                        <label class="font-secondary">Tanda</label>
                        <select class="form-control"
                          bind:value={obj.tandaID} on:change={cargarHoras} required>
                          <option value={0} disabled selected>- Seleccionar -</option>
                          {#each tandas as item}
                          <option value={item.id}>{item.nombre}</option>
                          {/each}
                        </select>
                      </div>
                    </div>

                    <div class="col-lg-6">
                      <div class="form-group ">
                        <label class="font-secondary">Médico</label>
                        <select class="form-control js-select2" id="sltMedicos" 
                            disabled={faltaLaTanda} bind:value={obj.MedicoID} required>
                          <option value={0} disabled selected>- Seleccionar -</option>
                          {#each medicos as item}
                          <option value={item.id}>{item.name}</option>
                          {/each}
                        </select>
                      </div>
                    </div>
                    <div class="col-lg-6">
                      <div class="form-group">
                        <label class="font-secondary">Hora</label>
                        <select class="form-control" bind:value={obj.hora}
                          disabled={faltaLaTanda} required>
                          <option value={""} disabled selected>- Seleccionar -</option>
                          {#each horas as item}
                          <option value={item.time}>{item.hora}</option>
                          {/each}
                        </select>
                      </div>
                    </div>
                    <div class="col-lg-12">
                      <div class="form-group ">
                        <label class="font-secondary">Ubicaci&oacute;n del M&eacute;dico en el centro</label>
                        <input type="text" class="form-control" readonly value={$dataCita.ubicacion || ""}>
                      </div>
                    </div>
                    <div class="col-lg-12">
                      <div class="form-group ">
                        <label class="font-secondary">Observaciones</label>
                        <textarea class="form-control" rows="5" bind:value={obj.Observaciones}/>
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
            placeholder="Buscar"
            bind:value={busquedaPacientes} on:input={cargarPacientes}/>
          <div class="input-group-append">
            <div class=" input-group-text">
              <span class="mdi mdi-magnify" />
            </div>
          </div>
        </div>

        <div class="list-group list ">
          {#each pacientes as i}
          <div
            style="cursor:pointer;"
            class="list-group-item d-flex align-items-center link-pacientes"
            on:click={seleccionarPaciente(i)}>
            <div class="row">
              <div class="text-primary">
                <div class="name">
                  <span class="nombre-apellido" style="font-weight: bold;">{i.nombre} {i.apellidos}</span>
                  »
                  <span>Tel.: {i.telefono}</span>
                  »
                  <span>ID: {i.cedula || '\"Ningulo\"'}</span>
                </div>
                <div class="text-muted">
                  {i.direccion}
                </div>
              </div>
            </div>
          </div>
          {/each}
        </div>
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
