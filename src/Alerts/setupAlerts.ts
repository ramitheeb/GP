import { Aggregation, Sample, TimestampRange } from "redis-time-series-ts";
import * as sqlite3 from "sqlite3";
import { redisTSClient } from "../Redis/redis_client";
import { convertTimeUnitToMS } from "../Utils/round_up_time";
import * as colors from "colors";
import { Alert } from "./module";
import { getDayAndHour } from "./dynamicAlerts";
const alerts: Alert[] = [];
const CPUAlerts: Alert[] = [];
const MemAlerts: Alert[] = [];
const DiskIOAlerts: Alert[] = [];
const DiskSpaceAlerts: Alert[] = [];
const TrafficAlerts: Alert[] = [];
const alertInterval = 60000;
let CPUAlertTimer;
let MemAlertTimer;

export const getAllAlerts = () => {
  const db = new sqlite3.Database(
    "/home/ibrahim-ubuntu/Documents/GP/ServerMonitor/database.db"
  );
  db.all("SELECT * FROM Alerts", (err, rows) => {
    if (err) {
      console.log(err);
      return;
    }

    if (rows) {
      rows.forEach((value) => addAlert(value));
      // console.log(rows);
    }
    db.close();
  });
};

const addAlert = (alert: Alert) => {
  switch (alert.metric) {
    case "CPU":
      if (CPUAlerts.length == 0)
        CPUAlertTimer = setInterval(checkCPU, alertInterval);
      CPUAlerts.push(alert);
      break;
    case "Free Memory":
      if (MemAlerts.length == 0)
        MemAlertTimer = setInterval(checkMEM, alertInterval);
      MemAlerts.push(alert);
      break;
    default:
      break;
  }
};

const checkCPU = async () => {
  console.log("Checking CPU for alerts");

  const currentloadSamples = await redisTSClient.range(
    "cpu-usage:current-load:runtime",
    new TimestampRange(new Date().getTime() - alertInterval),
    1,
    new Aggregation("AVG", alertInterval)
  );

  if (currentloadSamples && currentloadSamples[0]) {
    const currentLoad = currentloadSamples[0];
    for (let i = 0; i < CPUAlerts.length; i++) {
      const alert = CPUAlerts[i];
      if (alert.type === "s") {
        if (
          currentLoad.getValue() < alert.end &&
          currentLoad.getValue() > alert.start
        ) {
          //Notify
          // console.log(`Alert ${alert.AlertName} fired`);
        }
      } else if (alert.type === "d") {
        const TSTime = getDayAndHour(new Date(currentLoad.getTimestamp()));
        const adaptiveAverageSamples = await redisTSClient.range(
          "cpu-usage:current-load:adaptive-average",
          new TimestampRange(TSTime, TSTime + convertTimeUnitToMS("h")),
          1
        );
        const adaptiveSigmaSamples = await redisTSClient.range(
          "cpu-usage:current-load:adaptive-sigma",
          new TimestampRange(TSTime, TSTime + convertTimeUnitToMS("h")),
          1
        );

        if (
          !adaptiveAverageSamples ||
          !adaptiveSigmaSamples ||
          !adaptiveSigmaSamples[0] ||
          !adaptiveAverageSamples[0]
        )
          return;
        const average = adaptiveAverageSamples[0];
        const sigma = adaptiveSigmaSamples[0];
        if (
          currentLoad.getValue() >
          average.getValue() + 3 * sigma.getValue()
        ) {
          alert.contineuosTriggerCount++;
          if (alert.contineuosTriggerCount === 4) {
            //Notify
            console.log(`Alert ${alert.AlertName} fired`);
          }
        } else {
          alert.contineuosTriggerCount = 0;
        }
      }
    }
  } else console.log(`no CPU sample`);
};

const checkMEM = async () => {
  console.log("Checking Memory for alerts");
  const usedMemSamples = await redisTSClient.range(
    "mem-usage:used:runtime",
    new TimestampRange(new Date().getTime() - alertInterval),
    1,
    new Aggregation("AVG", alertInterval)
  );
  if (usedMemSamples && usedMemSamples[0]) {
    const usedMem = usedMemSamples[0];

    for (let i = 0; i < MemAlerts.length; i++) {
      const alert = MemAlerts[i];
      if (alert.type === "s") {
        if (
          usedMem.getValue() < alert.end &&
          usedMem.getValue() > alert.start
        ) {
          //Notify
          // console.log(`Alert ${alert.AlertName} fired`.red);
        }
      } else if (alert.type === "d") {
        const TSTime = getDayAndHour(new Date(usedMem.getTimestamp()));
        const adaptiveAverageSamples = await redisTSClient.range(
          "mem-usage:used:adaptive-average",
          new TimestampRange(TSTime, TSTime + convertTimeUnitToMS("h")),
          1
        );
        const adaptiveSigmaSamples = await redisTSClient.range(
          "mem-usage:used:adaptive-sigma",
          new TimestampRange(TSTime, TSTime + convertTimeUnitToMS("h")),
          1
        );

        if (
          !adaptiveAverageSamples ||
          !adaptiveSigmaSamples ||
          !adaptiveSigmaSamples[0] ||
          !adaptiveAverageSamples[0]
        )
          return;
        const average = adaptiveAverageSamples[0];
        const sigma = adaptiveSigmaSamples[0];
        if (usedMem.getValue() > average.getValue() + 3 * sigma.getValue()) {
          alert.contineuosTriggerCount++;
          if (alert.contineuosTriggerCount === 4) {
            //Notify
            console.log(`Alert ${alert.AlertName} fired`);
          }
        } else {
          alert.contineuosTriggerCount = 0;
        }
      }
    }
  }
};
