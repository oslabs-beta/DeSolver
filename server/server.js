const PORT = 3000;
const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const app = express();

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
};

startApolloServer(typeDefs, resolvers);

async function startApolloServer(typeDefs, resolvers) {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  await server.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}...`);
  });
}
