<script>
  import Aside from "../../Layout/Aside.svelte";
  import Header from "../../Layout/Header.svelte";
  import { push } from "svelte-spa-router";
  import { activePage, host, axios, session, errorConexion, toast } from "../../store";
  import { onMount } from "svelte";
  // import Swal from 'sweetalert2';
  let sltPrefijo = ''
  let inpNombre = ''
  let inpEmail = ''
  let inpTelefono = ''
  let inpPassword = ''
  let roles = []
  let rolUsuario = []
  let usuarioId = ''

  $axios.defaults.headers.common = {
    Authorization: $session.authorizationHeader.Authorization
  };

  $activePage = "mantenimiento.usuarios.index";

  $: filterRoles = roles.map(x => {
    return {
      id : x.id,
      name : x.name,
      displayName: x.displayName,
      checked: rolUsuario.some(y => y == x.name)
    }
  })


  let prefijos = [
    {value: 'Dr', name: 'Dr.'},
    {value: 'Dra', name: 'Dra.'},
    {value: 'Lic', name: 'Lic.'},
    {value: 'Lida', name: 'Lida.'},
    {value: 'Sr', name: 'Sr.'},
    {value: 'Sra', name: 'Sra.'},
  ]

  let usuarios = []

  onMount(() => {
    cargarUsuarios()
    cargarRoles()
  });

  function cambiarRol(item, check){
    let rol = {Name: item}
    if(check){
      $axios.post(`/users/${usuarioId}/EliminarRol`, rol)
      .then(res => {
        cargarUsuarios()
        cargarRolUsuario(usuarioId)
      })
    }else{
      $axios.post(`/users/${usuarioId}/AgregarRol`, rol)
      .then(res => {
        cargarUsuarios()
        cargarRolUsuario(usuarioId)
      })
    }
  }

  function cargarUsuarios(){
    $axios.get('/Users')
    .then(res => {
      usuarios = res.data
    })
  }

  function cargarRolUsuario(idUsuario){
    usuarioId = idUsuario
    $axios.get(`/users/${usuarioId}/roles`)
    .then(res => {
      rolUsuario = res.data
    })
  }

  function cargarRoles(){
    $axios.get('/roles')
    .then(res => {
      roles = res.data
    })
  }

  function guardarUsuario() {
      let usuario = {
            Prefix: sltPrefijo,
            Name: inpNombre,
            Email: inpEmail,
            PhoneNumber: inpTelefono,
            PasswordHash: inpPassword
        }
      $axios.post("/users", usuario)
      .then(res => {
        if (res.data) {
          $toast(5000).fire({
            icon: 'success',
            title: 'Usuario guardado con exito'
          })
          jQuery('#modalUsuario').modal('hide');
          cargarUsuarios()
        }
      }).catch(err => {
        console.error(err);
        $errorConexion()
      });
  }

</script>

<style>
  .icon-rol {
    color: #95aac9;
  }
</style>

<Aside />

<main class="admin-main">
  <Header />
  <section class="admin-content">
    <div class="container">
      <div class="row">

        <div class="mt-4 col-md-12">
          <div class="row">
            <div class="col-md-5">
              <div class="input-group input-group-flush mb-3">
                <input
                  type="search"
                  class="form-control form-control-appended"
                  placeholder="Buscar" />
                <div class="input-group-append">
                  <div class="input-group-text">
                    <span class="mdi mdi-magnify" />
                  </div>
                </div>
              </div>
            </div>
            <button class="btn m-b-30 ml-2 mr-2 ml-3 btn-primary"
              data-toggle="modal"
              data-target="#modalUsuario">
              <i class="mdi mdi-account-plus" />
              Nuevo usuario
            </button>
          </div>
        </div>

        <div class="col-lg-12">
          <div class="card m-b-30">
            <div class="card-header">
              <h5 class="m-b-0">Usuarios</h5>

            </div>
            <div class="card-body">
              <div class="m-b-30">
                <div class="table-responsive">
                  <table class="table align-td-middle">
                    <thead>
                      <tr>
                        <th>Nombres</th>
                        <!-- <th>Usuario</th> -->
                        <th>Correo</th>
                        <th>Telefono</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each usuarios as usuario}
                         <!-- content here -->
                         <tr>
                           <td>
                             <div class="avatar avatar-sm mr-2 d-block-sm">
                               <div class="avatar avatar-sm">
                                 <span class="avatar-title rounded-circle ">{usuario.name[0]}</span>
                               </div>
                             </div>
                             <span>{usuario.name}</span>
                           </td>
                           <td>{usuario.email}</td>
                           <td>{usuario.phoneNumber || 'N/A'}</td>
                           <td>
                             <div style="width: 150px; text-align: right;" class="ml-auto">
                               <a href="#/Medico/Perfil/id">
                                 <i class=" mdi-24px mdi mdi-doctor" />
                               </a>
                               <a href="#!"
                                 data-toggle="modal"
                                 style="cursor: pointer;"
                                 data-placement="top"
                                 data-target="#modalUsuario"
                                 data-original-title="Modificar usuario"
                                 class="icon-table hover-cursor">
                                 <i class=" mdi-24px mdi mdi-circle-edit-outline" />
                               </a>
                               <a href="#!"
                                 data-toggle="modal"
                                 data-target="#modalRoles"
                                 data-placement="bottom"
                                 title="Asignar Roles"
                                 class="icon-rol"
                                 on:click={() => cargarRolUsuario(usuario.id)}>
                                 <i class=" mdi-24px mdi mdi-security" />
                               </a>
                               
                             </div>
                           </td>
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
    </div>
  </section>
</main>

<form id="frmUsuario" on:submit|preventDefault={guardarUsuario} >
  <div class="modal fade modal-slide-right"
    id="modalUsuario"
    tabindex="-1"
    role="dialog"
    aria-labelledby="modalUsuarioLabel"
    style="display: none; padding-right: 16px;"
    aria-modal="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="modalUsuarioLabel">Usuario</h5>
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
                <label for="">Prefijo</label>
                <select
                  class="form-control"
                  name="prefijo" required bind:value={sltPrefijo}>
                  <option value="" disabled>- Seleccionar -</option>
                  {#each prefijos as prefijo}
                     <!-- content here -->
                     <option value={prefijo.value}>{prefijo.name}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group col-md-12">
                <label for="">Nombre Completo</label>
                <input
                  type="name"
                  class="form-control"
                  placeholder="Ing. John Doe"
                  name="Name"
                  maxlength="200"
                  required bind:value={inpNombre} />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group col-md-12" style="display: none;">
                <label for="">Usuario</label>
                <input
                  type="email"
                  class="form-control"
                  autocomplete="off"
                  name="UserName"
                  id=""
                  maxlength="100" />
              </div>
              <div class="form-group col-md-12">
                <label for="">Email</label>
                <input
                  type="email"
                  required
                  class="form-control"
                  placeholder="usuario@correo.com"
                  autocomplete="off"
                  name="Email"
                  id="txtCorreo"
                  maxlength="100" bind:value={inpEmail} />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group col-md-12">
                <label for="">Contraseña</label>
                <input
                  type="password"
                  class="form-control"
                  required
                  name="PasswordHash"
                  maxlength="50" bind:value={inpPassword} />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col-md-12">
                <label for="">Telefono</label>
                <input
                  type="text"
                  class="form-control"
                  data-mask="(000) 000-0000"
                  data-mask-clearifnotmatch="true"
                  autocomplete="off"
                  maxlength="14"
                  placeholder="(809) 000-0000" bind:value={inpTelefono}/>
              </div>
            </div>
            <br />
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

<div
  class="modal fade modal-slide-right"
  id="modalRoles"
  tabindex="-1"
  role="dialog"
  aria-labelledby="modalRolesLabel"
  style="display: none; padding-right: 16px;"
  aria-modal="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modalRolesLabel">Roles </h5>
        <button
          type="button"
          class="close"
          data-dismiss="modal"
          aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div class="modal-body">

        <form>
          <input type="hidden" name="idPaciente" value="" />
          <p>
            <span class="badge badge-soft-primary" style="font-size: 17px;" />
          </p>
          <div class="form-group floating-label">
            <label>Buscar</label>
            <input
              type="text"
              class="form-control"
              placeholder="Buscar roles" />
          </div>
          <div class="roles">
            {#each filterRoles as rol}
               <!-- content here -->
               <div class="lista-rol m-b-10">
                 <label class="cstm-switch d-flex bd-highlight">
                   <span class="cstm-switch-description mr-auto bd-highlight">
                     {rol.displayName}
                   </span>
                      <!-- content here -->
                      <input
                        type="checkbox"
                        value={rol.id}
                        bind:group={rol.name}
                        bind:checked={rol.checked}
                        class="cstm-switch-input" on:change={cambiarRol(rol.name, rol.checked)}/>
                   <span class="cstm-switch-indicator bg-success bd-highlight" />
                 </label>
               </div>
            {/each}

          </div>
        </form>

      </div>
    </div>
  </div>
</div>
