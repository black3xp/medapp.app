<script>
  import { createEventDispatcher } from 'svelte';
  import { axios, errorConexion } from "../store.js";

  export let i = {};
  export let horarios = {};
  export let dia = {};
  export let medicoID = {};

  const dispatch = createEventDispatcher();

  $: checked = horarios.some(
    x => x.dia == dia && x.tandaID == i.id && !x.inactivo
  );
  function cambiarCheck(e) {
    let hr = {
      MedicoID: medicoID,
      Dia: dia ,
      TandaID: i.id,
      HoraInicio: i.id == 1 ? '08:00' : '12:00',
      HoraFin: i.id == 1 ? '08:30' : '12:30',
      Intervalo: 30
    }

    if (e.target.checked) { // Si la tanda esta marcada
      hr = {
        MedicoID: medicoID,
        Dia: dia ,
        TandaID: i.id,
        HoraInicio: i.id == 1 ? '08:00' : '12:00',
        HoraFin: i.id == 1 ? '08:30' : '12:30',
        Intervalo: 30,
        Inactivo: false
      }

      if (horarios.some(x => x.dia == dia && x.tandaID == i.id)) { // Si existe horario en ese dia y tanda
        $axios.put("/Horarios", hr)
        .then(res => {
          dispatch('cambioHorario')
        }).catch(err => {
          console.error(err);
          $errorConexion()
        });
      } else { // Si no existe horario en ese dia y tanda
        $axios.post("/Horarios", hr)
        .then(res => {
          dispatch('cambioHorario')
        }).catch(err => {
          console.error(err);
          $errorConexion()
        });
      }
    } else { // Si la tanda se desmarca
      hr = {
        MedicoID: medicoID,
        Dia: dia ,
        TandaID: i.id,
        HoraInicio: i.id == 1 ? '08:00' : '12:00',
        HoraFin: i.id == 1 ? '08:30' : '12:30',
        Intervalo: 30,
        Inactivo: true
      }

      $axios.put("/Horarios", hr)
      .then(res => {
          dispatch('cambioHorario')
        }).catch(err => {
          console.error(err);
          $errorConexion()
        });
    }
  }


</script>

<label class="cstm-switch ml-3 mr-3 mb-2">
  <input
    type="checkbox"
    name="option"
    value={i.id}
    on:change={cambiarCheck}
    {checked}
    class="cstm-switch-input" />
  <span class="cstm-switch-indicator bg-success " />
  <span class="cstm-switch-description">{i.nombre}</span>
</label>
