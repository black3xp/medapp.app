import Index from './Pages/Home/Index.svelte'
import Login from './Pages/Home/Login.svelte'
import Error404 from './Pages/Home/Error404.svelte'
import Unauthorized from './Pages/Home/Unauthorized.svelte'
import { isLogin } from './util.js';
import { wrap } from 'svelte-spa-router/wrap';

const routes = {
    '/': wrap({
        component: Index,
        conditions: [() => isLogin()]
    }),
    "/Home/Index": wrap({
        component: Index,
        conditions: [() => isLogin]
    }),
    "/Home/Login": wrap({
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
    "/Home/Unauthorized": wrap({
        asyncComponent: () => Unauthorized,
        conditions: [() => $session.isValid]
    }),
    "*": wrap({
        asyncComponent: () => Error404
    })
}

export default routes;