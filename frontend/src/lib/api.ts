import axios from 'axios';
import qs from 'qs';

import { config } from '@/config';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: (params) =>
    qs.stringify(params, { allowDots: false, skipNulls: true, arrayFormat: 'repeat' }),
});

export default api;
