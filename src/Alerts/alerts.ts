import * as sqlite3 from "sqlite3";
import { Aggregation, TimestampRange } from "redis-time-series-ts";
import { NotifyAll } from "../notifier";
import { Alert, AlertChecker, getDayAndHour } from ".";
import { getAlertCheckRate, getAlertsEnabled, getIP } from "../Configuration";
import { redisTSClient } from "../Redis";
import { convertTimeUnitToMS } from "../Utils";
import { addNotification } from "../Notifications";
const alerts: Map<string, AlertChecker> = new Map<string, AlertChecker>();
const alertInterval = getAlertCheckRate();

export const setUpAlerts = () => {
  if (!getAlertsEnabled()) return;
  const db = new sqlite3.Database("./database.db");
  db.all("SELECT * FROM Alerts", (err, rows) => {
    if (err) {
      console.log(err);
      return;
    }

    if (rows) {
      rows.forEach((value) => addAlert({ ...value, fired: false }));
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
        alertCheck(key, alert);
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

const alertCheck = async (key: string, alert: Alert) => {
  const currentSamples = await redisTSClient
    .range(
      `${key}:runtime`,
      new TimestampRange(new Date().getTime() - alertInterval),
      1,
      new Aggregation("AVG", alertInterval)
    )
    .catch((err) => {
      console.log(
        `An error occured trying to fetch current value in alerts : ${err}`
      );
    });
  if (!currentSamples) {
    return;
  }
  let componentAlerts: Alert[] = [];
  let checker = alerts.get(key);
  if (checker) {
    componentAlerts = checker.alertList;
  }
  if (currentSamples[0]) {
    const currentComponent = currentSamples[0];
    for (let i = 0; i < componentAlerts.length; i++) {
      const alert = componentAlerts[i];

      if (alert.type === "s") {
        if (
          !alert.fired &&
          currentComponent.getValue() < alert.end &&
          currentComponent.getValue() > alert.start
        ) {
          //Notify
          console.log(`Alert ${alert.AlertName} fired (enter)`);
          alert.fired = true;
          NotifyAll({
            body: `${alert.AlertName} : ${alert.metric}'s ${alert.component} has entered ${alert.rangeName}`,
            title: alert.AlertName,
            deep_link: `http://${getIP()}:3006/`,
          });
          addNotification({
            name: alert.AlertName,
            body: `${alert.AlertName} : ${alert.metric}'s ${alert.component} has entered ${alert.rangeName}`,
            url: `http://${getIP()}:3006/`,
          });
        } else if (
          alert.fired &&
          (currentComponent.getValue() > alert.end ||
            currentComponent.getValue() < alert.start)
        ) {
          //Notify
          console.log(`Alert ${alert.AlertName} fired (exit)`);
          alert.fired = false;
          NotifyAll({
            body: `${alert.AlertName} : ${alert.metric}'s ${alert.component} has exited ${alert.rangeName}`,
            title: alert.AlertName,
            deep_link: `http://${getIP()}:3006/`,
          });
          addNotification({
            name: alert.AlertName,
            body: `${alert.AlertName} : ${alert.metric}'s ${alert.component} has exited ${alert.rangeName}`,
            url: `http://${getIP()}:3006/`,
          });
        }
      } else if (alert.type === "d") {
        const TSTime = getDayAndHour(new Date(currentComponent.getTimestamp()));
        const adaptiveAverageSamples = await redisTSClient
          .range(
            `${key}:adaptive-average`,
            new TimestampRange(TSTime, TSTime + convertTimeUnitToMS("h")),
            1
          )
          .catch((err) => {
            console.log(
              `An error occured trying to get adaptive average value : ${err}`
            );
          });
        if (!adaptiveAverageSamples) return;
        const adaptiveSigmaSamples = await redisTSClient
          .range(
            `${key}:adaptive-sigma`,
            new TimestampRange(TSTime, TSTime + convertTimeUnitToMS("h")),
            1
          )
          .catch((err) => {
            console.log(
              `An error occured trying to get adaptive sigma value : ${err}`
            );
          });
        if (!adaptiveSigmaSamples) return;
        if (!adaptiveSigmaSamples[0] || !adaptiveAverageSamples[0]) return;
        const average = adaptiveAverageSamples[0];
        const sigma = adaptiveSigmaSamples[0];

        if (
          !alert.fired &&
          (currentComponent.getValue() >
            average.getValue() + 3 * sigma.getValue() ||
            currentComponent.getValue() <
              average.getValue() - 3 * sigma.getValue())
        ) {
          alert.contineuosTriggerCount++;
          if (alert.contineuosTriggerCount === 4) {
            //Notify
            console.log(`Alert ${alert.AlertName} fired (enter)`);
            alert.fired = true;
            NotifyAll({
              body: `${alert.AlertName} : is out of its usual value`,
              title: alert.AlertName,
              deep_link: `http://${getIP()}:3006/`,
            });
            addNotification({
              name: alert.AlertName,
              body: `${alert.AlertName} : is out of its usual value`,
              url: `http://${getIP()}:3006/`,
            });
            alert.contineuosTriggerCount = 0;
          }
        } else if (
          alert.fired &&
          currentComponent.getValue() <
            average.getValue() + 3 * sigma.getValue() &&
          currentComponent.getValue() >
            average.getValue() - 3 * sigma.getValue()
        ) {
          alert.contineuosTriggerCount++;
          if (alert.contineuosTriggerCount === 4) {
            //Notify
            console.log(`Alert ${alert.AlertName} fired (exited)`);
            alert.fired = false;
            NotifyAll({
              body: `${alert.AlertName} : is back to its usual value`,
              title: alert.AlertName,
              deep_link: `http://${getIP()}:3006/`,
            });
            addNotification({
              name: alert.AlertName,
              body: `${alert.AlertName} : is back to its usual value`,
              url: `http://${getIP()}:3006/`,
            });
            alert.contineuosTriggerCount = 0;
          }
        } else {
          alert.contineuosTriggerCount = 0;
        }
      }
    }
  }
};
