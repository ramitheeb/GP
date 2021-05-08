import * as express from "express";
import * as http from "http";
import { ApolloServer, gql } from "apollo-server-express";
import typeDefs from "./GraphqlSchemas";
import resolvers from "./GraphqlResolvers";
import * as cookieParser from "cookie-parser";
import * as cors from "cors";
import * as systemInformation from "systeminformation";
import { RedisPubSub } from "graphql-redis-subscriptions";
import { generalRedisClient, pubsub } from "./pubsub";
import {
  startRuntimeSample,
  startSampling,
  stopRuntimeSample,
} from "./sampler";
import { getAllAlerts } from "./Alerts/alerts";
import { setUpScheduledTasks } from "./Scheduler/scheduler";
import {
  Alerts,
  CommandChains,
  CPU,
  Disk,
  Docker,
  Memory,
  System,
  SystemRuntime,
  Traffic,
} from "./Models/models";
import { initAuthHandlers } from "./Authentication/handlers";
import * as session from "express-session";
import * as Redis from "ioredis";
import { randomBytes } from "crypto";
import { convertTimeUnitToMS } from "./Utils/round_up_time";
import { verify } from "jsonwebtoken";
import config from "./config";
// const pubsub = new PubSub();

let RedisStore = require("connect-redis")(session);
let redisSessionClient = new Redis();

generalRedisClient.set("numOfSubs", 0);
setUpScheduledTasks();
initAuthHandlers();

const server = new ApolloServer({
  uploads: false,
  subscriptions: {
    path: "/subscriptions",
    onConnect: async (connectionParams, webSocket, context) => {
      const accessToken = connectionParams["accessToken"];
      try {
        const data = verify(accessToken, config.SECRET) as any;
      } catch {
        return false;
      }
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
      console.log("disconnected");

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
        });
    },
  },
  resolvers,
  typeDefs,
  context: ({ req, res }: any) => ({
    req,
    res,
    RedisPubSub,
    models: {
      CPU: CPU,
      Memory: Memory,
      Disk: Disk,
      Traffic: Traffic,
      System: System,
      SystemRuntime: SystemRuntime,
      Docker: Docker,
      Alerts: Alerts,
      CommandChains: CommandChains,
    },
  }),
});

const app = express();

var corsOptions = {
  origin: "http://localhost:3006",
  credentials: true,
};

app.use(
  session({
    name: "authID",
    secret: randomBytes(8).toString("hex"),
    store: new RedisStore({ client: redisSessionClient }),
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
getAllAlerts();
//systemInformation.dockerContainers().then((date) => console.log(date));
