import * as express from "express";
import * as http from "http";
import { ApolloServer } from "apollo-server-express";
import typeDefs from "./GraphqlSchemas";
import resolvers from "./GraphqlResolvers";
import * as cookieParser from "cookie-parser";
import * as cors from "cors";
import { RedisPubSub } from "graphql-redis-subscriptions";
import {
  startRuntimeSample,
  startSampling,
  stopRuntimeSample,
} from "./sampler";

import * as session from "express-session";
import { randomBytes } from "crypto";
import { verify } from "jsonwebtoken";
import config from "./config";
import { setUpAlerts } from "./Alerts";
import { initAuthHandlers } from "./Authentication";
import { setUpScheduledTasks } from "./Scheduler";
import { convertTimeUnitToMS } from "./Utils";

let RedisStore = require("connect-redis")(session);
import { generalRedisClient, generateRedisClient } from "./Redis";
import { allowedModels } from "./Configuration";

generalRedisClient.set("numOfSubs", 0);
setUpScheduledTasks();
initAuthHandlers();

const server = new ApolloServer({
  uploads: false,
  subscriptions: {
    path: "/subscriptions",
    onConnect: async (connectionParams, webSocket, context) => {
      // const accessToken = connectionParams["accessToken"];
      // try {
      //   const data = verify(accessToken, config.SECRET) as any;
      // } catch {
      //   return false;
      // }

      let noError = true;
      await generalRedisClient
        .multi()
        .get("numOfSubs")
        .incr("numOfSubs")
        .exec((err, result) => {
          if (err) {
            noError = false;
            return;
          }
          const numOfSubs = result[0][1];

          if (numOfSubs == 0) startRuntimeSample();
        });

      return noError;
    },
    onDisconnect: (webSocket, context) => {
      // const accessToken = context.request.headers.cookie
      //   ?.match("(^|;)[ ]*access-token=([^;]+)")
      //   ?.pop();
      // if (!accessToken) return;
      // try {
      //   const data = verify(accessToken, config.SECRET) as any;
      // } catch {
      //   return;
      // }
      generalRedisClient
        .multi()
        .decr("numOfSubs")
        .get("numOfSubs")
        .exec((err, result) => {
          if (err) {
            //console.log(`Error at onDisconnect : ${err}`);
            return;
          }
          const numOfSubs = result[1][1];
          if (numOfSubs == 0) stopRuntimeSample();
          else if (numOfSubs < 0) generalRedisClient.set("numOfSubs", 0);
        });
    },
  },
  resolvers,
  typeDefs,
  context: ({ req, res }: any) => {
    return {
      req,
      res,
      RedisPubSub,
      models: allowedModels,
    };
  },
});

const app = express();

var whitelist = [
  "http://localhost:5000",
  "http://localhost:3006",
  "https://server-monitor.netlify.app",
];

var corsOptions = {
  origin: function (origin, callback) {
    // if (whitelist.indexOf(origin) !== -1) callback(null, true);
    callback(null, true);
  },
  credentials: true,
};

app.use(
  session({
    name: "authID",
    secret: randomBytes(8).toString("hex"),
    store: new RedisStore({ client: generateRedisClient() }),
    cookie: {
      maxAge: convertTimeUnitToMS("m") * 2,
    },
    unset: "destroy",
    saveUninitialized: false,
    resave: false,
  })
);
app.use(cors(corsOptions));
app.use(cookieParser());

app.use((req, _, next) => {
  const accessToken = req.cookies["access-token"];
  try {
    const data = verify(accessToken, config.SECRET) as any;
    (req as any).username = data.username;
  } catch {}
  next();
});

server.applyMiddleware({ app, cors: corsOptions });
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen({ port: 4000 }, () => {
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  const subPath = server.subscriptionsPath;
  console.log(`Subscriptions are at ws://localhost:4000${subPath}`);
});

startSampling();
setUpAlerts();
