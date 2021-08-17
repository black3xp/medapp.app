<script>
    import Aside from "../../Layout/Aside.svelte";
    import Header from "../../Layout/Header.svelte";
    import { activePage, session, axios, toast } from "../../store.js";
    import { onMount } from "svelte";
    import { push, link } from "svelte-spa-router";
    let consultorios = []
    let empresas = []
    let descripcionConsultorio = ''
    let empresaConsultorio = ''
    $axios.defaults.headers.common = {
        Authorization: $session.authorizationHeader.Authorization
    };
    onMount(()=>{
        cargarConsultorios()
        cargarEmpresas()
    })

    function cargarConsultorios(){
        $axios.get('/consultorios')
        .then(res => {
            consultorios = res.data
        })
    }

    function cargarEmpresas(){
        $axios.get('/empresas')
        .then(res => {
            empresas = res.data
        })
    }

    function crearConsultorio(){
        let consultorio = {
            empresaId: empresaConsultorio,
            descripcion: descripcionConsultorio
        }
        $axios.post('/consultorios', consultorio)
        .then(res => {
            cargarConsultorios()
            $toast(5000).fire({
                icon: 'success',
                title: 'Se agrego el consultorio'
            })
            jQuery('#modalAgregarConsultorio').modal('hide')
        })
    }
  </script>
  
  <Aside />
  
  <main class="admin-main">
    <Header />
    <section class="admin-content">
      <div class="container mt-3">
        <h4 class="mb-3">Consultorios <button class="btn btn-primary btn-sm" data-toggle="modal"
            data-target="#modalAgregarConsultorio"><i class="mdi mdi-briefcase-plus"></i> AGREGAR CONSULTORIO</button></h4>
        <div class="card">
            <div class="card-body">
                <div class="row">
                    <div class="col-lg-12 mt-3">
                        <div class="table-responsive">

                            <table class="table table-hover ">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Empresa</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each consultorios as consultorio}
                                         <!-- content here -->
                                         <tr>
                                             <td>
                                                 <div class="avatar avatar-sm mr-2 d-block-sm">
                                                   <div class="avatar avatar-sm">
                                                     <span class="avatar-title rounded-circle ">{consultorio.descripcion[0]}{consultorio.descripcion[1]}</span>
                                                   </div>
                                                 </div>
                                                 <span>{consultorio.descripcion}</span>
                                               </td>
                                             <td>{consultorio.empresa || 'N/A'}</td>
                                             <td><a class="btn btn-primary btn-sm" href="/Mantenimiento/Consultorios/{consultorio.id}" use:link><i class="mdi mdi-calendar-multiselect"></i> Horario</a></td>
                                         </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  </main>
  
  <form id="frmUsuario" autocomplete="off" on:submit|preventDefault={crearConsultorio}>
    <div class="modal fade modal-slide-right"
      id="modalAgregarConsultorio"
      tabindex="-1"
      role="dialog"
      aria-labelledby="modalAgregarConsultorioLabel"
      style="display: none; padding-right: 16px;"
      aria-modal="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalAgregarConsultorioLabel">Nuevo Consultorio</h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div class="modal-body" style="height: 100% !important; top: 0; overflow: auto;">
  
              <input type="hidden" name="IdUser" value="0" />
              
              <div class="form-row">
                <div class="form-group col-md-12">
                  <label for="">Descripcion</label>
                  <input
                    type="name"
                    class="form-control"
                    placeholder="Dr. Juan Perez"
                    bind:value={descripcionConsultorio}
                    maxlength="200"
                    required />
                    
                </div>
                <div class="form-group col-md-12">
                    <label for="">Empresa</label>
                    <select
                      class="form-control"
                      required bind:value={empresaConsultorio}>
                      <option value="" disabled selected>- Seleccionar -</option>
                        {#each empresas as empresa}
                             <!-- content here -->
                             <option value={empresa.id}>{empresa.nombre}</option>
                        {/each}
                    </select>
                  </div>
              </div>

            </div>
            <div class="modal-footer">
              <button type="button"
                class="btn btn-secondary"
                data-dismiss="modal">
                Cerrar
              </button>
              <button type="submit" class="btn btn-success">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </form>
  