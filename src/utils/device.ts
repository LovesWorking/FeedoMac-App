// @src/utils/device.ts
import { Platform } from 'react-native';
import { getItem, setItem } from '@src/storage/mmkvStorage';

export const getDeviceInfo = () => {
  let device_id = getItem('device_id');
  if (!device_id) {
    device_id = String(Math.floor(Math.random() * 1000000)) + Date.now();
    setItem('device_id', device_id);
  }
  const device_name = Platform.OS + ' ' + Platform.Version;
  return { device_id, device_name };
};
