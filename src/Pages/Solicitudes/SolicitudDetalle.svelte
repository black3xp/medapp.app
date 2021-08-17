<script>
    import Aside from "../../Layout/Aside.svelte";
    import Header from "../../Layout/Header.svelte";
    import { activePage, session, axios, toast } from "../../store.js";
    import { onDestroy, onMount } from "svelte";
    export let params = {}
    
    let solicitudDetalle = []
    let paciente = []
    let imagenesRecetas = []
    let parentescos = []
    let estados = []

    function cargarDetalleSolicitud(){
        $axios.get(`/solicitudes/${params.id}`)
            .then(res => {
                solicitudDetalle = res.data
                paciente = res.data.paciente
                cargarParentesco()
            })
    }

    function cargarEstados(){
        $axios.get(`/estadossolicitud`)
            .then(res =>{
            estados = res.data
        })
    }

    function cargarParentesco(){
        $axios.get(`/pacientes/${paciente.id}/parentescos`)
            .then(res => {
                parentescos = res.data
            })
    }

    function cargarImagenSolicitud(){
        $axios.get(`/solicitudes/${params.id}/attachments`)
            .then(res => {
                imagenesRecetas = res.data
            })
    }

    function cambiarEstadoSolicitud(estado){
        const datosSolicitud = {
            Id :solicitudDetalle.id,
            PacienteId :solicitudDetalle.pacienteId,
            AseguradoraId :solicitudDetalle. aseguradoraId,
            CategoriaAfiliado :solicitudDetalle.categoriaAfiliado,
            NumeroAsegurado :solicitudDetalle.numeroAsegurado,
            Colectivo :solicitudDetalle.colectivo,
            EstadoId :estado,
            Flag :solicitudDetalle.flag,
            Codigo :solicitudDetalle.codigo,
            Comentario :solicitudDetalle.comentario,
            CreatedAt :solicitudDetalle.createdAt,
            Autorizado :solicitudDetalle.autorizado,
            NumeroAutorizacion :solicitudDetalle.numeroAutorizacion,
            Modalidad :solicitudDetalle.modalidad,
            MotivoSolicitud :solicitudDetalle.motivoSolicitud,
        }
        $axios.put(`/solicitudes/${solicitudDetalle.id}`, datosSolicitud)
            .then(res => {
                if(res.status == 200){
                    $toast(5000).fire({
                        icon: 'success',
                        title: 'Se actualizado la solicitud'
                    })
                }else{
                    alert('Ocurrio un error en el servidor')
                }
            })
    }

    onMount(()=>{
        cargarDetalleSolicitud()
        cargarImagenSolicitud()
        cargarEstados()
    })
  </script>
  
  <Aside />
  
  <main class="admin-main">
    <Header />
    <section class="admin-content">
        <div class="container-fluid mt-3">
            <h4>Detalle Solicitud <span class="badge badge-primary">{solicitudDetalle.codigo}</span></h4>
            <div class="row">
                <div class="col-lg-12 mb-4 mt-3">
                    {#each estados as estado}
                         <div class="custom-control custom-radio custom-control-inline">
                             <input type="radio" id={estado.id} value={estado.id} bind:group={solicitudDetalle.estadoId} on:click={() => cambiarEstadoSolicitud(estado.id)} name="Estado" class="custom-control-input">
                             <label class="custom-control-label" for={estado.id}>{estado.descripcion}</label>
                         </div>
                    {/each}
                </div>
            </div>
            <div class="card m-b-30">
                <div class="card-header">
                    <div class="card-controls">
                        <span class="badge badge-primary">Fecha: {new Date(solicitudDetalle.createdAt).toLocaleString()}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="form-row">
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="codigo">Codigo Solicitud</label>
                            <input type="text" class="form-control" value={solicitudDetalle.codigo} readonly id="codigo">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="catAfiliado">Categoria de afiliado</label>
                            <input type="text" class="form-control" value={solicitudDetalle.categoriaAfiliado} readonly id="catAfiliado">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="colectivo">Colectivo</label>
                            <input type="text" class="form-control" value={solicitudDetalle.colectivo} readonly id="colectivo">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="colectivo">Motivo</label>
                            <input type="text" class="form-control" value={solicitudDetalle.motivoSolicitud} readonly id="motivo">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="modalidad">Modalidad</label>
                            <input type="text" class="form-control" value={solicitudDetalle.modalidad} readonly id="modalidad">
                        </div>
                        <div class="form-group col-lg-12 col-md-12">
                            <div class="form-group">
                                <label for="exampleFormControlTextarea1">Sintomas</label>
                                <textarea class="form-control" style="width:100%" disabled rows="3">{solicitudDetalle.comentario}</textarea>
                              </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card m-b-30">
                <div class="card-header">
                    <h5 class="card-title m-b-0">Datos personales </h5>
                </div>
                <div class="card-body">
                    <div class="form-row">
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="nombre">Nombre</label>
                            <input type="text" class="form-control" value={paciente.nombre} readonly id="nombre" placeholder="Email">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="apellido">Apellidos</label>
                            <input type="text" class="form-control" value={paciente.apellidos} readonly id="apellido">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="apodo">Apodo</label>
                            <input type="text" class="form-control" value={paciente.apodo} readonly id="apodo">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="cedula">Cedula</label>
                            <input type="text" class="form-control" value={paciente.cedula} readonly id="cedula">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="aseguradora">Aseguradora</label>
                            <input type="text" class="form-control" value={paciente.aseguradora} readonly id="aseguradora">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="afiliado">No. Afiliado / NSS</label>
                            <input type="text" class="form-control" value={paciente.noAfiliado} readonly id="afiliado">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="nacimiento">Fecha de nacimiento</label>
                            <input type="text" class="form-control" value={new Date(paciente.fechaNacimiento).toLocaleDateString('es-DO')} readonly id="nacimiento">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="sexo">Sexo</label>
                            <input type="text" class="form-control" value={paciente.sexo} readonly id="sexo">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="email">Telefono</label>
                            <input type="text" class="form-control" value={paciente.telefono} readonly id="telefono">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="email">Celular</label>
                            <input type="text" class="form-control" value={paciente.celular} readonly id="celular">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="email">Correo electronico</label>
                            <input type="text" class="form-control" value={paciente.email} readonly id="email">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="provincia">Provincia</label>
                            <input type="text" class="form-control" value={paciente.provincia} readonly id="provincia">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="municipio">Municipio</label>
                            <input type="text" class="form-control" value={paciente.municipio} readonly id="municipio">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="ciudad">Ciudad</label>
                            <input type="text" class="form-control" value={paciente.ciudad} readonly id="ciudad">
                        </div>
                        <div class="form-group col-lg-4 col-md-6">
                            <label for="barrio">Barrio</label>
                            <input type="text" class="form-control" value={paciente.barrio} readonly id="barrio">
                        </div>
                        
                        <div class="form-group col-lg-8 col-md-6">
                            <label for="direccion">Direccion</label>
                            <input type="text" class="form-control" value={paciente.ciudad} readonly id="direccion">
                        </div>
                    </div>
                </div>
            </div>
            {#each parentescos as parentesco}
            <h5><span class="badge badge-primary">Datos de {parentesco.tipoParentesco}</span></h5>
                 <div class="card m-b-30">
                     <div class="card-body">
                         <div class="form-row">
                             <div class="form-group col-lg-4 col-md-6">
                                 <label for="codigo">Nombre</label>
                                 <input type="text" class="form-control" value={parentesco.nombre} readonly>
                             </div>
                             <div class="form-group col-lg-4 col-md-6">
                                 <label for="catAfiliado">Apellidos</label>
                                 <input type="text" class="form-control" value={parentesco.apellidos} readonly>
                             </div>
                             <div class="form-group col-lg-4 col-md-6">
                                 <label for="colectivo">Cedula</label>
                                 <input type="text" class="form-control" value={parentesco.cedula} readonly>
                             </div>
                             <div class="form-group col-lg-4 col-md-6">
                                <label for="colectivo">Telefono</label>
                                <input type="text" class="form-control" value={parentesco.telefono} readonly>
                            </div>
                         </div>
                     </div>
                 </div>
            {/each}
            
            <div class="card m-b-30 mb-5">
                <div class="card-header">
                    <h5 class="card-title m-b-0">Archivos </h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <a href="https://odyssey-api.cmsiglo21.app/api/archivos/storage/{paciente.imagenCedula}" target="_blank" class="col-lg-4">
                            <img src="https://odyssey-api.cmsiglo21.app/api/archivos/storage/{paciente.imagenCedula}" class="img-galeria img-thumbnail" alt="cedula"/>
                        </a>
                        <a href="https://odyssey-api.cmsiglo21.app/api/archivos/storage/{paciente.imagenSeguro}" target="_blank" class="col-lg-4">
                            <img src="https://odyssey-api.cmsiglo21.app/api/archivos/storage/{paciente.imagenSeguro}" class="img-galeria img-thumbnail" alt="cedula"/>
                        </a>
                        {#each imagenesRecetas as img}
                            <a href="https://odyssey-api.cmsiglo21.app/api/archivos/storage/{img.name}" target="_blank" class="col-lg-4">
                                <img src="https://odyssey-api.cmsiglo21.app/api/archivos/storage/{img.name}" class="img-galeria img-thumbnail" alt="cedula"/>
                            </a>
                        {/each}
                    </div>
                </div>
            </div>
        </div><br>

    </section>
  </main>

  <style>
      .img-galeria{
          height: 200px;
          object-fit: cover;
          width: 100%;
      }
  </style>
  