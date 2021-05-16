import { readFileSync } from "fs";
import { parse } from "toml";
export const parseConfig = () => {
  let conf: any = {};
  const tomlFile = readFileSync("./woof_conf.toml").toString();

  try {
    conf = parse(tomlFile);
  } catch (err) {
    console.log(
      `An error occured while trying to parse the configuration file at line : ${err.line} and char ${err.column} : ${err}`
    );
    return null;
  }
  return conf;
};
