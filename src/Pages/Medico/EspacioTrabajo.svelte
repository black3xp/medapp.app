<script>
  import Aside from "../../Layout/Aside.svelte";
  import Header from "../../Layout/Header.svelte";
  import { connection, activePage, session, axios, errorConexion, toast } from "../../store.js";
  import { UserManager } from "../../util.js";
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import moment from "moment";
  import Swal from 'sweetalert2';
  
  let user = {};
  user = new UserManager($session.authorizationHeader.Authorization)

  $axios.defaults.headers.common = {
    Authorization: $session.authorizationHeader.Authorization
  };
  $activePage = "espacioMedico";

  let citaPacienteActual = {};
  let paciente = {};
  let envioPacienteActual = "";
  let pacienteSeleccionado = "";
  let citas = [];

  onMount(() => {
    cargarPacientesActivos()
    buscarPacientePendiente();
  })

  $connection.on("RecibirPaciente", (pacienteID, tipo) => {
    cargarPacientesActivos();
    if (tipo == "asignar") {
      envioPacienteActual = pacienteID || ""
      getPaciente(envioPacienteActual, 'asistente')
    }
  });

  function cargarPacientesActivos() {
    $axios.get('/Medicos/' + user.nameid + "/PacientesActivos")
    .then(res => {
      citas = res.data.filter (e =>
        moment(e.fecha).format("YYYY-MM-DD") == moment().format("YYYY-MM-DD")
      );
    }).catch(err => {
      console.error(err);
      $errorConexion()
    })
  }
  function getPaciente(id, via) {
    if (id == "") {
      return
    }

    $axios.get("/Pacientes/" + id)
      .then(res => {
        if (via == 'asistente' || via == 'carga') {
          citaPacienteActual = citas.find(x => x.pacienteID == envioPacienteActual)
          if (citas.some(x => x.pacienteID == envioPacienteActual)) {
            paciente = res.data;
            pacienteSeleccionado = paciente.id
          }
        }
        if (via == 'seleccion') {
          paciente = res.data;
          pacienteSeleccionado = paciente.id
        }
      }).catch(err => {
        console.error(err);
        $errorConexion()
      });
  }
  function terminarCita() {
    if (Object.entries(citaPacienteActual).length > 0 && citaPacienteActual != undefined) {
      citaPacienteActual.inactivo = true;
      citaPacienteActual.estadoID = 3;
      $axios.put("/Citas/" + citaPacienteActual.id, citaPacienteActual)
      .then(res => {
        if (res.data.success) {
          citaPacienteActual = {}
          paciente = {}
          envioPacienteActual = "";
          cargarPacientesActivos();

          $connection.invoke("EnviarAvisoDelPaciente", user.nameid, "")
            .catch(err => console.error(err));
        }
      })
      .catch(err => {
        console.error(err);
        $errorConexion()
      });
    }
  }
  function cambiarDePaciente(id) {
    Swal.fire({
      title: 'Cambio de paciente',
      text: "Estas seguro que deseas cambiar de paciente?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'No',
      confirmButtonText: 'Si'
    }).then((result) => {
      if (result.isConfirmed) {
        $axios.post("/Medicos/" + user.nameid + "/AsignarPaciente?pacienteId=" + id)
        .then(res => {
          if (!res.data.errors) {
            envioPacienteActual = id;
            citaPacienteActual = citas.find(x => x.pacienteID == id)
            $connection.invoke("EnviarAvisoDelPaciente", user.nameid, id)
            .catch(err => console.error(err));

            $toast(5000).fire({
              icon: 'success',
              title: 'Cambio realizado con exito'
            })
          } else {
            Swal.fire({
              title: 'Error',
              text: 'Problema al cambiar paciente',
              icon: 'error'
            });
          }

        }).catch(err => {
          console.error(err);
          $errorConexion()
        });
      }
    })
  }

  function buscarPacientePendiente() {
    $axios.get("/Medicos/" + user.nameid + "/PacientePendiente")
      .then(res => {
        envioPacienteActual = res.data.data;
        getPaciente(envioPacienteActual, 'carga')
      }).catch(err => {
        console.error(err);
        $errorConexion()
      });
  }
</script>

<style>
  .list-group-item {
    border-radius: 0 !important;
  }
  .list-group-item:last-child {
    border-bottom: none;
  }
  .list-group-item.activo {
    background-color: #687ae8;
    color: white;
    border-radius: 3px !important;
  }
  .list-group-item.activo .text-muted {
    color: white !important;
  }
  .active-select{
    background-color: rgba(216, 216, 216, 0.205);
  }
</style>

<Aside />

<main class="admin-main">
  <Header />
  <section class="admin-content">
    <div class="container mt-3">
      <div class="row">
        <div class="col-lg-12 mb-3" style="text-align: right;">
          <!-- <button type="submit" class="btn btn-primary">
            <i class="mdi mdi-bell-ring-outline" />
            Llamar asistente
          </button> -->
          <button class:d-none={envioPacienteActual == "" || citaPacienteActual == undefined} 
            class="btn btn-success" on:click={terminarCita}>
            <i class="mdi mdi-check-all" />
            Terminar cita
          </button>
        </div>
        <div class="col-lg-5">
          <div class="card m-b-20 card-vnc svelte-1e95eny">
            <div class="card-header">
              <h5 class="m-b-0">Lista de citas</h5>
            </div>
            <div class="card-body">
              <div class="list-group list ">
                {#each citas as item}
                <div
                  class="list-group-item d-flex align-items-center
                  link-pacientes svelte-1p1f2vm active-select" 
                  class:activo={envioPacienteActual == item.pacienteID}
                  class:active-select={pacienteSeleccionado == item.pacienteID}
                  style="cursor: pointer;"
                  on:click={() => { getPaciente(item.pacienteID, 'seleccion') }}
                  on:dblclick={() => cambiarDePaciente(item.pacienteID)}>
                  <div class="row">
                    <div class="">
                      <div class="name">
                        <span style="font-weight: bold;">{item.nombrePaciente}</span>
                        »
                        <span>Ced.: {item.cedula || ""}</span>
                      </div>
                      <div class="text-muted">{item.observaciones}</div>
                    </div>
                  </div>
                </div>
                {/each}

              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-7">
          <div class="card m-b-30">
            <div class="card-header">
              <h5 class="m-b-0">Paciente actual</h5>
            </div>
            <div class="card-body ">
              <form id="frmPaciente">
                <input type="hidden" name="IdUser" value="0" />
                <div class="row">
                  <div class="form-group col-md-6">
                    <label for="">Nombre</label>
                    <input
                      value={paciente.nombre || ""}
                      type="name"
                      class="form-control"
                      readonly
                      name="Name"
                      maxlength="200" />
                  </div>
                  <div class="form-group col-md-6">
                    <label for="">Apellido</label>
                    <input
                      value={paciente.apellidos || ""}
                      type="name"
                      class="form-control"
                      readonly
                      name="Name"
                      maxlength="200" />
                  </div>

                  <div class="form-group col-md-6">
                    <label for="">Cedula</label>
                    <input
                      type="name"
                      class="form-control"
                      readonly
                      value={paciente.cedula || ""}
                      maxlength="200" />
                  </div>

                  <div class="form-group col-md-6">
                    <label for="">Telefono</label>
                    <input
                      value={paciente.telefono || ""}
                      type="tel"
                      class="form-control"
                      readonly
                      name="Name"
                      maxlength="200" />
                  </div>

                  <div class="form-group col-md-12">
                    <label for="">Correo electronico</label>
                    <input
                      type="email"
                      class="form-control"
                      readonly
                      value={paciente.correo || ""}
                      maxlength="200" />
                  </div>

                  <div class="form-group col-md-6">
                    <label for="">Aseguradora</label>
                    <input
                      value={paciente.nombreAseguradora || ""}
                      type="email"
                      class="form-control"
                      readonly
                      maxlength="200" />
                  </div>

                  <div class="form-group col-md-6">
                    <label for="">No. Seguro</label>
                    <input
                      type="text"
                      class="form-control"
                      readonly
                      maxlength="200"
                      value={paciente.noAfiliado || ""} />
                  </div>

                  <div class="form-group col-md-6">
                    <label for="">Pais</label>
                    <input
                      type="email"
                      class="form-control"
                      readonly
                      value={paciente.nacionalidad || ""}
                      maxlength="200" />
                  </div>

                  <div class="form-group col-md-6">
                    <label for="">Provincia</label>
                    <input
                      type="email"
                      class="form-control"
                      readonly
                      maxlength="200" 
                      value={paciente.provincia || ""}/>
                  </div>

                  <div class="form-group col-md-12">
                    <label for="">Direccion</label>
                    <textarea
                      class="form-control"
                      rows="2"
                      readonly
                      value={paciente.direccion || ""} />
                  </div>

                  <div class="form-group col-md-12">
                    <label for="">Observaciones</label>
                    <textarea
                      value={paciente.observaciones || ""}
                      class="form-control"
                      rows="3"
                      name="Observaciones" />
                  </div>
                  <br />

                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>
</main>
