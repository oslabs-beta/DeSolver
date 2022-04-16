import dotenv from 'dotenv';
dotenv.config()
import { ApolloServer, gql } from 'apollo-server-express';
import { DocumentNode } from 'graphql';
import express from 'express';
import axios, { AxiosResponse } from 'axios';
import { QueryArrayResult } from 'pg'
import db from '../models/elephantConnect'
import { Desolver, ResolverFragment, Resolvers } from './desolver'

const app = express();
const PORT = 3000;

const typeDefs = gql`
  type Query {
    helloWorld: String
    hello: String
    getPopByCountry(country: String): Int
    getAllCountries(arg1: String, arg2: Int): [Country]
    population(arg1: String, arg2: Int): Population
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
const helloFirst: ResolverFragment = async (parent, args, context, info, next) => {
  console.log('Hello First!');
  return next<unknown>(null, 'I am resolved first!');
};
const helloSecond: ResolverFragment = async (parent, args, context, info, next) => {
  console.log('Hello Second!');
  return next<unknown>(null, 2);
};
const helloThird: ResolverFragment = async (parent, args, context, info, next) => {
  console.log('Hello Third!');
  return next()
};

// Desolver Test Middleware for getAllCountries root query
const queryAllCountries: ResolverFragment = async (_, __, context, info, next) => {
  try {
    const query = `
    SELECT * FROM countries;`;
    const allCountries = await db.query(query) as unknown as QueryArrayResult;
    console.log('did i query?')
    return next(null, allCountries.rows);
  } catch (err) {
    throw new Error('Error in queryAllCountries')
  }
};

const resolvers: Resolvers = {
  Query: {
    helloWorld: () => 'Hello World!',

    hello: Desolver.useSync(helloFirst, helloSecond, helloThird, (parent, args, context, info) => 'Hello Final!'),

    getPopByCountry: Desolver.useSync(async (parent, args, context, info) => {
      try {
        const desolver = new Desolver(parent, args, context, info);
        return desolver.composePipeline(async (parent, args, context, info) => {
          const { country } = args;
          const queryRes: AxiosResponse = await axios({
            method: 'GET',
            url: 'https://world-population.p.rapidapi.com/population',
            params: { country_name: country },
            headers: {
              'x-rapidapi-host': 'world-population.p.rapidapi.com',
              'x-rapidapi-key':
                '7f41d5564dmsh59dfbf8c3bf6336p160c99jsn22c3b8738e61',
            },
          });
          return queryRes.status >= 400 ? null : queryRes.data.body.population
          // const population = queryRes.data.body.population;
          // return population;
        });
      } catch (err) {
        console.log('error with getPopByCountry: ', err);
      }
    }),

    getAllCountries: Desolver.useSync(queryAllCountries),
  },

  Country: {
    population: Desolver.use(async (parent, __, context, info) => {
      console.log('in the population query');
      try {
        let name = parent.country_name;
        console.log('NAME in Population Query: ', name);
        const queryRes: AxiosResponse = await axios({
          method: 'GET',
          url: 'https://world-population.p.rapidapi.com/population',
          params: { country_name: name },
          headers: {
            'x-rapidapi-host': 'world-population.p.rapidapi.com',
            'x-rapidapi-key':
              '7f41d5564dmsh59dfbf8c3bf6336p160c99jsn22c3b8738e61',
          },
        });
        return queryRes.status >= 400 ? {population: null} : {population: queryRes.data.body.population}
        // const population = queryRes.data.body.population;
        // return { population };
      } catch (err) {
        console.log('error with population: ', err);
      }
    }),
  },
  Address: {
    address: async (_, __, context, info) => {
      try {
        const query = `
        SELECT * FROM locations;`;
        const allAddresses = await db.query(query) as unknown as QueryArrayResult;
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

async function startApolloServer(typeDefs: DocumentNode, resolvers: Resolvers, apolloPort: number) {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  return app.listen(apolloPort, () => {
    console.log(`Server listening on port: ${apolloPort}...`);
  });
}

export = { startApolloServer, typeDefs, resolvers };
