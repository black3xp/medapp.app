import Index from './Pages/Home/Index.svelte'
import Login from './Pages/Home/Login.svelte'
import AsistenteIndex from './Pages/Asistente/Index.svelte'
import AsistenteCitas from './Pages/Asistente/CitasProgramadas.svelte'
import CitaCrear from './Pages/Cita/Crear.svelte'
import CrearCitaServicios from './Pages/Cita/CrearCita.svelte'
import CitasIndex from './Pages/Cita/Index.svelte'
import DetalleCita from './Pages/Cita/DetalleCita.svelte'
import Gestion from './Pages/Cita/Gestion.svelte'
import UsuarioIndex from './Pages/Usuario/Index.svelte'
import MedicoPerfil from './Pages/Medico/Perfil.svelte'
import MedicoEspacioTrabajo from "./Pages/Medico/EspacioTrabajo.svelte"
import SolicitudIndex from "./Pages/Solicitudes/SolicitudIndex.svelte"
import SolicitudDetalle from "./Pages/Solicitudes/SolicitudDetalle.svelte"
import MantenimientoSolicitudes from './Pages/Mantenimiento/Solicitudes.svelte'
import AdminConsultorio from './Pages/Mantenimiento/Consultorio.svelte'
import MantenimientoConsultorios from './Pages/Mantenimiento/Consultorios.svelte'
import Error404 from './Pages/Home/Error404.svelte'
import Unauthorized from './Pages/Home/Unauthorized.svelte'
import { UserManager } from './util.js';
import { session } from "./store";
import { wrap } from 'svelte-spa-router/wrap';

let $session = null;
session.subscribe(x => $session = x);
let user = new UserManager(localStorage.getItem('access_token'));

const routes = {
    '/': wrap({
        component: Index,
        conditions: [() => $session.isValid]
    }),
    "/Home/Index": wrap({
        component: Index,
        conditions: [() => $session.isValid]
    }),
    "/Home/Login": wrap({
        asyncComponent: () => Login,
        conditions: [
            (detail) => {
                if (!$session.isValid) {
                    return true;
                } else {
                    detail.userData = "i"
                    return false;
                }
            },
        ]
    }),
    "/Usuario/Index": wrap({
        asyncComponent: () => UsuarioIndex,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            // (detail) => {
            //     user.asign(localStorage.getItem('access_token'))
            //     if (user.is('admin')) {
            //         return true
            //     } else {
            //         detail.userData = "r"
            //         return false
            //     }
            // }
        ]
    }),
    "/Asistente/Index": wrap({
        asyncComponent: () => AsistenteIndex,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            (detail) => {
                user.asign(localStorage.getItem('access_token'))
                if (user.isAny(['assistant', 'admin'])) {
                    return true
                } else {
                    detail.userData = "r"
                    return false
                }
            }
        ]
    }),
    "/Asistente/CitasProgramadas": wrap({
        asyncComponent: () => AsistenteCitas,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            (detail) => {
                user.asign(localStorage.getItem('access_token'))
                if (user.isAny(['assistant', 'doctor', 'admin'])) {
                    return true
                } else {
                    detail.userData = "r"
                    return false
                }
            }
        ]
    }),
    "/Cita/Gestionar": wrap({
        asyncComponent: () => Gestion,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            (detail) => {
                user.asign(localStorage.getItem('access_token'))
                if (user.isAny(['assistant', 'operator', 'admin'])) {
                    return true
                } else {
                    detail.userData = "r"
                    return false
                }
            }
        ]
    }),
    "/Cita/Crear": wrap({
        asyncComponent: () => CitaCrear,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            (detail) => {
                user.asign(localStorage.getItem('access_token'))
                if (user.isAny(['assistant', 'operator', 'admin'])) {
                    return true
                } else {
                    detail.userData = "r"
                    return false
                }
            }
        ]
    }),
    "/Cita/CrearCita": wrap({
        asyncComponent: () => CrearCitaServicios,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            (detail) => {
                user.asign(localStorage.getItem('access_token'))
                if (user.isAny(['assistant', 'operator', 'admin'])) {
                    return true
                } else {
                    detail.userData = "r"
                    return false
                }
            }
        ]
    }),
    "/Cita/DetalleCita/:id": wrap({
        asyncComponent: () => DetalleCita,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            (detail) => {
                user.asign(localStorage.getItem('access_token'))
                if (user.isAny(['assistant', 'operator', 'admin'])) {
                    return true
                } else {
                    detail.userData = "r"
                    return false
                }
            }
        ]
    }),
    "/Medico/Perfil/:id": wrap({
        asyncComponent: () => MedicoPerfil,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            (detail) => {
                user.asign(localStorage.getItem('access_token'))
                if (user.isAny(['assistant', 'operator', 'admin'])) {
                    return true
                } else {
                    detail.userData = "r"
                    return false
                }
            }
        ]
    }),
    "/Citas/Index": wrap({
        asyncComponent: () => CitasIndex,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            (detail) => {
                user.asign(localStorage.getItem('access_token'))
                if (user.isAny(['assistant', 'operator', 'admin'])) {
                    return true
                } else {
                    detail.userData = "r"
                    return false
                }
            }
        ]
    }),
    "/Medico/EspacioTrabajo": wrap({
        asyncComponent: () => MedicoEspacioTrabajo,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            (detail) => {
                user.asign(localStorage.getItem('access_token'))
                if (user.isAny(['doctor', 'admin'])) {
                    return true
                } else {
                    detail.userData = "r"
                    return false
                }
            }
        ]
    }),
    "/Mantenimiento/Solicitudes": wrap({
        asyncComponent: () => MantenimientoSolicitudes,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            (detail) => {
                user.asign(localStorage.getItem('access_token'))
                if (user.isAny(['admin'])) {
                    return true
                } else {
                    detail.userData = "r"
                    return false
                }
            }
        ]
    }),
    "/Mantenimiento/Consultorios": wrap({
        asyncComponent: () => MantenimientoConsultorios,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            // (detail) => {
            //     user.asign(localStorage.getItem('access_token'))
            //     if (user.isAny(['admin'])) {
            //         return true
            //     } else {
            //         detail.userData = "r"
            //         return false
            //     }
            // }
        ]
    }),
    "/Mantenimiento/Consultorios/:idConsultorio": wrap({
        asyncComponent: () => AdminConsultorio,
        conditions: [
            (detail) => {
                if ($session.isValid) {
                    return true;
                } else {
                    detail.userData = "s"
                    return false;
                }
            },
            // (detail) => {
            //     user.asign(localStorage.getItem('access_token'))
            //     if (user.isAny(['admin'])) {
            //         return true
            //     } else {
            //         detail.userData = "r"
            //         return false
            //     }
            // }
        ]
    }),
    "/Solicitud/Index": wrap({
        asyncComponent: () => SolicitudIndex,
        // conditions: [
        //     (detail) => {
        //         if ($session.isValid) {
        //             return true;
        //         } else {
        //             detail.userData = "s"
        //             return false;
        //         }
        //     },
        //     (detail) => {
        //         user.asign(localStorage.getItem('access_token'))
        //         if (user.isAny(['doctor', 'admin'])) {
        //             return true
        //         } else {
        //             detail.userData = "r"
        //             return false
        //         }
        //     }
        // ]
    }),
    "/Solicitud/Detalle/:id": wrap({
        asyncComponent: () => SolicitudDetalle,
        // conditions: [
        //     (detail) => {
        //         if ($session.isValid) {
        //             return true;
        //         } else {
        //             detail.userData = "s"
        //             return false;
        //         }
        //     },
        //     (detail) => {
        //         user.asign(localStorage.getItem('access_token'))
        //         if (user.isAny(['doctor', 'admin'])) {
        //             return true
        //         } else {
        //             detail.userData = "r"
        //             return false
        //         }
        //     }
        // ]
    }),
    "/Home/Unauthorized": wrap({
        asyncComponent: () => Unauthorized,
        conditions: [() => $session.isValid]
    }),
    "*": wrap({
        asyncComponent: () => Error404
    })
}

export default routes;