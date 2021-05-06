import { DataSource } from "apollo-datasource";
import { ExpressContext } from "apollo-server-express";
import * as si from "systeminformation";
import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import { generalRedisClient } from "../pubsub";
import {
  dayQueryLength,
  longTimeSeriesPeriod,
  mediumTimeSeriesPeriod,
  monthQueryLength,
  shortTimeSeriesPeriod,
  weekQueryLength,
  yearQueryLength,
} from "../Redis/periods";
import {
  CPU_LOAD_TS_KEY,
  DISK_TS_KEY,
  MEMORY_TS_KEY,
  redisReadTSData,
  TRAFFIC_TS_KEY,
} from "../Redis/redis_client";
import {
  CommandChain,
  DemographicGeoStatisticsSample,
  EndpointStatisticsSample,
} from "./modules";
import { readFileSync } from "fs";
export const RedisTSModel = {
  //   getCPUHistory: async (option: string, toDate: number, fromDate: number) => {
  //     let resolution: number = 150;
  //     let startDate: number = 0;
  //     let endDate: number = 0;
  //     let period: string;
  //     switch (option) {
  //       case "Day":
  //         endDate = new Date().getTime();
  //         startDate = endDate - dayQueryLength;
  //         break;
  //       case "Week":
  //         endDate = new Date().getTime();
  //         startDate = endDate - weekQueryLength;
  //         break;
  //       case "Month":
  //         endDate = new Date().getTime();
  //         startDate = endDate - monthQueryLength;
  //         break;
  //       case "Year":
  //         endDate = new Date().getTime();
  //         startDate = endDate - yearQueryLength;
  //         break;
  //       case "Custom":
  //         endDate = toDate;
  //         startDate = fromDate;
  //         break;
  //       default:
  //         return;
  //     }
  //     if (endDate - startDate < shortTimeSeriesPeriod) period = "short";
  //     else if (endDate - startDate < mediumTimeSeriesPeriod) period = "medium";
  //     else if (endDate - startDate < longTimeSeriesPeriod) period = "long";
  //     else return;
  //     const samples = await redisReadTSData(
  //       CPU_LOAD_TS_KEY,
  //       "current-load",
  //       period,
  //       startDate,
  //       endDate,
  //       resolution
  //     );
  //     const data = [{}];
  //     for (let i = 0; i < samples.length; i++) {
  //       const element = samples[i];
  //       data[i] = {
  //         currentLoad: element.getValue(),
  //         timestamp: element.getTimestamp(),
  //       };
  //     }
  //     return {
  //       fromDate: startDate,
  //       toDate: endDate,
  //       data: data,
  //     };
  //   },
  //   getMemHistory: async (option: string, toDate: number, fromDate: number) => {
  //     let resolution: number = 150;
  //     let startDate: number = 0;
  //     let endDate: number = 0;
  //     let period: string;
  //     switch (option) {
  //       case "Day":
  //         endDate = new Date().getTime();
  //         startDate = endDate - dayQueryLength;
  //         break;
  //       case "Week":
  //         endDate = new Date().getTime();
  //         startDate = endDate - weekQueryLength;
  //         break;
  //       case "Month":
  //         endDate = new Date().getTime();
  //         startDate = endDate - monthQueryLength;
  //         break;
  //       case "Year":
  //         endDate = new Date().getTime();
  //         startDate = endDate - yearQueryLength;
  //         break;
  //       case "Custom":
  //         endDate = toDate;
  //         startDate = fromDate;
  //         break;
  //       default:
  //         return;
  //     }
  //     if (endDate - startDate < shortTimeSeriesPeriod) period = "short";
  //     else if (endDate - startDate < mediumTimeSeriesPeriod) period = "medium";
  //     else if (endDate - startDate < longTimeSeriesPeriod) period = "long";
  //     else return;
  //     const samples = await redisReadTSData(
  //       MEMORY_TS_KEY,
  //       "used",
  //       period,
  //       startDate,
  //       endDate,
  //       resolution
  //     );
  //     const data = [{}];
  //     for (let i = 0; i < samples.length; i++) {
  //       const element = samples[i];
  //       data[i] = {
  //         used: element.getValue(),
  //         timestamp: element.getTimestamp(),
  //       };
  //     }
  //     return {
  //       fromDate: startDate,
  //       toDate: endDate,
  //       data: data,
  //     };
  //   },
  //   getDiskHistory: async (option: string, toDate: number, fromDate: number) => {
  //     let resolution: number = 150;
  //     let startDate: number = 0;
  //     let endDate: number = 0;
  //     let period: string;
  //     switch (option) {
  //       case "Day":
  //         endDate = new Date().getTime();
  //         startDate = endDate - dayQueryLength;
  //         break;
  //       case "Week":
  //         endDate = new Date().getTime();
  //         startDate = endDate - weekQueryLength;
  //         break;
  //       case "Month":
  //         endDate = new Date().getTime();
  //         startDate = endDate - monthQueryLength;
  //         break;
  //       case "Year":
  //         endDate = new Date().getTime();
  //         startDate = endDate - yearQueryLength;
  //         break;
  //       case "Custom":
  //         endDate = toDate;
  //         startDate = fromDate;
  //         break;
  //       default:
  //         return;
  //     }
  //     if (endDate - startDate < shortTimeSeriesPeriod) period = "short";
  //     else if (endDate - startDate < mediumTimeSeriesPeriod) period = "medium";
  //     else if (endDate - startDate < longTimeSeriesPeriod) period = "long";
  //     else return;
  //     const readSamples = await redisReadTSData(
  //       DISK_TS_KEY,
  //       "read",
  //       period,
  //       startDate,
  //       endDate,
  //       resolution
  //     );
  //     const writeSamples = await redisReadTSData(
  //       DISK_TS_KEY,
  //       "write",
  //       period,
  //       startDate,
  //       endDate,
  //       resolution
  //     );
  //     const data = readSamples.map((readElement, index) => {
  //       const rIO = readElement.getValue();
  //       const wIO =
  //         index < writeSamples.length - 1 ? writeSamples[index].getValue() : null;
  //       return {
  //         rIO: rIO,
  //         wIO: wIO,
  //         tIO: wIO ? rIO + wIO : null,
  //         timestamp: readElement.getTimestamp(),
  //       };
  //     });
  //     return {
  //       fromDate: startDate,
  //       toDate: endDate,
  //       data: data,
  //     };
  //   },
  //   getTrafficHistory: async (
  //     option: string,
  //     toDate: number,
  //     fromDate: number
  //   ) => {
  //     let resolution: number = 150;
  //     let startDate: number = 0;
  //     let endDate: number = 0;
  //     let period: string;
  //     switch (option) {
  //       case "Day":
  //         endDate = new Date().getTime();
  //         startDate = endDate - dayQueryLength;
  //         break;
  //       case "Week":
  //         endDate = new Date().getTime();
  //         startDate = endDate - weekQueryLength;
  //         break;
  //       case "Month":
  //         endDate = new Date().getTime();
  //         startDate = endDate - monthQueryLength;
  //         break;
  //       case "Year":
  //         endDate = new Date().getTime();
  //         startDate = endDate - yearQueryLength;
  //         break;
  //       case "Custom":
  //         endDate = toDate;
  //         startDate = fromDate;
  //         break;
  //       default:
  //         return;
  //     }
  //     if (endDate - startDate < shortTimeSeriesPeriod) period = "short";
  //     else if (endDate - startDate < mediumTimeSeriesPeriod) period = "medium";
  //     else if (endDate - startDate < longTimeSeriesPeriod) period = "long";
  //     else return;
  //     const samples = await redisReadTSData(
  //       TRAFFIC_TS_KEY,
  //       "all",
  //       period,
  //       startDate,
  //       endDate,
  //       resolution,
  //       "SUM"
  //     );
  //     const data = [{}];
  //     for (let i = 0; i < samples.length; i++) {
  //       const element = samples[i];
  //       data[i] = {
  //         traffic: element.getValue(),
  //         timestamp: element.getTimestamp(),
  //       };
  //     }
  //     return {
  //       fromDate: startDate,
  //       toDate: endDate,
  //       data: data,
  //     };
  //   },
};

export const SystemInformationModel = {
  //   getTime: () => si.time(),
  //   getCPUData: () => si.cpu(),
  //   getCPUCacheData: () => si.cpuCache(),
  //   getSystemData: () => si.system(),
  //   getBoisData: () => si.bios(),
  //   getCPUCurrentSpeed: () => si.cpuCurrentSpeed(),
  //   getCPUTemperature: () => si.cpuTemperature(),
  //   getMemData: async () => {
  //     const data = await si.mem();
  //     data["timestamp"] = new Date().getTime();
  //     return data;
  //   },
  //   getCurrentLoadData: async () => {
  //     const data = await si.currentLoad();
  //     data["timestamp"] = new Date().getTime();
  //     return data;
  //   },
  //   getDiskData: async () => {
  //     const data = await si.disksIO();
  //     data["timestamp"] = new Date().getTime();
  //     return data;
  //   },
  //   getOSInfo: () => si.osInfo(),
  //   getProcessesData: () => si.processes(),
  //   getUsersData: () => si.users(),
  //   getDockerInfo: () => si.dockerInfo(),
  //   getDockerContainersData: () => si.dockerContainers(),
  //   getDockerImageData: () => si.dockerImages(),
  //   getContainerStatus: (id) => si.dockerContainerStats(id),
};

export const RedisModel = {
  //   getEndpointStatistics: async () => {
  //     const samples = await generalRedisClient.hgetall("end-points");
  //     let data: EndpointStatisticsSample[] = [];
  //     for (const key in samples) {
  //       data.push({
  //         endpoint: key,
  //         requestCount: parseInt(samples[key]),
  //       });
  //     }
  //     return {
  //       data: data,
  //     };
  //   },
  //   getDemographicHistory: async () => {
  //     const samples = await generalRedisClient.hgetall("demographic");
  //     let data: DemographicGeoStatisticsSample[] = [];
  //     for (const key in samples) {
  //       data.push({
  //         country: key,
  //         requestCount: parseInt(samples[key]),
  //       });
  //     }
  //     return {
  //       data: data,
  //     };
  //   },
};

export const DatabaseModel = {
  //   getAlerts: () =>
  //     new Promise((resolve, reject) => {
  //       const db = new sqlite3.Database("./database.db");
  //       const response: any = [];
  //       db.each(
  //         "SELECT id,start,end,metric,rangeName,AlertName as alertName  FROM Alerts",
  //         function (err, row) {
  //           if (err) reject(err);
  //           else response.push(row);
  //         },
  //         (err, n) => {
  //           if (err) {
  //             reject(err);
  //           } else {
  //             resolve(response);
  //           }
  //         }
  //       );
  //     }),
  //   getCommandChains: async () => {
  //     const db = await open({
  //       filename: "./database.db",
  //       driver: sqlite3.Database,
  //     });
  //     const chainsRows = await db
  //       .all("SELECT * FROM CommandChains")
  //       .catch((err) => {
  //         console.log(`An error occured while reading command chains : ${err}`);
  //       });
  //     if (!chainsRows) {
  //       return null;
  //     }
  //     const CMDChains: CommandChain[] = [];
  //     for (let i = 0; i < chainsRows.length; i++) {
  //       const element = chainsRows[i];
  //       let args: string[] = [];
  //       const argRows = await db
  //         .all("SELECT * FROM ChainArguments WHERE chainID = ?", [element.id])
  //         .catch((err) => {
  //           console.log(`An error occured while trying to get args : ${err}`);
  //         });
  //       if (!argRows) {
  //         return null;
  //       }
  //       argRows.sort((a, b) => {
  //         if (a.argIndex < b.argIndex) return -1;
  //         else return 1;
  //       });
  //       args = argRows.map((item) => item.argument);
  //       const chains = readFileSync(element.scriptFileLocation).toString();
  //       chains;
  //       CMDChains.push({
  //         id: element.id,
  //         arguments: args,
  //         chainName: element.chainName,
  //         scriptFileLocation: element.scriptFileLocation,
  //         chain: chains,
  //       });
  //     }
  //     return CMDChains;
  //   },
};
