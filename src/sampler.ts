import * as systemInformation from "systeminformation";
import { pubsub } from "./pubsub";
import {
  CPU_LOAD_TS_KEY,
  DISK_TS_KEY,
  MEMORY_TS_KEY,
  redisWriteTSData,
} from "./Redis/redis_client";
import * as Redis from "ioredis";
let historicRuntimeSamplerTimerId;
let nonHistoricRuntimeSamplerTimerId;
let histiorySamplerTimerId;

const historicRuntimeSampleFrequency = 2000;
const nonHistoricRuntimeSampleFrequency = 1000;
const historySampleFrequency = 60000;

let memorySubscription = false;
let diskSubscription = false;
let timeSubscription = false;
let currentLoadSubscription = false;
let processDataSubscription = false;

const MEM_SUBSCRIPTION_NAME = "NEW_MEM";
const DISK_SUBSCRIPTION_NAME = "DISK_DATA";
const TIME_SUBSCRIPTION_NAME = "TIME_DATA";
const CPU_LOAD_SUBSCRIPTION_NAME = "CURRENT_CPU_LOAD";
const PROCESS_DATA_SUBSCRIPTION_NAME = "PROCESSES_DATA";

const redisSubscriptionCheckClient = new Redis();

const historicRuntimeSample = async () => {
  const subscriptionsList: String[] = await redisSubscriptionCheckClient.send_command(
    "PUBSUB",
    ["CHANNELS"]
  );

  systemInformation.mem().then((data) => {
    const timestamp = new Date().getTime();
    data["timestamp"] = timestamp;
    if (subscriptionsList.includes(MEM_SUBSCRIPTION_NAME)) {
      pubsub.publish(MEM_SUBSCRIPTION_NAME, {
        MemData: data,
      });
    }
    redisWriteTSData(MEMORY_TS_KEY, "used", "runtime", data.used, timestamp);
  });

  systemInformation.disksIO().then((data) => {
    const timestamp = new Date().getTime();
    data["timestamp"] = timestamp;
    if (subscriptionsList.includes(DISK_SUBSCRIPTION_NAME)) {
      pubsub.publish(DISK_SUBSCRIPTION_NAME, {
        DiskData: data,
      });
    }
    redisWriteTSData(DISK_TS_KEY, "read", "runtime", data.rIO, timestamp);
    redisWriteTSData(DISK_TS_KEY, "write", "runtime", data.wIO, timestamp);
  });

  systemInformation.currentLoad().then((data) => {
    const timestamp = new Date().getTime();
    if (data.currentLoad === undefined) {
      console.log(
        ` \x1b[32m current load is undefined :\n${JSON.stringify(
          data,
          null,
          4
        )}`
      );
      return;
    }
    data["timestamp"] = timestamp;
    if (subscriptionsList.includes(CPU_LOAD_SUBSCRIPTION_NAME)) {
      pubsub.publish(CPU_LOAD_SUBSCRIPTION_NAME, {
        CurrentLoad: data,
      });
    }

    redisWriteTSData(
      CPU_LOAD_TS_KEY,
      "current-load",
      "runtime",
      data.currentLoad,
      timestamp
    ).catch((reason) =>
      console.log(`\x1b[31m error at redisWriteTSData : ${reason}`)
    );
  });
};

const nonHistoricRuntimeSample = async () => {
  const subscriptionsList: String[] = await redisSubscriptionCheckClient.send_command(
    "PUBSUB",
    ["CHANNELS"]
  );

  if (subscriptionsList.includes(TIME_SUBSCRIPTION_NAME)) {
    pubsub.publish(TIME_SUBSCRIPTION_NAME, { Time: systemInformation.time() });
  }
  if (subscriptionsList.includes(PROCESS_DATA_SUBSCRIPTION_NAME)) {
    systemInformation.processes().then((data) => {
      pubsub.publish(PROCESS_DATA_SUBSCRIPTION_NAME, { ProcessesData: data });
    });
  }
};

export const startRuntimeSample = () => {
  historicRuntimeSamplerTimerId = setInterval(
    historicRuntimeSample,
    historicRuntimeSampleFrequency
  );
  nonHistoricRuntimeSamplerTimerId = setInterval(
    nonHistoricRuntimeSample,
    nonHistoricRuntimeSampleFrequency
  );
};

export const stopRuntimeSample = () => {
  clearInterval(nonHistoricRuntimeSamplerTimerId);
  clearInterval(historicRuntimeSamplerTimerId);
};

/* TO-DO 

-> write history sampling function

*/
