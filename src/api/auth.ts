// @src/api/auth.ts
import httpApi from './http';
import { setItem } from '@src/storage/mmkvStorage';

type LoginData = { email: string; password: string; device_id: string; device_name?: string };
type SignupData = { name: string; email: string; password: string; device_id: string; device_name?: string };

export async function loginApi(data: LoginData) {
  const res = await httpApi.post('/auth/login', data);
  if (res.data?.token) setItem('token', res.data.token);
  return res.data;
}

export async function signupApi(data: SignupData) {
  const res = await httpApi.post('/auth/register', data);
  if (res.data?.token) setItem('token', res.data.token);
  return res.data;
}

/**
 * Logout from the server and remove the stored token
 * @returns {Promise<boolean>} true if the logout was successful
 */
export async function logoutApi() {
  await httpApi.post('/auth/logout');
  setItem('token', '');
  return true;
}
