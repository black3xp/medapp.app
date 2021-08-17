<script>
  import { createEventDispatcher } from 'svelte';
  import { axios, errorConexion } from "../store.js";
  import moment from 'moment';
  import Swal from 'sweetalert2';

  export let horario = {};
  $: invisible = horario.inactivo;

  const dispatch = createEventDispatcher();

  function validarHora(hora, tanda) {
    if (tanda == 1) {
      let time = hora.split(':')
      let hours = parseInt(time[0]) - 12
      return hours.toString().padStart(2, '0') + ':' + time[1]
    } else {
      let time = hora.split(':')
      let hours = parseInt(time[0]) + 12
      return hours + ':' + time[1]
    }
  }
  function mensajeTanda(tanda, texto) {
    if (tanda == 1) {
      Swal.fire({
        title: 'Información',
        text: 'Hora '+ texto +' de la tanda matutina incorrecta!',
        icon: 'info'
      });
    } else {
      Swal.fire({
        title: 'Información',
        text: 'Hora '+ texto +' de la tanda vespertina incorrecta!',
        icon: 'info'
      });
    }
  }

  function cambiarHorario(e) {
    if (horario.tandaID == 1) {
      if (horario.horaInicio > '11:59') {
        mensajeTanda(1, 'inicio')
        horario.horaInicio = validarHora(horario.horaInicio, 1)
        return;
      }
      if (horario.horaFin > '11:59') {
        mensajeTanda(1, 'fin')
        horario.horaFin = validarHora(horario.horaFin, 1)
        return;
      }
    } else {
      if (horario.horaInicio < '12:00') {
        mensajeTanda(2, 'inicio')
        horario.horaInicio = validarHora(horario.horaInicio, 2)
        return;
      }
      if (horario.horaFin < '12:00') {
        mensajeTanda(2, 'fin')
        horario.horaFin = validarHora(horario.horaFin, 2)
        return;
      }
    }

    let obj = {
      MedicoID: horario.medicoID,
      Dia: horario.dia,
      TandaID: horario.tandaID,
      HoraInicio: horario.horaInicio,
      HoraFin: horario.horaFin,
      Intervalo: horario.intervalo
    };

    if (!isNaN(horario.intervalo)) {
      // let hora = moment(obj.HoraInicio, 'HH:mm');
      // hora.add(obj.Intervalo, 'minutes');

      // if (hora.format('HH:mm') > obj.HoraFin) {
      //   console.log('hora inicio mayor que hora fin')
      // }
      
      $axios.put("/Horarios", obj)
      .then(res => {
        dispatch('cambioHorario')
      }).catch(err => {
        console.error(err);
        $errorConexion()
      });
    }
  }
</script>

{#if !invisible}

  <div class="row">
    <div class="col-lg-12 mt-3">
      <div class="alert alert-secondary" role="alert">
        <h4 class="alert-heading">{horario.tanda}</h4>
        <hr />
        <div class="row">
          <div class="col-lg-3">
            <div class="form-group ">
              <label class="font-secondary">Hora de inicio</label>
              <input
                type="time"
                class="form-control"
                bind:value={horario.horaInicio}
                on:change={cambiarHorario} />
            </div>
          </div>
          <div class="col-lg-3">
            <div class="form-group ">
              <label class="font-secondary">Hora fin</label>
              <input
                type="time"
                class="form-control"
                bind:value={horario.horaFin}
                on:change={cambiarHorario} />
            </div>
          </div>
          <div class="col-lg-3">
            <div class="form-group">
              <label>Intervalo (Minutos)</label>
              <input
                type="number"
                class="form-control"
                bind:value={horario.intervalo}
                on:input={cambiarHorario} />
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
{/if}
