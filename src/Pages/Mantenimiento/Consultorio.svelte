<script>
    import Aside from "../../Layout/Aside.svelte";
    import Header from "../../Layout/Header.svelte";
    import { activePage, session, axios, toast } from "../../store.js";
    import { onMount } from "svelte";
    import { push, link } from "svelte-spa-router";
    export let params = [];
    $axios.defaults.headers.common = {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
    };
    let horaFin = [];
    let horaInicio = [];
    let intervalo = "";
    let dia = "";
    let horarios = []
    let nombreConsultorio = ''
    let dias = [
        { id: 1, descripcion: "Lunes" },
        { id: 2, descripcion: "Martes" },
        { id: 3, descripcion: "Miercoles" },
        { id: 4, descripcion: "Jueves" },
        { id: 5, descripcion: "Viernes" },
        { id: 6, descripcion: "Sabado" },
        { id: 7, descripcion: "Domingo" },
    ];
    let citas = []
    let asistentes = []
    let usuarios = []
    let sltAsistente = ""
    onMount(() => {
        cargarHorario()
        // cargarCitas()
        cargarAsistentes()
        cargarUsuarios()
    });

    function agregarUsuarioConsultorio(event){
        let usuarioId = event.target.value
        let user = {
            consultorioId: params.idConsultorio,
            userId: usuarioId
        }
        $axios.post(`consultoriosUsuarios`, user)
        .then(res => {
            cargarAsistentes()
            sltAsistente = ""
        })
    }

    function cargarAsistentes(){
        $axios.get(`consultorios/${params.idConsultorio}/usuarios`)
        .then(res => {
            asistentes = res.data
        })
    }

    function cargarUsuarios(){
        $axios.get('users')
        .then(res => {
            usuarios = res.data
        })
    }

    function agregarHorario() {
        let horario = {
            consultorioId: params.idConsultorio,
            dia: dia,
            horaInicio: horaInicio,
            horaFin: horaFin,
            intervalo: intervalo,
            limiteSimultaneo: 1,
            limite: 0,
        };
        $axios.post('/horarios', horario)
        .then(res => {
            $toast(5000).fire({
                icon: 'success',
                title: 'Se agrego el consultorio'
            })
            jQuery('#modalAgregarHorario').modal('hide')
            cargarHorario()
        })
    }

    function cargarHorario() {
        $axios.get(`/horarios?consultorioId=${params.idConsultorio}`)
        .then(res => {
            horarios = res.data
            if(horarios.length !== 0) {
                nombreConsultorio = horarios[0].consultorio
            }
        })
    }

    // function cargarCitas() {
    //     $axios.get(`/citas?consultorioId=${params.idConsultorio}`)
    //     .then(res => {
    //         citas = res.data
    //         console.log(citas)
    //     })
    // }

    function convertirHora (time) {
        time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

        if (time.length > 1) { 
            time = time.slice (1); 
            time[5] = +time[0] < 12 ? ' AM' : ' PM';
            time[0] = +time[0] % 12 || 12;
        }
        return time.join ('');
    }

</script>

<Aside />

<main class="admin-main">
    <Header />
    <section class="admin-content">
        <div class="container mt-3">
            <div class="row">
                <div class="col-sm-12 col-lg-4">
                    <div class="card m-b-30">
                        <div class="card-header"></div>
                        <div class="card-body">
                            <div class="text-center">
                                <div>
                                    <div class="avatar avatar-xl avatar-online"><img class="avatar-img rounded-circle"
                                            src="assets/img/users/user-5.jpg" alt="name"></div>
                                </div>
                                <h3 class="p-t-10 searchBy-name">{nombreConsultorio}</h3>
                            </div>
                            <div class="text-muted text-center"></div>
                            <p class="text-muted text-center" style="margin-bottom: 0px;"></p>
                            <p class="text-muted text-center" style="margin-bottom: 0px;"></p>
                            <p class="text-muted text-center"></p>
                            <!-- <div class="row text-center p-b-10">
                                <div class="col"><a href="#!">
                                        <h3 class="mdi mdi-timetable"></h3>
                                        <div class="text-overline">Horario</div>
                                    </a></div>
                                <div class="col"><a href="#/">
                                        <h3 class="mdi mdi-account-edit"></h3>
                                        <div class="text-overline">Editar Perfil</div>
                                    </a></div>
                            </div> -->
                        </div>
                    </div>
                </div>
                <div class="col-lg-8">
                    <div class="card mb-4">
                        <h5 class="card-header">
                            Asistentes 
                        </h5>
                        <div class="card-controls">
                                <div class="form-group">
                                    <select id="" class="form-control form-control-sm" bind:value={sltAsistente} on:change={agregarUsuarioConsultorio}>
                                        <option value="" selected disabled> - seleccionar usuario - </option>
                                        {#each usuarios as usuario}
                                             <!-- content here -->
                                             <option value={usuario.id} >{usuario.name}</option>
                                        {/each}
                                    </select>
                                </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-lg-12 mt-3">
                                    <div class="table-responsive">
                                        <table class="table table-hover ">
                                            <thead>
                                                <tr>
                                                    <th>Nombre</th>
                                                    <th />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {#each asistentes as asistente}
                                                     <!-- content here -->
                                                     <tr>
                                                         <td>{asistente.prefix} {asistente.name}</td>
                                                         <td class="text-right"><button class="btn btn-danger btn-sm"><i class="mdi mdi-trash-can-outline"></i></button></td>
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
                <!-- <h5 class="card-header col-lg-12">
                    Citas
                </h5>
                <div class="col-lg-12">
                    <div class="table-responsive">
                        <table class="table align-td-middle table-card">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Cedula</th>
                                    <th>Fecha</th>
                                    <th>Telefono</th>
                                    <th>Estado</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {#each citas as cita}
                                    <tr class:bg-soft-danger={cita.estado == 'Cancelada / Renegada'}>
                                        <td>
                                            <div class="avatar avatar-sm mr-2 d-block-sm">
                                                <div class="avatar avatar-sm">
                                                    <span class="avatar-title rounded-circle ">{cita.nombre[0]}</span>
                                                </div>
                                            </div>
                                            <span>{cita.nombre} {cita.apellidos}</span>
                                        </td>
                                        <td>{cita.cedula}</td>
                                        <td>{new Date(cita.fecha).toLocaleDateString('es-DO')}</td>
                                        <td>{cita.telefono}</td>
                                        <td>{cita.estado}</td>
                                        <th />
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div> -->

                
                <div class="col-lg-6 mt-4">
                    <div class="card mb-4">
                        <h5 class="card-header">
                            Horarios <button
                                class="btn btn-primary btn-sm"
                                data-toggle="modal"
                                data-target="#modalAgregarHorario"
                                ><i class="mdi mdi-calendar-plus" /> AGREGAR</button>
                        </h5>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-lg-12 mt-3">
                                    <div class="table-responsive">
                                        <table class="table table-hover ">
                                            <thead>
                                                <tr>
                                                    <th>Dia</th>
                                                    <th>Inicia</th>
                                                    <th>Termina</th>
                                                    <th>Intervalo</th>
                                                    <th />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {#each horarios as horario}
                                                     <!-- content here -->
                                                     <tr>
                                                         <td>{horario.diaSemana}</td>
                                                         <td>{convertirHora(horario.horaInicio)}</td>
                                                         <td>{convertirHora(horario.horaFin)}</td>
                                                         <td>Cada {horario.intervalo}/min</td>
                                                         <th />
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
        </div>
    </section>
</main>

<form id="frmUsuario" autocomplete="off" on:submit|preventDefault={agregarHorario}>
    <div
        class="modal fade modal-slide-right"
        id="modalAgregarHorario"
        tabindex="-1"
        role="dialog"
        aria-labelledby="modalAgregarHorarioLabel"
        style="display: none; padding-right: 16px;"
        aria-modal="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalAgregarHorarioLabel">
                        Agregar horario
                    </h5>
                    <button
                        type="button"
                        class="close"
                        data-dismiss="modal"
                        aria-label="Close">
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div
                    class="modal-body"
                    style="height: 100% !important; top: 0; overflow: auto;">
                    <input type="hidden" name="IdUser" value="0" />

                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Dia</label>
                            <select
                                class="form-control"
                                required
                                bind:value={dia}>
                                <option value="" disabled selected>- Seleccionar -</option>
                                {#each dias as dia}
                                    <!-- content here -->
                                    <option value={dia.id}
                                        >{dia.descripcion}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="form-group col-md-12">
                            <label for="">Hora de inicio</label>
                            <input
                                class="form-control"
                                required
                                type="time" bind:value={horaInicio}/>
                        </div>
                        <div class="form-group col-md-12">
                            <label for="">Hora fin</label>
                            <input
                                class="form-control"
                                required
                                type="time" bind:value={horaFin}/>
                        </div>
                        <div class="form-group col-md-12">
                            <label for="">Intervalo (minutos)</label>
                            <input
                                class="form-control"
                                required
                                type="number" bind:value={intervalo}/>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button
                        type="button"
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
