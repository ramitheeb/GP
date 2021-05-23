import { exec as execCB } from "child_process";
import { promises as ps } from "fs";
import * as utils from "util";
import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import { CommandChain } from ".";
import { getChainsEnabled, isSUDO } from "../Configuration";
const exec = utils.promisify(execCB);
const errorLog = "src/Commands/CMDChainErrors.log";
const outputLog = "src/Commands/CMDChainOutput.log";

export const fireCMDChain = async (
  id: number,
  args: string[],
  passwordSent: boolean,
  runWithSUDO: boolean
) => {
  if (!getChainsEnabled()) return null;
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

  const CMDChain: CommandChain = {
    id: row.id,
    chainName: row.chainName,
    arguments: args,
    scriptFileLocation: row.scriptFileLocation,
    passwordProtected: row.passwordProtected,
  };

  let command = "";
  if (!runWithSUDO && isSUDO()) {
    command = 'su -c "';
  }
  command += `${CMDChain.scriptFileLocation} `;
  for (let i = 0; i < CMDChain.arguments.length; i++) {
    const element = CMDChain.arguments[i];
    command += `${element} `;
  }
  command += "";
  if (!runWithSUDO && isSUDO()) {
    command += '" ibrahim-ubuntu';
  }

  const firedCMD = await exec(command).catch((e) => {
    ps.appendFile(
      errorLog,
      `${CMDChain.chainName} produced an error :-\n ${e} \n at ${new Date()}\n`
    ).catch((err) => {
      console.log(`An error occured while writing to ${errorLog} :-\n${err}\n`);
    });
  });
  if (!firedCMD) {
    console.log("An error occured and the command wasn't fired");

    return {
      firedSuccessfully: false,
      output: null,
    };
  }

  if (firedCMD.stdout !== "") {
    ps.appendFile(
      outputLog,
      `${CMDChain.chainName} output is :-\n"${
        firedCMD.stdout
      }" at ${new Date()}\n`
    ).catch((err) => {
      console.log(`An error occured while writing to ${outputLog} : "${err}"`);
    });
  }
  if (firedCMD.stderr !== "") {
    ps.appendFile(
      errorLog,
      `${CMDChain.chainName} produced an error :-\n${
        firedCMD.stderr
      }\n at ${new Date()}\n`
    ).catch((err) => {
      console.log(`An error occured while writing to ${errorLog} : "${err}"`);
    });
    return {
      firedSuccessfully: false,
      output: null,
    };
  }

  return {
    firedSuccessfully: true,
    output: firedCMD.stdout,
  };
};

export const reboot = async () => {
  let command = "reboot";
  // return new Promise(async (resolve, reject) => {
  //   setTimeout(async () => {
  //     console.log("rebooting");

  //     const firedCMD = await exec(command).catch((e) => {
  //       ps.appendFile(
  //         errorLog,
  //         `rebooting produced an error :-\n ${e} \n at ${new Date()}\n`
  //       ).catch((err) => {
  //         console.log(
  //           `An error occured while writing to ${errorLog} :-\n${err}\n`
  //         );
  //       });
  //     });
  //     if (!firedCMD) {
  //       console.log("An error occured and the command wasn't fired");
  //       resolve({
  //         firedSuccessfully: false,
  //         output: null,
  //       });
  //       return;
  //     }

  //     if (firedCMD.stdout !== "") {
  //       ps.appendFile(
  //         outputLog,
  //         `rebooting output is :-\n"${firedCMD.stdout}" at ${new Date()}\n`
  //       ).catch((err) => {
  //         console.log(
  //           `An error occured while writing to ${outputLog} : "${err}"`
  //         );
  //       });
  //     }
  //     if (firedCMD.stderr !== "") {
  //       ps.appendFile(
  //         errorLog,
  //         `rebooting produced an error :-\n${
  //           firedCMD.stderr
  //         }\n at ${new Date()}\n`
  //       ).catch((err) => {
  //         console.log(
  //           `An error occured while writing to ${errorLog} : "${err}"`
  //         );
  //       });
  //       resolve({
  //         firedSuccessfully: false,
  //         output: null,
  //       });
  //       return;
  //     }
  //     resolve({
  //       firedSuccessfully: true,
  //       output: firedCMD.stdout,
  //     });
  //   }, 1000);
  // });
};
