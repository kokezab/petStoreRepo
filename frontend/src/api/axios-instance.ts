import type { AxiosRequestConfig } from 'axios';

import api from '@/lib/api';

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return api({ ...config, ...options }).then(({ data }) => data);
};

export default customInstance;
