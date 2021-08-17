<script>
  import { link } from "svelte-spa-router";
  import active from 'svelte-spa-router/active'
</script>

<aside class="admin-sidebar">
  <div class="admin-sidebar-brand">
    <!-- begin sidebar branding-->
    <img
      class="admin-brand-logo"
      src="assets/img/logo.svg"
      width="40"
      alt="atmos Logo" />
    <span class="admin-brand-content">
      <a href="/" use:link>Gestor de Citas</a>
    </span>
    <!-- end sidebar branding-->
    <div class="ml-auto">
      <!-- sidebar pin-->
      <a href="#!" class="admin-pin-sidebar btn-ghost btn btn-rounded-circle">
        <!--  -->
      </a>
      <!-- sidebar close for mobile device-->
      <a href="#!" class="admin-close-sidebar">
        <!--  -->
      </a>
    </div>
  </div>
  <div class="admin-sidebar-wrapper js-scrollbar">
    <!-- Menu List Begins-->
    <ul class="menu">
      <!--list item begins-->
      <li class="menu-item" use:active={'/'}>
        <a href="/" use:link class="menu-link">
          <span class="menu-label">
            <span class="menu-name">Escritorio</span>
          </span>
          <span class="menu-icon">
            <i class="icon-placeholder mdi mdi-view-dashboard-outline" />
          </span>
        </a>
      </li>
      <!--list item ends-->
      <li class="menu-item" use:active={'/citas/gestion'}>
        <a href="/citas/gestion" use:link class="menu-link">
          <span class="menu-label">
            <span class="menu-name">Citas programadas</span>
          </span>
          <span class="menu-icon">
            <i class="icon-placeholder mdi mdi-calendar-check" />
          </span>
        </a>
      </li>
      <!--list item ends-->

      <!--list item begins-->
      <!-- <li class="menu-item" use:active={'/Medico/EspacioTrabajo'}
        class:d-none={!user.isAny(['doctor', 'admin'])}>
        <a href="/Medico/EspacioTrabajo" use:link class="menu-link">
          <span class="menu-label">
            <span class="menu-name">Espacio del medico</span>
          </span>
          <span class="menu-icon">
            <i class="icon-placeholder mdi mdi-doctor" />
          </span>
        </a>
      </li>  -->
      <!--list item ends-->

      <!--list item begins-->
      <li
        class="menu-item " use:active={'/Usuario/*'} 
        class:d-none={false}>
        <a href="#!" class="open-dropdown menu-link">
          <span class="menu-label">
            <span class="menu-name">
              Mantenimiento
              <span class="menu-arrow" />
            </span>
            <span class="menu-info">Usuarios...</span>
          </span>
          <span class="menu-icon">
            <i class="icon-placeholder mdi mdi-settings-outline" />
          </span>
        </a>
        <!--submenu-->
        <ul class="sub-menu">
          <li class="menu-item" use:active={'/Usuario/Index'}>
            <a href="/Usuario/Index" use:link class=" menu-link">
              <span class="menu-label">
                <span class="menu-name">Usuarios</span>
              </span>
              <span class="menu-icon">
                <i class="icon-placeholder ">U</i>
              </span>
            </a>
          </li>
          <li class="menu-item" use:active={'/mantenimiento/consultorios'}>
            <a href="/mantenimiento/consultorios" use:link class=" menu-link">
              <span class="menu-label">
                <span class="menu-name">Consultorios</span>
              </span>
              <span class="menu-icon">
                <i class="icon-placeholder ">C</i>
              </span>
            </a>
          </li>
        </ul>
      </li>
    </ul>
    <!-- Menu List Ends-->
  </div>
</aside>
