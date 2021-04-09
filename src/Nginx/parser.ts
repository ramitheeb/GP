import { promises as fsp, createReadStream, readFileSync } from "fs";
import * as rl from "readline";
import * as process from "process";
import { redisWriteTSData } from "../Redis/redis_client";
import { generalRedisClient } from "../pubsub";

const timeRegex = /(?<=\s)\[.+\]/;
const addressRegex = /^\d{1,3}\.\d{1,3}.\d{1,3}.\d{1,3}/;
const uriRegex = /(?<=\s\").+(?=\")/;
const bracketsRegex = /[\[\]]/g;
const quoteRegex = /[\"\"]/g;

const rotateLog = async () => {
  try {
    var pid = parseInt(readFileSync("/var/run/nginx.pid").toString());
  } catch (e) {
    console.log(`An error occured while getting the pid of Nginx : ${e}`);
    return;
  }
  fsp.rename("analysis_log.log", "analysis_log.log.0").catch((e) => {
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
  setTimeout(analyzeLogs, 1000);
};

const analyzeLogs = async () => {
  const fileStream = createReadStream("analysis_log.log.0");
  const lineReader = rl.createInterface({
    input: fileStream,
  });

  lineReader.on("line", (line) => {
    const address = line.match(addressRegex)?.[0];
    const uri = line.match(uriRegex)?.[0].replace(quoteRegex, "");
    const dateString = line.match(timeRegex)?.[0].replace(bracketsRegex, "");
    if (address) {
      generalRedisClient.lpush("addresses", address);
    }
    if (uri) {
      generalRedisClient.hincrby("end-points", uri, 1);
    }
    if (dateString) {
      const date = new Date(dateString ? dateString : "");
      redisWriteTSData("traffic", "all", "runtime", 1, date.getTime());
    }
  });
  lineReader.on("close", () => {
    console.log("Finished parsing log, attempting to delete it");

    fsp.unlink("analysis_log.log.0").catch((reason) => {
      console.log(reason);
    });
  });
};

rotateLog();
