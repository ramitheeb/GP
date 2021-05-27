import * as fs from "fs";
import * as faker from "faker";
import moment = require("moment");
import { RedisTimeSeriesFactory, Sample } from "redis-time-series-ts";
const redisFactory = new RedisTimeSeriesFactory();
const TSClient = redisFactory.create();
const generateTrafficLogs = () => {
  const endpoints: string[] = [
    "/",
    "/static/css/blog.css",
    "/static/css/home_master.css",
    "/static/JavaScript/home_master.js",
    "/static/books.jpg",
    "/static/mexican-hat.png",
    "/account/login/",
    "/posts/",
    "/alexanne/",
    "/blog/",
    "/dameon/",
    "/ova.css",
    "/heidi/",
    "/marshal/",
    "/rey/",
    "/let.png",
    "/memories/ofit.jpg",
  ];
  const fileData = fs.readFileSync("traffic.log");
  let output: string = "";
  const lines = fileData.toString().split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const element = lines[i];
    const elementDate = element.match(/^.*(?=;traffic)/)?.[0];
    const elementValue = element.match(/(?<=traffic;).*$/)?.[0];
    const sampleDate = new Date(elementDate ? elementDate : "");
    const numberOfRecords = parseInt(elementValue ? elementValue : "0");
    let timeSum: number = 0;
    const timeDivisionPeriod: number = 3.6e6 / numberOfRecords;
    for (let j = 0; j < numberOfRecords; j++) {
      timeSum += Math.floor(Math.random() * timeDivisionPeriod);
      const address = faker.internet.ip();
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const time = moment(sampleDate.getTime() + timeSum);
      output += `${address} \"${endpoint}\" [${time.toISOString(true)}]\n`;
      // console.log(`${address} \"${endpoint}\" [${time.toISOString(true)}]`);
    }
  }
  fs.writeFileSync("TrafficLogsHolder", output, { flag: "a" });
  console.log("Almost done");
};

const generateGeneralSample = async (key: string, filename: string) => {
  const fileData = fs.readFileSync(filename);
  let samples: Sample[] = [];
  const lines = fileData.toString().split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const element = lines[i];
    const elementDate = element.match(/^.*(?=;mem-usage)/)?.[0];
    const elementValue = element.match(/(?<=mem-usage;).*$/)?.[0];
    const sampleDate = new Date(elementDate ? elementDate : "");
    const usageValue = parseFloat(elementValue ? elementValue : "0");
    if (isNaN(sampleDate.getTime()) || isNaN(usageValue)) {
      continue;
    }
    const usageSample: Sample = new Sample(
      `${key}:runtime`,
      usageValue,
      sampleDate.getTime()
    );

    samples.push(usageSample);
    if (i % 1000 == 0) {
      await TSClient.multiAdd(samples).catch((err) => {
        `An error occured trying to add to ${key} : ${err}`;
      });
      samples = [];
    }
  }

  console.log(`Done parsing samples and writing to redis : ${key}`);
};
generateGeneralSample("cpu-usage:current-load", "cpu_usage.log");
generateGeneralSample("mem-usage:used", "mem_usage.log");
generateGeneralSample("disk-usage:read", "disk_read.log");
generateGeneralSample("disk-usage:write", "disk_write.log");
generateGeneralSample("network-bandwidth:upload", "network_upload.log");
generateGeneralSample("network-bandwidth:download", "network_download.log");
generateTrafficLogs();
