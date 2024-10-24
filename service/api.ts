import Cookies from 'js-cookie';
import axios from 'axios';

const axiosInstance = axios.create();

export const cleanToken = () => {
  Cookies.remove('BTTDB_JWT_TOKEN');
  delete axiosInstance.defaults.headers.authorization;
};
