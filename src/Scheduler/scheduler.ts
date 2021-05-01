import { CronJob, CronTime } from "cron";
import {
  analyzeMetrics,
  getLastFridayTimestamp,
} from "../Alerts/dynamicAlerts";
import { rotateLog } from "../Nginx/parser";
import { open } from "sqlite";
import * as sqlite3 from "sqlite3";
import { findDemographic } from "../Nginx/analyze_addresses";
import { CPU_LOAD_TS_KEY, redisTSClient } from "../Redis/redis_client";
import { TimestampRange } from "redis-time-series-ts";
import { generalRedisClient } from "../pubsub";
import { ScheduledTaskDB } from "./module";
import { convertTimeUnitToMS } from "../Utils/round_up_time";
import * as Redis from "ioredis";
const tasks: Map<string, CronJob> = new Map<string, CronJob>();
const addTasksToDB = async () => {
  const db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });
  await db
    .run("INSERT INTO ScheduledTasks (taskName,type) VALUES (?,?)", [
      "adaptiveMetricsAnalysis",
      "root",
    ])
    .catch((err) => {
      console.log(
        `An error occured trying to insert into ScheduledTasks : ${err}`
      );
    });
  await db
    .run("INSERT INTO ScheduledTasks (taskName,type) VALUES (?,?)", [
      "logAnalysis",
      "root",
    ])
    .catch((err) => {
      console.log(
        `An error occured trying to insert into ScheduledTasks : ${err}`
      );
    });
  await db
    .run("INSERT INTO ScheduledTasks (taskName,type) VALUES (?,?)", [
      "CPULowTimeAnalysis",
      "root",
    ])
    .catch((err) => {
      console.log(
        `An error occured trying to insert into ScheduledTasks : ${err}`
      );
    });

  db.close();
};

export const setUpScheduledTasks = async () => {
  let date: Date;
  let taskTime: string;
  const db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });
  const rows = await db.all("SELECT * from ScheduledTasks").catch((err) => {
    console.log(
      `An error as occured while trying to get scheduled tasks from the database : ${err}`
    );
  });
  if (rows) {
    for (let i = 0; i < (rows as any[]).length; i++) {
      const element: ScheduledTaskDB = rows[i];
      if (element.type === "root") {
        date = new Date(element.time);
        taskTime = `${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} *  * ${date.getDay()}`;
        switch (element.taskName) {
          case "adaptiveMetricsAnalysis":
            tasks.set(
              "adaptiveMetricsAnalysis",
              new CronJob(taskTime, async () => {
                const redisClient = new Redis();
                if (
                  element.time - getLastFridayTimestamp(new Date().getTime()) >
                    0 &&
                  element.time - getLastFridayTimestamp(new Date().getTime()) <
                    convertTimeUnitToMS("W")
                ) {
                  return;
                }

                await analyzeMetrics();

                await redisClient.lpush(
                  "adaptiveMetricsAnalysisDone",
                  new Date().getTime()
                );
              })
            );
            break;
          case "logAnalysis":
            tasks.set(
              "logAnalysis",
              new CronJob(taskTime, async () => {
                const redisClient = new Redis();
                if (
                  element.time - getLastFridayTimestamp(new Date().getTime()) >
                    0 &&
                  element.time - getLastFridayTimestamp(new Date().getTime()) <
                    convertTimeUnitToMS("W")
                ) {
                  return;
                }

                await rotateLog();
                await findDemographic();
                await redisClient.lpush(
                  "logAnalysisDone",
                  new Date().getTime()
                );
              })
            );
            break;
          case "CPULowTimeAnalysis":
            tasks.set(
              "CPULowTimeAnalysis",
              new CronJob(taskTime, async () => {
                if (
                  element.time - getLastFridayTimestamp(new Date().getTime()) >
                    0 &&
                  element.time - getLastFridayTimestamp(new Date().getTime()) <
                    convertTimeUnitToMS("W")
                ) {
                  return;
                }

                await findCpuLowTime();
              })
            );
            break;
        }
      }
    }
  }

  tasks.forEach((task) => {
    task.start();
  });
};

const findCpuLowTime = async () => {
  const redisClient = new Redis();
  const cpuAdaptiveAverageValues = await redisTSClient
    .range(
      `${CPU_LOAD_TS_KEY}:current-load:adaptive-average`,
      new TimestampRange(0, 2147483647)
    )
    .catch((err) => {
      console.log(
        `An error occured while trying to fetch cpu adaptive average data`
      );
    });
  if (!cpuAdaptiveAverageValues) return;

  let optimalDownTimeValue: number = Number.MAX_SAFE_INTEGER;
  let optimalDownTime: string | number = -1;
  let optimalScriptRunTimeValue: number = Number.MAX_SAFE_INTEGER;
  let optimalScriptRunTime: string | number = -1;
  for (let i = 0; i < cpuAdaptiveAverageValues.length; i++) {
    const element = cpuAdaptiveAverageValues[i];
    if (element.getValue() < optimalDownTimeValue) {
      optimalDownTimeValue = element.getValue();
      optimalDownTime = element.getTimestamp();
    } else if (element.getValue() < optimalScriptRunTimeValue) {
      optimalScriptRunTimeValue = element.getValue();
      optimalScriptRunTime = element.getTimestamp();
    }
  }

  if (optimalDownTime != -1) {
    const absoluteDownTime =
      getLastFridayTimestamp(new Date().getTime()) +
      (optimalDownTime as number) +
      convertTimeUnitToMS("W");
    await redisClient.set("optimal-downtime", absoluteDownTime);
  }
  if (optimalScriptRunTime !== -1) {
    const absoluteScriptRunTime =
      getLastFridayTimestamp(new Date().getTime()) +
      (optimalScriptRunTime as number) +
      convertTimeUnitToMS("W");
    await changeScriptRunTime(absoluteScriptRunTime);
  }
};

const changeScriptRunTime = async (optimalScriptRunTime: number) => {
  const blockedRedisClient = new Redis();
  const date = new Date(optimalScriptRunTime);
  const taskTime = `${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} *  * ${date.getDay()}`;

  const db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });

  let adaptieMetricAnalysisDone: string[] | void = ["", "0"];
  while (
    new Date().getTime() - parseInt(adaptieMetricAnalysisDone[1]) >
    convertTimeUnitToMS("h")
  ) {
    adaptieMetricAnalysisDone = await blockedRedisClient
      .blpop("adaptiveMetricsAnalysisDone", 120000)
      .catch((err) => {
        console.log(
          `An error occured while trying to check whether adaptieMetricAnalysis was done or not : ${err}`
        );
      });
    if (!adaptieMetricAnalysisDone) {
      console.log(
        "CPULowTimeAnalysis : an error occured trying to pop the adaptieMetricAnalysis key"
      );

      return;
    }
  }

  const task = tasks.get("adaptiveMetricsAnalysis");
  task?.setTime(new CronTime(taskTime));
  db.run("UPDATE ScheduledTasks SET time = ? where taskName = ?", [
    optimalScriptRunTime,
    "adaptiveMetricsAnalysis",
  ]).catch((err) => {
    console.log(
      `An error has occured while trying to update the time of the scheduled task : "${err}"`
    );
  });

  let logAnalysisDone: string[] | void = ["", "0"];
  while (
    new Date().getTime() - parseInt(logAnalysisDone[1]) >
    convertTimeUnitToMS("h")
  ) {
    logAnalysisDone = await generalRedisClient
      .blpop("logAnalysisDone", 120000)
      .catch((err) => {
        console.log(
          `An error occured while trying to check whether Log Analysis was done or not : ${err}`
        );
      });
    if (!logAnalysisDone) {
      return;
    }
  }

  tasks.get("logAnalysis")?.setTime(new CronTime(taskTime));
  db.run("UPDATE ScheduledTasks SET time = ? where taskName = ?", [
    optimalScriptRunTime,
    "logAnalysis",
  ]).catch((err) => {
    console.log(
      `An error has occured while trying to update the time of the scheduled task : "${err}"`
    );
  });

  tasks.get("CPULowTimeAnalysis")?.setTime(new CronTime(taskTime));
  db.run("UPDATE ScheduledTasks SET time = ? where taskName = ?", [
    optimalScriptRunTime,
    "CPULowTimeAnalysis",
  ]).catch((err) => {
    console.log(
      `An error has occured while trying to update the time of the scheduled task : "${err}"`
    );
  });
};
