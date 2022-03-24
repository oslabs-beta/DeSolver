require('dotenv').config();
const PORT = 3000;
const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const app = express();
const typeDefs = require('./server/server');
const resolvers = require('./server/server');
const supertest = require('supertest');

async function startApolloServer(typeDefs, resolvers) {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  return app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}...`);
  });
}

// this is the query we use for our test
const queryHello = {
  query: `query helloWorld {
    helloWorld
  }`,
};

describe('e2e demo', () => {
  let server;
  let url = 'http://localhost:3000/graphql';

  // before the tests we will spin up a new Apollo Server
  beforeAll(async () => {
    // Note we must wrap our object destructuring in parentheses because we already declared these variables
    // We pass in the port as 0 to let the server pick its own ephemeral port for testing
    server = await startApolloServer(typeDefs, resolvers);
  });

  // after the tests we will stop our server
  afterAll(async () => {
    await server?.close();
  });

  it('says hello', async () => {
    // send our request to the url of the test server
    const response = await supertest(url).post('/').send(queryHello);
    expect(response.errors).toBeUndefined();
    expect(response.body.data?.hello).toBe('Hello World!');
  });
});
