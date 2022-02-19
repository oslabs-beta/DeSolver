const PORT = 3000;
const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const app = express();
const axios = require('axios');

const typeDefs = gql`
  type Query {
    hello: String
    getPopByCountry(country: String): Int
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
    getPopByCountry: async (_, { country }, context, info) => {
      try {
        const queryRes = await axios({
          method: 'GET',
          url: 'https://world-population.p.rapidapi.com/population',
          params: { country_name: country },
          headers: {
            'x-rapidapi-host': 'world-population.p.rapidapi.com',
            'x-rapidapi-key':
              '7f41d5564dmsh59dfbf8c3bf6336p160c99jsn22c3b8738e61',
          },
        });
        console.log(queryRes.data);
        const population = queryRes.data.body.population;
        return population;
      } catch (err) {
        console.log('error with getPopByCountry: ', err);
      }
    },
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
