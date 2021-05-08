import { open } from "sqlite";
import * as sqlite3 from "sqlite3";
import { handleAuth } from "./handlers";
import { AuthInfoRequest } from "./modules";
import * as jwt from "jsonwebtoken";
import config from "../config";
import { promises as ps } from "fs";
const getToken = ({ username }) =>
  jwt.sign({ username }, config.SECRET, { expiresIn: "20d" });
export const Auth = {
  authenticationRequest: async (
    { username, serviceName, submethods },
    { req }
  ) => {
    const db = await open({
      filename: "./database.db",
      driver: sqlite3.Database,
    });
    const userRow = await db
      .get("SELECT * FROM Users WHERE username = ?", [username])
      .catch((err) => {
        console.log(
          `An error occured while trying to fetch user from database`
        );
      });
    if (!userRow) {
      return {
        fail: true,
      };
    }
    req.session.service = serviceName;
    req.session.authLevel = 1;
    req.session.username = userRow.username;

    let auth: boolean | AuthInfoRequest;
    try {
      auth = await handleAuth(serviceName, 0, {}, req.session);
    } catch (e) {
      req.session = null;
      throw Error("Undefined Authentication Method");
    }
    if (auth === true) {
      return {
        success: true,
      };
    } else if (auth === false) {
      req.session = null;
      return {
        fail: true,
      };
    } else
      return {
        infoRequest: auth,
      };
  },
  authenticationInfoResponse: async (
    { numOfResponses, responses },
    { req, res }
  ) => {
    if (!req.session.username)
      return {
        fail: true,
      };
    const service = req.session.service;
    const authLevel = parseInt(req.session.authLevel);

    const auth = await handleAuth(service, authLevel, responses, req.session);
    if (auth === true) {
      const accessToken = getToken({ username: req.session.username });

      res.cookie("access-token", accessToken);
      return {
        success: true,
      };
    } else if (auth === false) {
      req.session = null;
      return {
        fail: true,
      };
    } else {
      req.session.authLevel++;

      return {
        infoRequest: auth,
      };
    }
  },
  addPublickKeyUser: async ({ username, publickKey }, { req }) => {
    if (!req.username) return false;
    const db = await open({
      filename: "./database.db",
      driver: sqlite3.Database,
    });
    const userRow = await db
      .get("SELECT * FROM Users WHERE username = ?", [username])
      .catch((err) => {
        console.log(
          `An error occured while trying to fetch user from database`
        );
      });
    if (!userRow) {
      const insertResult = await db
        .run("INSERT INTO Users VALUES (?,?)", [username, "std"])
        .catch((err) => {
          console.log(`An error occured while trying to insert new user`);
        });
      if (!insertResult) {
        return false;
      }
    }

    const writeResult = await ps
      .writeFile(`keys/${username}.pem`, publickKey)
      .catch((err) => {
        console.log(`An error occured while trying to write key : ${err}`);
      });

    const keyInsert = await db.run("INSERT INTO KeyAuth VALUES (?,?)", [
      username,
      `keys/${username}.pem`,
    ]);
    if (!keyInsert) return false;
    return true;
  },
};
