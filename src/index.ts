import * as express from "express";
import * as http from "http";

import { ApolloServer, gql } from "apollo-server-express";
import typeDefs from "./GraphqlSchemas";
import resolvers from "./GraphqlResolvers";
import { verify } from "jsonwebtoken";
import config from "./config";
import * as cookieParser from "cookie-parser";
import * as cors from "cors";
import { PubSub } from "graphql-subscriptions";
import * as systemInformation from "systeminformation";

const pubsub = new PubSub();

const server = new ApolloServer({
  subscriptions: {
    path: "/subscriptions",
    onConnect: (connectionParams, webSocket, context) => {},
    onDisconnect: (webSocket, context) => {},
  },
  typeDefs,
  resolvers,
  context: ({ req, res }: any) => ({ req, res, pubsub }),
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
  // } catch { }
  (req as any).username = "string";
  next();
});

server.applyMiddleware({ app, cors: corsOptions });
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen({ port: 4000 }, () => {
  // tslint:disable-next-line:no-console
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  const subPath = server.subscriptionsPath;
  console.log(`Subscriptions are at ws://localhost:4000${subPath}`);
});

setInterval(() => {
  systemInformation.mem().then((data) => {
    pubsub.publish("NEW_MEM", { MemData: data });
  });
}, 2000);

setInterval(() => {
  systemInformation.disksIO().then((data) => {
    pubsub.publish("DISK_DATA", {
      DiskData: data,
    });
  });
}, 2000);

setInterval(() => {
  pubsub.publish("TIME_DATA", { Time: systemInformation.time() });
}, 1000);

setInterval(() => {
  systemInformation.currentLoad().then((data) => {
    pubsub.publish("CURRENT_CPU_LOAD", { CurrentLoad: data });
  });
}, 1000);
