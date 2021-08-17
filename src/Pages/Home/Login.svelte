<script>
  import axios from 'axios';
import { push } from 'svelte-spa-router';
  import { url } from '../../util';

  let username = '';
  let password = '';

  const login = () => {
    const data = {
      username,
      password
    };
    const config = {
      method: 'post',
      url: `${url}/users/login`,
      data,
    };
    axios(config)
      .then(res => {
        console.log(res.data)
        localStorage.setItem('access_token', res.data.access_token)
        if(localStorage.getItem('access_token')){
          push('/')
        }
      })
      .catch(err => {
        console.error(err)
      })
  }
</script>
<div class="container-fluid">
  <div class="row ">
      <div class="col-lg-4  bg-white">
          <div class="row align-items-center m-h-100">
              <div class="mx-auto col-md-8">
                  <div class="p-b-20 text-center">
                      <p>
                          <img src="assets/img/logo.svg" width="80" alt="">

                      </p>
                      <p class="admin-brand-content">
                          atmos
                      </p>
                  </div>
                  <h3 class="text-center p-b-20 fw-400">Login</h3>
                  <form class="needs-validation" on:submit|preventDefault={login}>
                      <div class="form-row">
                          <div class="form-group floating-label col-md-12">
                              <label>Email</label>
                              <input type="email" required="" class="form-control" bind:value={username} placeholder="Email">
                          </div>
                          <div class="form-group floating-label col-md-12">
                              <label>Password</label>
                              <input type="password" required="" bind:value={password} class="form-control ">
                          </div>
                      </div>

                      <button type="submit" class="btn btn-primary btn-block btn-lg">Login</button>

                  </form>
                  <p class="text-right p-t-10">
                      <a href="#!" class="text-underline">Forgot Password?</a>
                  </p>
              </div>

          </div>
      </div>
      <div class="col-lg-8 d-none d-md-block bg-cover" style="background-image: url('assets/img/login.svg');">

      </div>
  </div>
</div>