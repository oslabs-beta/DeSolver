import 'dotenv/config'
import { ApolloServer } from 'apollo-server-express';
import { DocumentNode } from 'graphql';
import express from 'express';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import { ResolversMap } from './desolver'
const app = express();
const PORT = 3000;


if (process.env.NODE_ENV !== 'test') {
  startApolloServer(typeDefs, resolvers, PORT);
}

async function startApolloServer(typeDefs: DocumentNode, resolvers: ResolversMap, apolloPort: number) {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, bodyParserConfig: true });

  return app.listen(apolloPort, () => {
    console.log(`Apollo GraphQL Server listening on port: ${apolloPort}...`);
  });
}

export = { startApolloServer, typeDefs, resolvers };
