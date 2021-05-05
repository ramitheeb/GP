import { createPublicKey, createVerify, randomBytes } from "crypto";
import { generalRedisClient } from "../pubsub";
import { AuthInfoRequest } from "./modules";
import { open } from "sqlite";
import * as sqlite3 from "sqlite3";
import { readFileSync } from "fs";
export const authHandlers: Map<
  string,
  ((reponses, session) => Promise<boolean | AuthInfoRequest>)[]
> = new Map<string, ((reponses) => Promise<boolean | AuthInfoRequest>)[]>();

const keyAuthSignature = async (response, session) => {
  if (!session.username) return false;
  const nonce = randomBytes(64);
  session.nonce = nonce.toString("hex");

  return {
    name: "Key Pair Authentication SHA256",
    instruction: "Sign the following number with your private key",
    values: [nonce.toString("hex")],
    numOfPrompts: 1,
    prompts: ["Signature : "],
    echo: [true],
  } as AuthInfoRequest;
};

const keyAuthHandler = async (responses, session) => {
  if (!session.username) return false;
  const username = session.username;

  const db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });

  const userRow = await db
    .get("SELECT * from KeyAuth WHERE username = ?", [username])
    .catch((err) => {
      console.log(
        `An error occured while trying to get the public key location : ${err}`
      );
    });
  if (!userRow) {
    return false;
  }
  const publicKey = createPublicKey(
    readFileSync(`./${userRow.publicKeyLocation}`)
  );

  const verify = createVerify("SHA256");
  verify.update(Buffer.from(session.nonce, "hex"));
  verify.end();

  const verified = verify.verify(publicKey, Buffer.from(responses[0], "hex"));
  return verified;
};

const passwordHandlerSignature = async () => {
  return {
    name: "Password authentication",
    instruction: "enter first password : ",
    numOfPrompts: 1,
    values: [],
    prompts: ["first password : "],
    echo: [false],
  } as AuthInfoRequest;
};

const firstPasswordHandler = async (reponses) => {
  console.log("here");

  if (reponses[0] === "somepassword")
    return {
      name: "second password authentication",
      instruction: "enter second password",
      numOfPrompts: 1,
      values: [],
      prompts: ["second password : "],
      echo: [false],
    } as AuthInfoRequest;
  else if (reponses[0] === "onehandler") return true;
  return false;
};

const secondPasswordHandler = async (reponses) => {
  if (reponses[0] === "secondpassword") return true;
  return false;
};

export const initAuthHandlers = () => {
  authHandlers.set("password_handler", [
    passwordHandlerSignature,
    firstPasswordHandler,
    secondPasswordHandler,
  ]);
  authHandlers.set("key_pair_RSA_SHA256", [keyAuthSignature, keyAuthHandler]);
};

export const addAuthHandler = (
  handlers: ((reponses, sessionID) => Promise<boolean | AuthInfoRequest>)[],
  handlerName: string
) => {
  authHandlers.set(handlerName, handlers);
};

export const handleAuth = (
  handlerName: string,
  requestNumber: number,
  response,
  session
) => {
  const handler = authHandlers.get(handlerName);
  if (!handler) throw Error("Undefined Authentication Method");
  return handler[requestNumber](response, session);
};
