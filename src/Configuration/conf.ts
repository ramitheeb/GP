import { exec as execCB } from "child_process";
import { promisify } from "util";
import { parseConfig } from "./parseConfig";
const exec = promisify(execCB);
export const getUserID = async () => {
  const id = await exec(`id -u ${USER_NAME}`);
  return parseInt(id.stdout);
};

export const getGroupID = async () => {
  const id = await exec(`id -g ${USER_NAME}`);
  return parseInt(id.stdout);
};

export const isSUDO = () => {
  return process.geteuid() === 0 && process.getegid() === 0;
};

const USER_NAME = "ibrahim-ubuntu";

export const getIP = () => {
  return "localhost";
};

const conf = parseConfig();

export const getSampleRate = () => conf?.Tracking["sample-data-every"];

export const getSubscriptionRate = () =>
  conf?.Tracking["publish-subscription-data-every"];

export const getAlertsEnabled = () => conf?.Alerts["enable-alerts"];

export const getChainsEnabled = () => conf?.Command_Chains["enable-chains"];

export const getSUDOChainsEnabled = () =>
  conf?.Command_Chains["enable-chains-sudo-execution"];

export const getScriptsDir = () => conf?.Command_Chains["scripts-dir"];

export const getGeoIPDBLocation = () => conf?.Nginx["GeoIP-database-location"];

export const getRedisIPAdress = () => conf?.Redis["redis-IP"];

export const getRedisPortNumber = () => parseInt(conf?.Redis["redis-port"]);

export const getNotificationAPIKey = () =>
  conf?.Alerts["push-notification-API-key"];

export const getNotificationInstanceID = () =>
  conf?.Alerts["push-notification-instance-ID"];

export const getNotificationDomain = () =>
  conf?.Alerts["push-notification-domain"];

export const getAlertCheckRate = () => conf?.Alerts["check-alert-every"];
