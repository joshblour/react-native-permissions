import {NativeModules} from 'react-native';
import {Contract} from './contract';
import {NotificationsResponse, Permission, PermissionStatus} from './types';
import {uniq} from './utils';

const RNP: {
  OpenSettings: () => Promise<true>;
  CheckNotifications: () => Promise<PermissionStatus>;
  Check: (permission: Permission) => Promise<PermissionStatus>;
  Request: (permission: Permission) => Promise<PermissionStatus>;
} = NativeModules.RNPermissions;

function openSettings() {
  return RNP.OpenSettings();
}

async function check(permission: Permission): Promise<PermissionStatus> {
  return RNP.Check(permission);
}

async function request(permission: Permission): Promise<PermissionStatus> {
  return RNP.Request(permission);
}

async function checkNotifications(): Promise<NotificationsResponse> {
  const status = await RNP.CheckNotifications();
  return {status, settings: {}};
}

async function requestNotifications(): Promise<NotificationsResponse> {
  // There is no way to request notifications on Windows if they are
  // disabled.
  return checkNotifications();
}

async function checkMultiple<P extends Permission[]>(
  permissions: P,
): Promise<Record<P[number], PermissionStatus>> {
  const result = {} as Record<P[number], PermissionStatus>;
  const dedup = uniq(permissions);
  const promises = dedup.map(async (permission: P[number]) => {
    const promise = check(permission);
    result[permission] = await promise;
    return promise;
  });
  await Promise.all(promises);
  return result;
}

async function requestMultiple<P extends Permission[]>(
  permissions: P,
): Promise<Record<P[number], PermissionStatus>> {
  const result = {} as Record<P[number], PermissionStatus>;
  const dedup = uniq(permissions);
  for (let idx = 0; idx < dedup.length; ++idx) {
    const permission: P[number] = dedup[idx];
    result[permission] = await request(permission);
  }
  return result;
}

export const module: Contract = {
  openSettings,
  check,
  request,
  checkNotifications,
  requestNotifications,
  checkMultiple,
  requestMultiple,
};
