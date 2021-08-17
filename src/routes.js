import Index from './Pages/Home/Index.svelte'
import Login from './Pages/Home/Login.svelte'
import Error404 from './Pages/Home/Error404.svelte'
import Unauthorized from './Pages/Home/Unauthorized.svelte'
import { isLogin } from './util.js';
import { wrap } from 'svelte-spa-router/wrap';
import { push } from 'svelte-spa-router';

import GestionCitas from './Pages/Citas/Gestion.svelte';
import MantenimientoConsultorio from './Pages/Mantenimiento/Consultorios.svelte';
import MantenimientoConsultorioId from './Pages/Mantenimiento/Consultorio.svelte';
import Usuarios from './Pages/Usuario/Index.svelte';

const routes = {
    "/": wrap({
        component: Index,
        conditions: [
            async (detail) => {
                if (isLogin()) {
                    return true
                }
                else {
                    return push('/home/login')
                }
            }
        ]
    }),
    "/home/login": wrap({
        asyncComponent: () => Login,
        conditions: [
            (detail) => {
                if (!isLogin()) {
                    return true;
                } else {
                    return false;
                }
            },
        ]
    }),
    "/citas/gestion": wrap({
        component: GestionCitas,
        conditions: [
            async (detail) => {
                if (isLogin()) {
                    return true
                }
                else {
                    return push('/home/login')
                }
            }
        ]
    }),
    "/mantenimiento/consultorios": wrap({
        component: MantenimientoConsultorio,
        conditions: [
            async (detail) => {
                if (isLogin()) {
                    return true
                }
                else {
                    return push('/home/login')
                }
            }
        ]
    }),
    "/mantenimiento/consultorios/:idConsultorio": wrap({
        component: MantenimientoConsultorioId,
        conditions: [
            async (detail) => {
                if (isLogin()) {
                    return true
                }
                else {
                    return push('/home/login')
                }
            }
        ]
    }),
    "/usuario/index": wrap({
        component: Usuarios,
        conditions: [
            async (detail) => {
                if (isLogin()) {
                    return true
                }
                else {
                    return push('/home/login')
                }
            }
        ]
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