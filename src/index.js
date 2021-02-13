const express = require("express");
const si = require("systeminformation");
const { ApolloServer, gql } = require("apollo-server-express");
import { TimeData, CpuData, CpuCacheData } from "./GraphqlSchemas";

const typeDefs = [
  gql`
    type Query {
      time: TimeData
      cpu: CpuData
    }
  `,

  TimeData,
  CpuData,
  CpuCacheData,
];

const resolvers = {
  Query: {
    time: () => si.time(),
    cpu: () => si.cpu(),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const app = express();
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
