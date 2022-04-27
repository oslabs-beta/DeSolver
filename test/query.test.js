const { startApolloServer, typeDefs, resolvers } = require('../server/server');
const request = require('supertest');

// queries to be tested
const queryHello = {
  query: `query helloWorld {
    helloWorld
  }`,
};
const queryHelloDesolver = {
  query: `query hello {
    hello
  }`,
};

describe('e2e demo', () => {
  let server;

  // before the tests we will spin up a new Apollo Server
  beforeAll(async () => {
    server = await startApolloServer(typeDefs, resolvers, 0);
  });

  // after the tests we will stop our server
  afterAll(async () => {
    await server?.close();
  });

  it('says "Hello World!"', async () => {
    // send our request to the url of the test server
    const response = await request(server).post('/graphql').send(queryHello);
    expect(response.errors).toBeUndefined();
    expect(response.body.data?.helloWorld).toBe('Hello World!');
  });

  it('says "Hello Final!" and runs Desolver function args', async () => {
    const response = await request(server)
      .post('/graphql')
      .send(queryHelloDesolver);
    expect(response.errors).toBeUndefined();
    expect(response.body.data?.hello).toBe('Hello Final!');
  });
});
