import { Alert, AlertChecker } from "./module";
import * as sqlite3 from "sqlite3";
import { redisTSClient } from "../Redis/redis_client";
import { Aggregation, TimestampRange } from "redis-time-series-ts";
import { getDayAndHour } from "./dynamicAlerts";
import { convertTimeUnitToMS } from "../Utils/round_up_time";
import { open } from "sqlite";

const alerts: Map<string, AlertChecker> = new Map<string, AlertChecker>();
const alertInterval = 6000;

export const getAllAlerts = async () => {
  const db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });

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

export const addAlert = (alert: Alert) => {
  const key = `${alert.metric}:${alert.component}`;

  if (!alerts.has(key)) {
    alerts.set(key, {
      alertList: [alert],
      timerID: setInterval(() => {
        alertCheck(key);
      }, alertInterval),
    });
  } else {
    alerts.get(key)?.alertList.push(alert);
  }
};

export const updateAlert = (updatedAlert: Alert) => {
  const key = `${updatedAlert.metric}:${updatedAlert.component}`;
  let alertList: Alert[] = [];
  let checker = alerts.get(key);
  if (checker) alertList = checker.alertList;
  for (let i = 0; i < alertList.length; i++) {
    const currentAlert = alertList[i];
    if (currentAlert.id === updatedAlert.id) {
      alertList.splice(i, 1);
      alertList.push(updatedAlert);

      return;
    }
  }
};

const alertCheck = async (key: string) => {
  const currentSamples = await redisTSClient.range(
    `${key}:runtime`,
    new TimestampRange(new Date().getTime() - alertInterval),
    1,
    new Aggregation("AVG", alertInterval)
  );
  let componentAlerts: Alert[] = [];
  let checker = alerts.get(key);
  if (checker) {
    componentAlerts = checker.alertList;
  }
  if (currentSamples && currentSamples[0]) {
    const currentComponent = currentSamples[0];
    for (let i = 0; i < componentAlerts.length; i++) {
      const alert = componentAlerts[i];
      if (!alert) {
        console.log(`shouldn't happen`);
        return;
      }

      if (alert.type === "s") {
        if (
          currentComponent.getValue() < alert.end &&
          currentComponent.getValue() > alert.start
        ) {
          //Notify
          //   console.log(`Alert ${alert.AlertName} fired`);
        }
      } else if (alert.type === "d") {
        const TSTime = getDayAndHour(new Date(currentComponent.getTimestamp()));
        const adaptiveAverageSamples = await redisTSClient.range(
          `${key}:adaptive-average`,
          new TimestampRange(TSTime, TSTime + convertTimeUnitToMS("h")),
          1
        );
        const adaptiveSigmaSamples = await redisTSClient.range(
          `${key}:adaptive-sigma`,
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
          currentComponent.getValue() >
            average.getValue() + 3 * sigma.getValue() ||
          currentComponent.getValue() <
            average.getValue() - 3 * sigma.getValue()
        ) {
          alert.contineuosTriggerCount++;
          if (alert.contineuosTriggerCount === 4) {
            //Notify
            // console.log(`Alert ${alert.AlertName} fired`);
          }
        } else {
          alert.contineuosTriggerCount = 0;
        }
      }
    }
  }
};
