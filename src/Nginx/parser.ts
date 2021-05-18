import { promises as fsp, createReadStream, readFileSync } from "fs";
import * as rl from "readline";
import * as process from "process";
import { redisWriteTSData } from "../Redis/redis_client";
import { generalRedisClient } from "../pubsub";
import { analyzeMetrics } from "../Alerts/dynamicAlerts";

const timeRegex = /(?<=\s)\[.+\]/;
const addressRegex = /^\d{1,3}\.\d{1,3}.\d{1,3}.\d{1,3}/;
const uriRegex = /(?<=\s\").+(?=\")/;
const bracketsRegex = /[\[\]]/g;
const quoteRegex = /[\"\"]/g;

export const rotateLog = async () => {
  try {
    var pid = parseInt(readFileSync("/var/run/nginx.pid").toString());
  } catch (e) {
    console.log(`An error occured while getting the pid of Nginx : ${e}`);
    return;
  }
  fsp
    .rename("./src/Nginx/analysis_log.log", "src/Nginx/analysis_log.log.0")
    .catch((e) => {
      console.log(`An error occured while renaming the logs file : ${e}`);
    });
  try {
    process.kill(pid, "SIGUSR1");
  } catch (e) {
    console.log(
      `An error occured while sending the log reopening signal to Nginx : ${e}`
    );
    return;
  }
  return new Promise<void>((resolve, reject) => {
    setTimeout(async () => {
      await analyzeLogs().catch((err) => {
        reject();
      });
      resolve();
    }, 1000);
  });
};

const analyzeLogs = async () => {
  const fileString = readFileSync("./analysis_log.log.0").toString();
  const lines = fileString.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const address = line.match(addressRegex)?.[0];
    const uri = line.match(uriRegex)?.[0].replace(quoteRegex, "");
    const dateString = line.match(timeRegex)?.[0].replace(bracketsRegex, "");
    if (address) {
      await generalRedisClient.lpush("addresses", address).catch((err) => {});
    }
    if (uri) {
      await generalRedisClient.hincrby("end-points", uri, 1);
    }
    if (dateString) {
      const date = new Date(dateString ? dateString : "");
      redisWriteTSData("traffic", "all", "runtime", 1, date.getTime());
    }
  }

  await fsp.unlink("./src/Nginx/analysis_log.log.0").catch((reason) => {
    console.log(reason);
  });
};
analyzeLogs();
