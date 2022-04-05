require('dotenv').config();
const process = require('process');
const PORT = 3000;
const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const app = express();
const axios = require('axios');
const db = require('../models/elephantConnect');
const { Desolver } = require('./desolver');

const typeDefs = gql`
  type Query {
    helloWorld: String
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
    address: Address
  }
  type Address {
    address: String
    city: String
    state_province: String
    country_id_address: String
  }
`;

// Desolver Test Middleware for hello root query
const helloFirst = async (parent, args, context, info, next, escapeHatch) => {
  console.log('Hello First!');
  return next();
};
const helloSecond = async (parent, args, context, info, next, escapeHatch) => {
  console.log('Hello Second before try/catch!');
  escapeHatch();
  return next();
  try {
    console.log('Hello Second!');
    // escapeHatch();
    // console.log('escapeHatch complete!');
    return next();
  } catch (error) {
    return error;
  }
};
const helloThird = async (parent, args, context, info, next, escapeHatch) => {
  console.log('Hello Third!');
  return next();
};

// Desolver Test Middleware for getAllCountries root query
const queryAllCountries = async (_, __, context, info, next) => {
  try {
    const query = `
    SELECT * FROM countries;`;
    const allCountries = await db.query(query);
    return next(null, allCountries.rows);
  } catch (err) {
    console.log('error in getAllCountries: ', err);
  }
};

const resolvers = {
  Query: {
    helloWorld: () => 'Hello World!',

    hello: Desolver.use(
      helloFirst,
      helloSecond,
      helloThird,
      (parent, args, context, info) => 'Hello Final!'
    ),

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
  Address: {
    address: async (_, __, context, info) => {
      try {
        const query = `
        SELECT * FROM locations;`;
        const allAddresses = await db.query(query);
        console.log(allAddresses.rows);
        return allAddresses.rows;
      } catch (err) {
        console.log('error in allAddresses: ', err);
      }
    },
  },
};

if (process.env.NODE_ENV !== 'test') {
  startApolloServer(typeDefs, resolvers, PORT);
}

async function startApolloServer(typeDefs, resolvers, apolloPort) {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  return app.listen(apolloPort, () => {
    console.log(`Server listening on port: ${apolloPort}...`);
  });
}

module.exports = { startApolloServer, typeDefs, resolvers };
