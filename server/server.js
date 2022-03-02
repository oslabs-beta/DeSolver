require('dotenv').config();
const PORT = 3000;
const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const app = express();
const axios = require('axios');
const db = require('../models/elephantConnect');
const { Desolver } = require('./desolver');

const typeDefs = gql`
  type Query {
    hello: String
    getPopByCountry(country: String): Int
    getAllCountries: [Country]
    population: Population
  }
  type Population {
    population: Int
  }
  type Country {
    country_id: String
    country_name: String
    region_id: Int
    population: Population
  }
`;

// Desolver Test Middleware for hello root query
const helloFirst = async (parent, args, context, info, next) => {
  console.log('Hello First!');
  next();
};
const helloSecond = async (parent, args, context, info, next) => {
  console.log('Hello Second!');
  next();
};
const helloThird = async (parent, args, context, info, next) => {
  console.log('Hello Third!');
  next();
};

// Desolver Test Middleware for getAllCountries root query
const queryAllCountries = async (_, __, context, info) => {
  try {
    const query = `SELECT * FROM countries;`;
    const allCountries = await db.query(query);
    return allCountries.rows;
  } catch (err) {
    console.log('error in getAllCountries: ', err);
  }
}

const resolvers = {
  Query: {
    hello: Desolver.use(helloFirst, helloSecond, helloThird, (parent, args, context, info) => 'Hello Final!'),

    getPopByCountry: async (parent, args, context, info) => {
      try {
        const desolver = new Desolver(parent, args, context, info);
        return desolver.composePipeline(async (parent, args, context, info) => {
          const { country } = args;
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
          const population = queryRes.data.body.population;
          return population;
        });
      } catch (err) {
        console.log('error with getPopByCountry: ', err);
      }
    },

    getAllCountries: Desolver.use(queryAllCountries),
  },

  Country: {
    population: async (parent, __, context, info) => {
      console.log('in the population query');
      try {
        let name = parent.country_name;
        console.log('NAME in Population Query: ', name);
        const queryRes = await axios({
          method: 'GET',
          url: 'https://world-population.p.rapidapi.com/population',
          params: { country_name: name },
          headers: {
            'x-rapidapi-host': 'world-population.p.rapidapi.com',
            'x-rapidapi-key':
              '7f41d5564dmsh59dfbf8c3bf6336p160c99jsn22c3b8738e61',
          },
        });
        console.log(queryRes.data);
        const population = queryRes.data.body.population;
        return { population };
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
  server.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}...`);
  });
}
