import getCPUData from "./CPUDataResolvers/getCPUData";
import getTimeData from "./SystemDataResolvers/getTimeData";
import getCpuCacheData from "./CPUDataResolvers/getCpuCacheData";
import getSystemData from "./SystemDataResolvers/getSystemData";
import getBiosData from "./SystemDataResolvers/getBiosData";
import getCpuCurrentSpeedData from "./CPUDataResolvers/getCpuCurrentSpeedData";
import getCpuTemperatureData from "./CPUDataResolvers/getCpuTemperatureData";
import getMemData from "./MemoryDataResolvers/getMemData";
import getCurrentLoadData from "./LoadDataResolvers/getCurrentLoadData";
import getOsInfo from "./SystemDataResolvers/getOsInfo";
import * as jwt from "jsonwebtoken";
import { promises as ps } from "fs";
import { AuthenticationError, withFilter } from "apollo-server";
import config from "../config";
import getDiskData from "./DiskDataResolvers/getDiskData";
import getDiskHistoryData from "./DiskDataResolvers/getDiskHistoryData";
import getCPUHistoryData from "./CPUDataResolvers/getCPUHistoryData";
import getMemHistoryData from "./MemoryDataResolvers/getMemHistoryData";
import getUsersData from "./SystemDataResolvers/getUsersData";
import getProcessesData from "./LoadDataResolvers/getProcessesData";
import { pubsub } from "../pubsub";
import getTrafficHistoryData from "./getTrafficHistoryData";
import getEndpointStatisticsHistory from "./getEndpointStatisticsHistory";
import getDemographicStatisticsHistory from "./getDemographicGeoStatisticsData";
import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import getAlerts from "./getAlerts";
import getDockerInfo from "./DockerDataResolvers/getDockerInfo";
import getDockerContainersData from "./DockerDataResolvers/getDockerContainersData";
import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";
import getDockerImageData from "./DockerDataResolvers/getDockerImageData";
import getContainerStatus from "./DockerDataResolvers/getContainerStatus";
import { addAlert, updateAlert } from "../Alerts/alerts";
import { fireCMDChain } from "../Commands/commandChains";
import { getCommandChains } from "./getCommandChains";

const getToken = ({ username, password }) =>
  jwt.sign(
    {
      username,
      password,
    },
    config.SECRET,
    { expiresIn: "20d" }
  );

const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,

  Subscription: {
    MemData: {
      subscribe: () => pubsub.asyncIterator("NEW_MEM"),
    },
    Time: {
      subscribe: () => pubsub.asyncIterator("TIME_DATA"),
    },
    CurrentLoad: {
      subscribe: () => pubsub.asyncIterator("CURRENT_CPU_LOAD"),
    },
    DiskData: {
      subscribe: () => pubsub.asyncIterator("DISK_DATA"),
    },
    ProcessesData: {
      subscribe: () => pubsub.asyncIterator("PROCESSES_DATA"),
    },
    containerStatus: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("CONTAINER_STATUS"),
        (payload, variables) => {
          return payload.containerStatus.id === variables.id;
        }
      ),
    },
  },
  Query: {
    Time: getTimeData,
    cpu: getCPUData,
    CPUHistory: getCPUHistoryData,
    cpuCache: getCpuCacheData,
    system: getSystemData,
    bios: getBiosData,
    CpuCurrentSpeedData: getCpuCurrentSpeedData,
    CpuTemperatureData: getCpuTemperatureData,
    MemData: getMemData,
    MemHistory: getMemHistoryData,
    CurrentLoad: getCurrentLoadData,
    OsInfo: getOsInfo,
    DiskData: getDiskData,
    DiskHistory: getDiskHistoryData,
    ProcessesData: getProcessesData,
    TrafficHistory: getTrafficHistoryData,
    EndpointStatisticsHistory: getEndpointStatisticsHistory,
    DemographicGeoStatisticsHistory: getDemographicStatisticsHistory,
    UsersData: getUsersData,
    Alerts: getAlerts,
    CommandChains: getCommandChains,
    DockerInfo: getDockerInfo,
    DockerContainersData: getDockerContainersData,
    DockerImageData: getDockerImageData,
    containerStatus: getContainerStatus,
  },
  Mutation: {
    login(_, { username, password }, { res }) {
      const user = {
        username: "admin",
        password: "admin",
      };

      if (user.username !== username)
        throw new AuthenticationError("this user is not found!");

      const match = password === user.password;
      if (!match) throw new AuthenticationError("wrong password!");

      const accessToken = getToken(user);
      res.cookie("access-token", accessToken);
      return {
        id: user.username,
      };
    },
    alert(
      _,
      { start, end, rangeName, metric, alertName, id, component, type },
      { res }
    ) {
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
          });
        }
        db.close();
      } catch (e) {
        return false;
      }
      return true;
    },
    async saveCommandChain(
      _,
      { id, chainName, chain, args, argsChanged, scriptFileLocation },
      { res }
    ) {
      // console.log("Inside save command chain");
      // console.log(
      //   `id  :${id}, chain name : ${chainName}, script file location : ${scriptFileLocation}, chain : ${chain}, working directory : ${workingDirectory}, arguments : ${args}`
      // );
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
          console.log("Inserting into database");
          if (!args) args = [];

          // will be changed below to accomadate multiple chains with the same name
          if (!scriptFileLocation)
            scriptFileLocation = `scripts/${chainName}.sh`;
          // console.log(
          //   `id  :${id}, chain name : ${chainName}, script file location : ${scriptFileLocation}, chain : ${chain}, working directory : ${workingDirectory}, arguments : ${args}`
          // );
          const insertChainResult = await db
            .run("INSERT INTO CommandChains VALUES (?,?,?)", [
              null,
              chainName,
              scriptFileLocation,
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

          let actualLocation: string = `scripts/${insertChainResult.lastID}.sh`;
          // console.log(`Changing file location into ${actualLocation}`);
          try {
            await ps.writeFile(actualLocation, `#!/bin/sh\n${chain}`);
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
          console.log("Updating chain");

          if (chain) {
            console.log("new chain inserted");
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
    async fireCommandChain(_, { id, args }, { res }) {
      return await fireCMDChain(id, args);
    },
    async deleteCommandChains(_, { id }, { res }) {
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
  },
};

export default resolvers;
