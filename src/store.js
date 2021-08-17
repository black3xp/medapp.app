import { writable, readable } from "svelte/store"
import { Session } from "svelte-session-manager"
import { HubConnectionBuilder } from '@microsoft/signalr'
import Axios from "axios";
import Swal from 'sweetalert2';

//const _host = "http://192.168.1.124:91";
const _host = "https://medapp-api.cthrics.com";
//const _host = "http://172.20.1.12:303";
//const _host = "https://odyssey-api.cmsiglo21.app";

const axiosInstance = Axios.create({
  baseURL: _host + "/api"
});

export const axios = writable(axiosInstance);
export const connection = writable(new HubConnectionBuilder()
  .withUrl(_host + "/hub", {
    accessTokenFactory: () => localStorage.getItem('access_token'),
  }).build());

export const session = writable(new Session(window.localStorage));

export const activePage = writable("home.index");
export const dataCita = writable({});
export const host = readable(_host + "/api");

const errorConn = () => {
  Swal.fire({
    title: 'Error',
    text: 'Ocurrio un problema al intentar conectar, intente de nuevo',
    icon: 'error'
  });
}

const notification = (time) => {
  return Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: time,
    timerProgressBar: true,
    onOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })
}

export const errorConexion = readable(errorConn)
export const toast = readable(notification)
