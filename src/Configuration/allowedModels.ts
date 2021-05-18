import {
  Alerts,
  CommandChains,
  trackedModels,
  SystemRuntime,
  Traffic,
  NotifcationModel,
} from "../Models";
import { parseConfig } from "./parseConfig";

export const allowedModels: any = {};
export const getAllowedModels = () => {
  const conf = parseConfig();
  const trackedMetrics: string[] = conf?.Tracking["tracked-metrics"];

  trackedMetrics.forEach((elemnt) => {
    allowedModels[elemnt] = trackedModels.get(elemnt);
  });

  if (allowedModels["System"]) allowedModels["SystemRuntime"] = SystemRuntime;

  if (conf?.Alerts["enable-alerts"]) allowedModels["Alerts"] = Alerts;
  if (conf?.Command_Chains["enable-chains"])
    if (conf?.Nginx["track-nginx"])
      allowedModels["CommandChains"] = CommandChains;
  allowedModels["Traffic"] = Traffic;
  allowedModels["Notifications"] = NotifcationModel;
};

getAllowedModels();
