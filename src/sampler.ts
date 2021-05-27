import * as systemInformation from "systeminformation";

import * as Redis from "ioredis";
import { getSampleRate, getSubscriptionRate } from "./Configuration";
import {
  CPU_LOAD_TS_KEY,
  DISK_TS_KEY,
  generateRedisClient,
  MEMORY_TS_KEY,
  NETWORK_TS_KEY,
  pubsub,
  redisWriteTSData,
} from "./Redis";

let historicRuntimeSamplerTimerId;
let nonHistoricRuntimeSamplerTimerId;
let histiorySamplerTimerId;

const historicRuntimeSampleFrequency = getSubscriptionRate();
const nonHistoricRuntimeSampleFrequency = getSubscriptionRate();
const historySampleFrequency = getSampleRate();

const MEM_SUBSCRIPTION_NAME = "NEW_MEM";
const DISK_SUBSCRIPTION_NAME = "DISK_DATA";
const TIME_SUBSCRIPTION_NAME = "TIME_DATA";
const CPU_LOAD_SUBSCRIPTION_NAME = "CURRENT_CPU_LOAD";
const NETWORK_BANDWIDTH_SUBSCRIPTION_NAME = "NETWORK_DATA";
const PROCESS_DATA_SUBSCRIPTION_NAME = "PROCESSES_DATA";
const CONTAINER_STATUS_SUBSCRIPTION_NAME = "CONTAINER_STATUS";

const redisSubscriptionCheckClient = generateRedisClient();

const historicRuntimeSample = async () => {
  const subscriptionsList: String[] =
    await redisSubscriptionCheckClient.send_command("PUBSUB", ["CHANNELS"]);

  systemInformation.mem().then((data) => {
    const timestamp = new Date().getTime();
    data["timestamp"] = timestamp;
    if (subscriptionsList.includes(MEM_SUBSCRIPTION_NAME)) {
      pubsub.publish(MEM_SUBSCRIPTION_NAME, {
        MemData: data,
      });
    }
    redisWriteTSData(
      MEMORY_TS_KEY,
      "used",
      "runtime",
      data.used / (1024 * 1024 * 1024),
      timestamp
    ).catch((err) => {
      // console.log(`An error occured while sampling : ${err}`);
    });
  });

  systemInformation.disksIO().then((data) => {
    const timestamp = new Date().getTime();
    data["timestamp"] = timestamp;
    if (subscriptionsList.includes(DISK_SUBSCRIPTION_NAME)) {
      pubsub.publish(DISK_SUBSCRIPTION_NAME, {
        DiskData: data,
      });
    }
    redisWriteTSData(
      DISK_TS_KEY,
      "read",
      "runtime",
      data.rIO_sec,
      timestamp
    ).catch((err) => {
      // console.log(`An error occured while sampling : ${err}`);
    });
    redisWriteTSData(
      DISK_TS_KEY,
      "write",
      "runtime",
      data.wIO_sec,
      timestamp
    ).catch((err) => {
      // console.log(`An error occured while sampling : ${err}`);
    });
  });
  systemInformation.networkStats().then((dataList) => {
    const data = dataList[0];
    const timestamp = new Date().getTime();
    data["timestamp"] = timestamp;
    if (subscriptionsList.includes(NETWORK_BANDWIDTH_SUBSCRIPTION_NAME)) {
      pubsub.publish(NETWORK_BANDWIDTH_SUBSCRIPTION_NAME, {
        Network: data,
      });
    }
    redisWriteTSData(
      NETWORK_TS_KEY,
      "download",
      "runtime",
      data.rx_sec,
      timestamp
    ).catch((err) => {
      console
        .log
        // `An error occured while trying to add network sample : ${err}`
        ();
    });
    redisWriteTSData(
      NETWORK_TS_KEY,
      "upload",
      "runtime",
      data.tx_sec,
      timestamp
    ).catch((err) => {
      // console.log(
      // `An error occured while trying to add network sample : ${err}`
      // );
    });
  });
  systemInformation.currentLoad().then((data) => {
    const timestamp = new Date().getTime();
    if (data.currentLoad === undefined) {
      // console.log(
      //   ` \x1b[32m current load is undefined :\n${JSON.stringify(
      //     data,
      //     null,
      //     4
      //   )}`
      // );
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
    )?.catch((reason) => {
      //     console.log(`\x1b[31m error at redisWriteTSData : ${reason}`);
    });
  });
};

const historicNonRuntimeSample = async () => {
  systemInformation
    .mem()
    .then((data) => {
      const timestamp = new Date().getTime();
      data["timestamp"] = timestamp;
      redisWriteTSData(
        MEMORY_TS_KEY,
        "used",
        "runtime",
        data.used / (1024 * 1024 * 1024),
        timestamp
      );
    })
    .catch((err) => {
      // console.log(`An error occured while sampling : ${err}`);
    });

  systemInformation.disksIO().then((data) => {
    const timestamp = new Date().getTime();
    data["timestamp"] = timestamp;
    redisWriteTSData(
      DISK_TS_KEY,
      "read",
      "runtime",
      data.rIO_sec,
      timestamp
    ).catch((err) => {
      // console.log(`An error occured while sampling : ${err}`);
    });
    redisWriteTSData(
      DISK_TS_KEY,
      "write",
      "runtime",
      data.wIO_sec,
      timestamp
    ).catch((err) => {
      // console.log(`An error occured while sampling : ${err}`);
    });
  });
  systemInformation.networkStats().then((dataList) => {
    const data = dataList[0];
    const timestamp = new Date().getTime();
    data["timestamp"] = timestamp;

    redisWriteTSData(
      NETWORK_TS_KEY,
      "download",
      "runtime",
      data.rx_sec,
      timestamp
    ).catch((err) => {
      // console.log(`An error occured while sampling : ${err}`);
    });
    redisWriteTSData(
      NETWORK_TS_KEY,
      "upload",
      "runtime",
      data.tx_sec,
      timestamp
    ).catch((err) => {
      // console.log(`An error occured while sampling : ${err}`);
    });
  });
  systemInformation.currentLoad().then((data) => {
    const timestamp = new Date().getTime();
    data["timestamp"] = timestamp;

    redisWriteTSData(
      CPU_LOAD_TS_KEY,
      "current-load",
      "runtime",
      data.currentLoad,
      timestamp
    )?.catch((reason) => {});
  });
};

const nonHistoricRuntimeSample = async () => {
  const subscriptionsList: String[] =
    await redisSubscriptionCheckClient.send_command("PUBSUB", ["CHANNELS"]);

  if (subscriptionsList.includes(TIME_SUBSCRIPTION_NAME)) {
    pubsub.publish(TIME_SUBSCRIPTION_NAME, { Time: systemInformation.time() });
  }
  if (subscriptionsList.includes(PROCESS_DATA_SUBSCRIPTION_NAME)) {
    systemInformation.processes().then((data) => {
      pubsub.publish(PROCESS_DATA_SUBSCRIPTION_NAME, { ProcessesData: data });
    });
  }
  if (subscriptionsList.includes(CONTAINER_STATUS_SUBSCRIPTION_NAME)) {
    systemInformation.dockerContainerStats("*").then((data) => {
      data.forEach((item) => {
        item["timestamp"] = new Date().getTime();
        pubsub.publish(CONTAINER_STATUS_SUBSCRIPTION_NAME, {
          containerStatus: item,
        });
      });
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
  clearInterval(histiorySamplerTimerId);
};

export const stopRuntimeSample = () => {
  histiorySamplerTimerId = setInterval(
    historicNonRuntimeSample,
    historySampleFrequency
  );
  clearInterval(nonHistoricRuntimeSamplerTimerId);
  clearInterval(historicRuntimeSamplerTimerId);
};

export const startSampling = () => {
  histiorySamplerTimerId = setInterval(
    historicNonRuntimeSample,
    historySampleFrequency
  );
};
