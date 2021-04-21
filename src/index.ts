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
import { getAllAlerts } from "./Alerts/setupAlerts";
// const pubsub = new PubSub();

generalRedisClient.set("numOfSubs", 0);

const server = new ApolloServer({
  subscriptions: {
    path: "/subscriptions",
    onConnect: (connectionParams, webSocket, context) => {
      generalRedisClient
        .multi()
        .get("numOfSubs")
        .incr("numOfSubs")
        .exec((err, result) => {
          if (err) {
            // console.log(`Error at onConnect : ${err}`);
            return;
          }
          const numOfSubs = result[0][1];

          if (numOfSubs == 0) startRuntimeSample();
        });
    },
    onDisconnect: (webSocket, context) => {
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
  typeDefs,
  resolvers,
  context: ({ req, res }: any) => ({ req, res, RedisPubSub }),
});

const app = express();

var corsOptions = {
  origin: "http://localhost:3006",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());

app.use((req, _, next) => {
  const accessToken = req.cookies["access-token"];
  // try {
  //   const data = verify(accessToken, config.SECRET) as any;
  //   (req as any).username = data.username;
  // } catch {}
  (req as any).username = "string";
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
