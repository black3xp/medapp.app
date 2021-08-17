<script>
  import { push } from "svelte-spa-router";
  import {url} from '../../util';
  import Swal from 'sweetalert2';
  import { axios } from "axios";

  let loginFail = false;
  let username = "";
  let password = "";
  let cargando = false;

  jQuery('.modal-backdrop').hide();

  const iniciar = function() {
    cargando = true;
    loginFail = false;

    const data = {
      username,
      password,
    }

    const config = {
      method: 'post',
      url: `${url}/Users/LogIn`,
      data,
    }

    axios(config)
      .then(res => {
        console.log(res)
      })
      .catch(err =>{
        console.error(err)
      })

    // login(_session, url + "/Users/LogIn", username, password)
    //   .then(x => {
    //     console.log(x)
    //   }).catch(e => {
    //     loginFail = true;
    //     cargando = false;
    //     Swal.fire({
    //       title: 'Error de conexion',
    //       text: 'Hubo un problema al conectar al servidor!',
    //       icon: 'error'
    //     });
    //   }) 
  }
</script>

<style>

</style>

<main>
  <div class="container-fluid">
    <div class="row ">
      <div class="col-lg-4 bg-white">
        <div class="row align-items-center m-h-100">
          <div class="mx-auto col-md-8">
            <div class="p-b-20 text-center" />
            <h3 class="text-center p-b-20 fw-400">Entrar</h3>
            <form
              class="needs-validation"
              action=""
              on:submit|preventDefault={iniciar}>
              <div class="form-row">
                <div class="form-group floating-label col-md-12">
                  <label>Correo electronico</label>
                  <input
                    type="username"
                    required
                    class="form-control"
                    placeholder="Correo electronico"
                    bind:value={username} />
                </div>
                <div class="form-group floating-label col-md-12">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    required
                    placeholder="Contraseña"
                    class="form-control "
                    bind:value={password} />
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg">
                Iniciar sesión
              </button>
              {#if loginFail}
                <div class="alert alert-danger mt-2" role="alert">
                  Usuario y contraseña no coinciden
                </div>
              {/if}
              {#if cargando}
                <div class="alert alert-primary mt-2" role="alert">
                  Cargando...
                </div>
              {/if}

            </form>
          </div>

        </div>
      </div>
      <div
        class="col-lg-8 d-none d-md-block bg-cover"
        style="background-image: url('assets/img/login.svg');" />
    </div>
  </div>
</main>
