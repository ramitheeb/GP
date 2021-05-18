import { randomBytes } from "crypto";
import * as session from "express-session";
import * as Redis from "ioredis";
let redisSessionClient = new Redis();
let RedisStore = require("connect-redis")(session);

const express = require("express");
const app = express();
const port = 3000;
app.use(
  session({
    name: "authID",
    secret: randomBytes(8).toString("hex"),
    store: new RedisStore({ client: redisSessionClient }),
    cookie: {
      maxAge: 100000000,
    },
    unset: "destroy",
    saveUninitialized: false,
    resave: false,
  })
);
app.use((req, res, next) => {
  console.log("here");

  req.session.hi = "pi";
  next();
});
app.get("/", (req, res) => {
  console.log("here");

  req.session.hi = "pi";

  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
