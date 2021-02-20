import * as express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import typeDefs from "./GraphqlSchemas";
import resolvers from "./GraphqlResolvers";
import { verify } from "jsonwebtoken";
import config from "./config";
import * as cookieParser from "cookie-parser";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }: any) => ({ req, res }),
});
const app = express();
app.use(cookieParser());
app.use((req, _, next) => {
  const accessToken = req.cookies["access-token"];
  try {
    const data = verify(accessToken, config.SECRET) as any;
    (req as any).username = data.username;
  } catch {}
  next();
});

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  // tslint:disable-next-line:no-console
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
