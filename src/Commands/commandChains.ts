import { exec as execCB } from "child_process";
import { promises as ps } from "fs";
import * as utils from "util";
import { CommandChain } from "./modules";
import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
const exec = utils.promisify(execCB);
const errorLog = "src/Commands/CMDChainErrors.log";
const outputLog = "src/Commands/CMDChainOutput.log";

export const fireCMDChain = async (id: number) => {
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
    db.close();
    return {
      firedSuccessfully: false,
      output: null,
    };
  }

  const args: string[] = [];
  const argRows = await db.all(
    "SELECT * FROM ChainArguments WHERE chainID = ?",
    [id]
  );

  argRows.sort((a, b) => {
    if (a.argIndex < b.argIndex) return -1;
    else return 1;
  });

  for (let i = 0; i < argRows.length; i++) {
    const element = argRows[i];
    args.push(element.argument);
  }
  const CMDChain: CommandChain = {
    id: row.id,
    chainName: row.chainName,
    arguments: args,
    scriptFileLocation: row.scriptFileLocation,
    workingDirectory: row.workingDirectory,
  };

  let command = `"${CMDChain.scriptFileLocation}" `;
  for (let i = 0; i < CMDChain.arguments.length; i++) {
    const element = CMDChain.arguments[i];
    command += `${element} `;
  }

  const firedCMD = await exec(command, {}).catch((e) => {
    ps.appendFile(
      errorLog,
      `${CMDChain.chainName} produced an error : "${e}" at ${new Date()}\n`
    ).catch((err) => {
      console.log(`An error occured while writing to ${errorLog} : ${err}`);
    });
  });
  if (!firedCMD) {
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
      `${CMDChain.chainName} produced an error : "${
        firedCMD.stderr
      }" at ${new Date()}\n`
    ).catch((err) => {
      console.log(`An error occured while writing to ${errorLog} : "${err}"`);
    });
  }
  return {
    firedSuccessfully: true,
    output: firedCMD.stdout,
  };
};
