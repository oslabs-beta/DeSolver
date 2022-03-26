const { startApolloServer, typeDefs, resolvers } = require('./server/server')
const request = require('supertest')

// this is the query we use for our test
const queryHello = {
  query: `query helloWorld {
    helloWorld
  }`,
};

describe('e2e demo', () => {
  let server;

  // before the tests we will spin up a new Apollo Server
  beforeAll(async () => {
    // Note we must wrap our object destructuring in parentheses because we already declared these variables
    // We pass in the port as 0 to let the server pick its own ephemeral port for testing
    server = await startApolloServer(typeDefs, resolvers, 0);
  });

  // after the tests we will stop our server
  afterAll(async () => {
    await server?.close();
  });

  it('says hello', async () => {
    // send our request to the url of the test server
    const response = await request(server).post('/graphql').send(queryHello);
    expect(response.errors).toBeUndefined();
    expect(response.body.data?.helloWorld).toBe('Hello Final!');
  });
});
