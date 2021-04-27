import * as sqlite3 from "sqlite3";
import { readFileSync } from "fs";
import { open } from "sqlite";
import { CommandChain } from "../Commands/modules";
export const getCommandChains = async (_, __, context) => {
  if (!context.req.username) return;
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
    const chainsString = readFileSync(element.scriptFileLocation);
    const chains = chainsString.toString().split("\n");
    chains.shift();
    CMDChains.push({
      id: element.id,
      arguments: args,
      chainName: element.chainName,
      scriptFileLocation: element.scriptFileLocation,
      chain: chains,
    });
  }
  return CMDChains;
};
