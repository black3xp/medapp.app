import jwt from 'jwt-decode';
//const url = "http://192.168.1.124:91";
const url = "https://medapp-api.cthrics.com/api";
//const url = "http://172.20.1.12:303";
//const url = "https://odyssey-api.cmsiglo21.app";

const isLogin = () => { localStorage.getItem('access_token') };

export {jwt, url, isLogin}