import { withFilter } from "apollo-server-express";
import * as si from "systeminformation";
import * as sqlite3 from "sqlite3";
import { promises as ps } from "fs";
import { open } from "sqlite";

import { readFileSync } from "fs";
import { FileUpload } from "graphql-upload";

import { addAlert, updateAlert } from "../Alerts";
import { fireCMDChain } from "../Commands";
import {
  getGroupID,
  getScriptsDir,
  getSUDOChainsEnabled,
  getUserID,
} from "../Configuration";
import {
  CommandChain,
  DemographicGeoStatisticsSample,
  EndpointStatisticsSample,
} from ".";
import {
  CPU_LOAD_TS_KEY,
  dayQueryLength,
  DISK_TS_KEY,
  generalRedisClient,
  longTimeSeriesPeriod,
  mediumTimeSeriesPeriod,
  MEMORY_TS_KEY,
  monthQueryLength,
  pubsub,
  redisReadTSData,
  shortTimeSeriesPeriod,
  TRAFFIC_TS_KEY,
  weekQueryLength,
  yearQueryLength,
} from "../Redis";
export const trackedModels = new Map<string, any>();
export const CPU = {
  getCPUData: () => si.cpu(),
  getCPUCacheData: () => si.cpuCache(),
  getCPUCurrentSpeed: () => si.cpuCurrentSpeed(),
  getCPUTemperature: () => si.cpuTemperature(),
  getCurrentLoadData: async () => {
    const data = await si.currentLoad();
    data["timestamp"] = new Date().getTime();
    return data;
  },
  subscribeToCurrentLoad: () => pubsub.asyncIterator("CURRENT_CPU_LOAD"),
  getCPUHistory: async (option: string, toDate: number, fromDate: number) => {
    let resolution: number = 150;
    let startDate: number = 0;
    let endDate: number = 0;
    let period: string;

    switch (option) {
      case "Day":
        endDate = new Date().getTime();
        startDate = endDate - dayQueryLength;
        break;
      case "Week":
        endDate = new Date().getTime();
        startDate = endDate - weekQueryLength;
        break;
      case "Month":
        endDate = new Date().getTime();
        startDate = endDate - monthQueryLength;
        break;
      case "Year":
        endDate = new Date().getTime();
        startDate = endDate - yearQueryLength;
        break;
      case "Custom":
        endDate = toDate;
        startDate = fromDate;
        break;
      default:
        return;
    }

    if (endDate - startDate < shortTimeSeriesPeriod) period = "short";
    else if (endDate - startDate < mediumTimeSeriesPeriod) period = "medium";
    else if (endDate - startDate < longTimeSeriesPeriod) period = "long";
    else return;

    const samples = await redisReadTSData(
      CPU_LOAD_TS_KEY,
      "current-load",
      period,
      startDate,
      endDate,
      resolution
    );

    const data = [{}];
    for (let i = 0; i < samples.length; i++) {
      const element = samples[i];

      data[i] = {
        currentLoad: element.getValue(),
        timestamp: element.getTimestamp(),
      };
    }

    return {
      fromDate: startDate,
      toDate: endDate,
      data: data,
    };
  },
};
trackedModels.set("CPU", CPU);

export const Memory = {
  getMemData: async () => {
    const data = await si.mem();
    data["timestamp"] = new Date().getTime();
    return data;
  },
  subscribeToUsed: () => pubsub.asyncIterator("NEW_MEM"),
  getMemHistory: async (option: string, toDate: number, fromDate: number) => {
    let resolution: number = 150;
    let startDate: number = 0;
    let endDate: number = 0;
    let period: string;

    switch (option) {
      case "Day":
        endDate = new Date().getTime();
        startDate = endDate - dayQueryLength;
        break;
      case "Week":
        endDate = new Date().getTime();
        startDate = endDate - weekQueryLength;
        break;
      case "Month":
        endDate = new Date().getTime();
        startDate = endDate - monthQueryLength;
        break;
      case "Year":
        endDate = new Date().getTime();
        startDate = endDate - yearQueryLength;
        break;
      case "Custom":
        endDate = toDate;
        startDate = fromDate;
        break;
      default:
        return;
    }

    if (endDate - startDate < shortTimeSeriesPeriod) period = "short";
    else if (endDate - startDate < mediumTimeSeriesPeriod) period = "medium";
    else if (endDate - startDate < longTimeSeriesPeriod) period = "long";
    else return;
    const samples = await redisReadTSData(
      MEMORY_TS_KEY,
      "used",
      period,
      startDate,
      endDate,
      resolution
    );

    const data = [{}];
    for (let i = 0; i < samples.length; i++) {
      const element = samples[i];

      data[i] = {
        used: element.getValue(),
        timestamp: element.getTimestamp(),
      };
    }

    return {
      fromDate: startDate,
      toDate: endDate,
      data: data,
    };
  },
};
trackedModels.set("Memory", Memory);

export const Disk = {
  getDiskData: async () => {
    const data = await si.disksIO();
    data["timestamp"] = new Date().getTime();
    return data;
  },

  subscribeToDiskIO: () => pubsub.asyncIterator("DISK_DATA"),

  getDiskHistory: async (option: string, toDate: number, fromDate: number) => {
    let resolution: number = 150;
    let startDate: number = 0;
    let endDate: number = 0;
    let period: string;

    switch (option) {
      case "Day":
        endDate = new Date().getTime();
        startDate = endDate - dayQueryLength;
        break;
      case "Week":
        endDate = new Date().getTime();
        startDate = endDate - weekQueryLength;
        break;
      case "Month":
        endDate = new Date().getTime();
        startDate = endDate - monthQueryLength;
        break;
      case "Year":
        endDate = new Date().getTime();
        startDate = endDate - yearQueryLength;
        break;
      case "Custom":
        endDate = toDate;
        startDate = fromDate;
        break;
      default:
        return;
    }

    if (endDate - startDate < shortTimeSeriesPeriod) period = "short";
    else if (endDate - startDate < mediumTimeSeriesPeriod) period = "medium";
    else if (endDate - startDate < longTimeSeriesPeriod) period = "long";
    else return;

    const readSamples = await redisReadTSData(
      DISK_TS_KEY,
      "read",
      period,
      startDate,
      endDate,
      resolution
    );

    const writeSamples = await redisReadTSData(
      DISK_TS_KEY,
      "write",
      period,
      startDate,
      endDate,
      resolution
    );

    const data = readSamples.map((readElement, index) => {
      const rIO = readElement.getValue();
      const wIO =
        index < writeSamples.length - 1 ? writeSamples[index].getValue() : null;
      return {
        rIO: rIO,
        wIO: wIO,
        tIO: wIO ? rIO + wIO : null,
        timestamp: readElement.getTimestamp(),
      };
    });

    return {
      fromDate: startDate,
      toDate: endDate,
      data: data,
    };
  },
};
trackedModels.set("Disk", Disk);

export const Traffic = {
  getTrafficHistory: async (
    option: string,
    toDate: number,
    fromDate: number
  ) => {
    let resolution: number = 150;
    let startDate: number = 0;
    let endDate: number = 0;
    let period: string;

    switch (option) {
      case "Day":
        endDate = new Date().getTime();
        startDate = endDate - dayQueryLength;
        break;
      case "Week":
        endDate = new Date().getTime();
        startDate = endDate - weekQueryLength;
        break;
      case "Month":
        endDate = new Date().getTime();
        startDate = endDate - monthQueryLength;
        break;
      case "Year":
        endDate = new Date().getTime();
        startDate = endDate - yearQueryLength;
        break;
      case "Custom":
        endDate = toDate;
        startDate = fromDate;
        break;
      default:
        return;
    }

    if (endDate - startDate < shortTimeSeriesPeriod) period = "short";
    else if (endDate - startDate < mediumTimeSeriesPeriod) period = "medium";
    else if (endDate - startDate < longTimeSeriesPeriod) period = "long";
    else return;

    const samples = await redisReadTSData(
      TRAFFIC_TS_KEY,
      "all",
      period,
      startDate,
      endDate,
      resolution,
      "SUM"
    );

    const data = [{}];
    for (let i = 0; i < samples.length; i++) {
      const element = samples[i];

      data[i] = {
        traffic: element.getValue(),
        timestamp: element.getTimestamp(),
      };
    }

    return {
      fromDate: startDate,
      toDate: endDate,
      data: data,
    };
  },
  getEndpointStatistics: async () => {
    const samples = await generalRedisClient.hgetall("end-points");
    let data: EndpointStatisticsSample[] = [];

    for (const key in samples) {
      data.push({
        endpoint: key,
        requestCount: parseInt(samples[key]),
      });
    }
    return {
      data: data,
    };
  },
  getDemographicHistory: async () => {
    const samples = await generalRedisClient.hgetall("demographic");
    let data: DemographicGeoStatisticsSample[] = [];

    for (const key in samples) {
      data.push({
        country: key,
        requestCount: parseInt(samples[key]),
      });
    }
    return {
      data: data,
    };
  },
};

export const System = {
  getTime: () => si.time(),
  getSystemData: () => si.system(),
  getBiosData: () => si.bios(),
  getOSInfo: () => si.osInfo(),
  subscribeToTime: () => pubsub.asyncIterator("TIME_DATA"),
};
trackedModels.set("System", System);

export const SystemRuntime = {
  getProcessesData: () => si.processes(),

  getUsersData: () => si.users(),

  subscribeToProcessData: () => pubsub.asyncIterator("PROCESSES_DATA"),
};

export const Docker = {
  getDockerInfo: () => si.dockerInfo(),

  getDockerContainersData: () => si.dockerContainers(),

  getDockerImageData: () => si.dockerImages(),

  getContainerStatus: (id) => si.dockerContainerStats(id),

  subscribeToDockerContainerStatus: withFilter(
    () => pubsub.asyncIterator("CONTAINER_STATUS"),
    (payload, variables) => {
      return payload.containerStatus.id === variables.id;
    }
  ),
};
trackedModels.set("Docker", Docker);

export const Alerts = {
  getAlerts: () =>
    new Promise((resolve, reject) => {
      const db = new sqlite3.Database("./database.db");
      const response: any = [];

      db.each(
        "SELECT id,type,start,end,metric,component,rangeName,AlertName as alertName  FROM Alerts",
        function (err, row) {
          if (err) reject(err);
          else response.push(row);
        },
        (err, n) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        }
      );
    }),
  saveAlerts: ({
    start,
    end,
    rangeName,
    metric,
    alertName,
    id,
    component,
    type,
  }) => {
    console.log("saving alert");

    try {
      const db = new sqlite3.Database("./database.db");
      if (id === -1) {
        var stmt = db.prepare("INSERT INTO Alerts VALUES (?,?,?,?,?,?,?,?)");
        stmt.run(
          [null, type, start, end, metric, component, rangeName, alertName],
          function () {
            addAlert({
              id: this.lastID ? this.lastID : -1,
              start: start,
              end: end,
              AlertName: alertName,
              component: component,
              metric: metric,
              rangeName: rangeName,
              type: type,
              contineuosTriggerCount: 0,
              fired: false,
            });
          }
        );
        stmt.finalize();
      } else if (id >= 0) {
        var inputData = [
          type,
          start,
          end,
          metric,
          component,
          rangeName,
          alertName,
          id,
        ];
        db.run(
          "UPDATE Alerts SET type =?, start=?, end=?,  metric=?, component=?, rangeName=?,  AlertName=?  WHERE id=?",
          inputData
        );

        updateAlert({
          id: id,
          type: type,
          start: start,
          end: end,
          AlertName: alertName,
          rangeName: rangeName,
          metric: metric,
          component: component,
          contineuosTriggerCount: 0,
          fired: false,
        });
      }
      db.close();
    } catch (e) {
      return false;
    }
    return true;
  },
};

export const NotifcationModel = {
  getNotifications: async () => {
    console.log("here");

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database("./database.db");
      const response: any = [];

      db.each(
        "SELECT * FROM Notifications;",
        function (err, row) {
          if (err) reject(err);
          else response.push(row);
        },
        (err, n) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  deletNotification: async ({ id }) => {
    const db = await open({
      filename: "./database.db",
      driver: sqlite3.Database,
    });
    const chainRow = await db.run("DELETE FROM Notifications where id = ?", [
      id,
    ]);
    if (!chainRow) return false;
    return true;
  },
};

export const CommandChains = {
  getCommandChains: async () => {
    const db = await open({
      filename: "./database.db",
      driver: sqlite3.Database,
    });
    const chainsRows = await db
      .all("SELECT * FROM CommandChains")
      .catch((err) => {
        console.log(`An error occured while reading command chains : ${err}`);
      });

    if (!chainsRows) {
      return null;
    }

    const CMDChains: CommandChain[] = [];

    for (let i = 0; i < chainsRows.length; i++) {
      const element = chainsRows[i];
      let args: string[] = [];
      const argRows = await db
        .all("SELECT * FROM ChainArguments WHERE chainID = ?", [element.id])
        .catch((err) => {
          console.log(`An error occured while trying to get args : ${err}`);
        });
      if (!argRows) {
        return null;
      }
      argRows.sort((a, b) => {
        if (a.argIndex < b.argIndex) return -1;
        else return 1;
      });
      args = argRows.map((item) => item.argument);
      const chains = readFileSync(element.scriptFileLocation).toString();

      CMDChains.push({
        id: element.id,
        arguments: args,
        chainName: element.chainName,
        scriptFileLocation: element.scriptFileLocation,
        chain: chains,
        passwordProtected: element.passwordProtected,
      });
    }

    return CMDChains;
  },
  saveCommandChain: async ({
    id,
    chainName,
    chain,
    args,
    argsChanged,
    scriptFileLocation,
    file,
    passwordProtected,
  }) => {
    const db = await open({
      filename: "./database.db",
      driver: sqlite3.Database,
    });

    const deleteNewRow = async (id: number) => {
      const deleteResult = await db
        .run("DELETE FROM CommandChains where id = ?", [id])
        .catch((err) => {
          console.log(`An error occured trying to delete new row: ${err}`);
        });
      if (!deleteResult) return;
      db.close();
    };

    try {
      if (id === -1) {
        if (!args) args = [];

        // will be changed below to accomadate multiple chains with the same name
        if (!scriptFileLocation)
          scriptFileLocation = `${getScriptsDir()}/${chainName}.sh`;

        const insertChainResult = await db
          .run("INSERT INTO CommandChains VALUES (?,?,?,?)", [
            null,
            chainName,
            scriptFileLocation,
            passwordProtected | 0,
          ])
          .catch((err) => {
            console.log(`An error occured trying to insert : ${err}`);
            db.close();
          });
        if (!insertChainResult) return false;

        for (let i = 0; i < args.length; i++) {
          const element = args[i];
          const insertArgResult = await db
            .run("INSERT INTO ChainArguments Values (?,?,?,?)", [
              null,
              insertChainResult.lastID,
              element,
              i,
            ])
            .catch((err) => {
              console.log(`An error occured : ${err}`);
              return;
            });
          if (!insertArgResult) {
            deleteNewRow(
              insertChainResult.lastID ? insertChainResult.lastID : -1
            );
            return false;
          }
        }
        let actualLocation: string = "";
        let dataToBeWritten: string = "";
        if (file) {
          const { filename, mimetype, createReadStream } =
            (await file) as FileUpload;

          actualLocation = `${getScriptsDir()}/${filename}.sh`;
          const inStream = createReadStream();
          const readFile = await new Promise<string>((resolve, reject) => {
            let data = "";
            inStream.on("data", (chunck) => {
              data += chunck;
            });
            inStream.on("end", () => {
              resolve(data);
            });
            inStream.on("error", (err) => {
              reject(err);
            });
          }).catch((err) => {
            console.log(
              `An error occured while trying to read the uploaded file`
            );
          });
          if (!readFile) {
            deleteNewRow(
              insertChainResult.lastID ? insertChainResult.lastID : -1
            );
            return false;
          }
          dataToBeWritten = readFile;
        } else {
          actualLocation = `${getScriptsDir()}/${insertChainResult.lastID}.sh`;
          dataToBeWritten = chain;
          // console.log(`Changing file location into ${actualLocation}`);
        }
        try {
          await ps.writeFile(actualLocation, `#!/bin/sh\n${dataToBeWritten}`);
          await ps.chown(actualLocation, await getUserID(), await getGroupID());
          await ps.chmod(actualLocation, 0o700);

          const updateChainResult = await db
            .run(
              "UPDATE CommandChains set scriptFileLocation = ? where id = ?",
              [actualLocation, insertChainResult.lastID]
            )
            .catch((err) => {
              console.log(
                `An error occured trying to update location : ${err}`
              );
            });

          if (!updateChainResult) {
            deleteNewRow(
              insertChainResult.lastID ? insertChainResult.lastID : -1
            );
            return false;
          }
        } catch (err) {
          console.log(
            `An error occured trying to write ${actualLocation} : ${err}`
          );
        }
      } else if (id >= 0) {
        if (chain) {
          try {
            await ps.writeFile(scriptFileLocation, `#!/bin/sh\n${chain}`);
          } catch (e) {
            console.log(
              `An error occured trying to write ${scriptFileLocation} : ${e}`
            );
            db.close();
            return false;
          }
        }

        if (argsChanged) {
          const deleteResult = db
            .run("delete from ChainArguments where chainID = ?", [id])
            .catch((err) => {
              console.log(
                `An error occured while trying to delete old args : ${err}`
              );
            });
          if (!deleteResult) {
            db.close();
            return false;
          }
          if (args) {
            for (let i = 0; i < args.length; i++) {
              const element = args[i];
              const insertArgResult = await db
                .run("INSERT INTO ChainArguments Values (?,?,?,?)", [
                  null,
                  id,
                  element,
                  i,
                ])
                .catch((err) => {
                  console.log(`An error occured : ${err}`);
                  return;
                });
              if (!insertArgResult) {
                db.close();
                return false;
              }
            }
          }
        }
        var inputData = [chainName, id];
        const updateResult = await db
          .run("UPDATE CommandChains SET chainName =? WHERE id=?", inputData)
          .catch((err) => {
            console.log(
              `An error occured trying to update ${chainName} : ${err}`
            );
          });
        if (!updateResult) {
          db.close();
          return false;
        }
      }
    } catch (e) {
      console.log(`An error occured : ${e}`);
      db.close();
      return false;
    }
    return true;
  },
  deleteCommandChain: async ({ id }) => {
    const db = await open({
      filename: "./database.db",
      driver: sqlite3.Database,
    });
    const chainRow = await db
      .get("select * from CommandChains where id = ?", [id])
      .catch((err) => {
        console.log(
          `An error occured while trying to fetch the command chain row : ${err}`
        );
      });

    if (!chainRow) {
      return false;
    }

    await ps.unlink(chainRow.scriptFileLocation).catch((err) => {
      console.log(
        `An error occured while trying to delete the script file : ${err}`
      );
    });
    const deleteArgsResult = await db
      .run("DELETE FROM ChainArguments WHERE chainID = ?", id)
      .catch((err) => {
        console.log(
          `An error occured while trying to delete arguments : ${err}`
        );
      });
    if (!deleteArgsResult) {
      return false;
    }

    const deleteResult = await db
      .run("DELETE FROM CommandChains WHERE id = ? ", id)
      .catch((err) => {
        console.log(
          `An error occured while trying to delete a command chains : ${err}`
        );
      });
    if (!deleteResult) {
      return false;
    }
    return true;
  },
  fireCommandChain: async ({ id, args, runWithSUDO }, req) => {
    if (runWithSUDO && !getSUDOChainsEnabled()) return null;
    const db = await open({
      filename: "./database.db",
      driver: sqlite3.Database,
    });

    const row = await db
      .get("SELECT * FROM CommandChains where id = ?", [id])
      .catch((err) => {
        console.log(
          `An error occured while trying to get command chain with id ${id} : ${err}`
        );
      });
    if (!row) {
      console.log("Row not found in database");

      db.close();
      return {
        firedSuccessfully: false,
        requiresPassword: false,
        output: null,
      };
    }
    if (row.passwordProtected || runWithSUDO) {
      req.session.chainID = id;
      req.session.runWithSUDO = runWithSUDO;
      req.session.oneTimePassword = generateOneTimePassword();
      req.session.chainArgs = args;
      return {
        firedSuccessfully: false,
        requiresPassword: true,
      };
    }
    return await fireCMDChain(id, args ? args : [], false, false);
  },
  fireProtectedCommandChain: async ({ password }, req) => {
    if (!req.session.chainID) {
      return {
        firedSuccessfully: false,
        requiresPassword: false,
        output: null,
      };
    }
    if (password === req.session.oneTimePassword) {
      return await fireCMDChain(
        req.session.chainID,
        req.session.chainArgs,
        true,
        req.session.runWithSUDO
      );
    }
    return {
      firedSuccessfully: false,
      requiresPassword: false,
      output: null,
    };
  },
};

export function generateOneTimePassword(): any {
  return "7D7D7D";
}
