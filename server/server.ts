import dotenv from 'dotenv';
dotenv.config()
import { ApolloServer, gql } from 'apollo-server-express';
import { DocumentNode } from 'graphql';
import express from 'express';
import bodyParser, { Request } from 'express'
import axios, { AxiosResponse } from 'axios';
import { QueryArrayResult } from 'pg'
import db from '../models/elephantConnect'
import { Desolver, DesolverFragment, Resolvers, pokemonParser } from './desolver'
const app = express();
const PORT = 3000;

const desolver = new Desolver({
  cacheDesolver: false,
  applyResolverType: 'All'
})

desolver.use(pokemonParser());

const typeDefs = gql`
  type Query {
    helloWorld: String
    hello: String
    getUser: User
    getPopByCountry(country: String!): Int!
    getAllCountries(arg1: String, arg2: Int): [Country]
    population(arg1: String, arg2: Int): Population
  }
  type User {
    id: ID!
    name: String
    country: Country
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
  type Address {
    address: String
    city: String
    state_province: String
    country_id_address: String
  }
`;

// Desolver Test Middleware for hello root query
const helloFirst: DesolverFragment = async (parent, args, context, info, next, escapeHatch, ds) => {
  ds.context = 'hello'
  // return escapeHatch('I am resolved first!');
  return next();
};
const helloSecond: DesolverFragment = async (parent, args, context, info, next, escapeHatch, ds) => {
  console.log('context afterwards', ds.context)
  console.log('Hello Second!');
  return next<unknown>(null, 2);
};
const helloThird: DesolverFragment = async (parent, args, context, info, next, escapeHatch, ds) => {
  console.log('Hello Third!');
  return next()
};

// Desolver Test Middleware for getAllCountries root query
const queryAllCountries: DesolverFragment = async (_, __, context, info, next, escapeHatch) => {
  try {
    const query = `
    SELECT * FROM countries;`;
    const allCountries = await db.query(query) as unknown as QueryArrayResult;
    return next(null, allCountries.rows);
  } catch (err) {
    throw new Error('Error in queryAllCountries')
  }
};

const resolvers: Resolvers = desolver.apply({
  Query: {
    getUser: () => ({
      id: 1,
      name: 'Michael'
    }),

    helloWorld: () => 'Hello World!',

    hello: desolver.useRoute(helloFirst, helloSecond, helloThird, (parent, args, context, info): string => 'Hello Final!'),

    getPopByCountry: async (parent, args, context, info, next, escapeHatch) => {
      try {
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
        
      } catch (err) {
        console.log('error with getPopByCountry: ', err);
      }
    },

    getAllCountries: queryAllCountries,
  },

  Country: {
    population: async (parent, __, context, info, next, escapeHatch) => {
      try {
        const name = parent.country_name;
        if (parent.country_id === "US" || parent.country_name === "United States of America") {
          console.log(`Population of ${name} is ${300000000}`);
          return {population: 300000000}
        }
        if (parent.country_id === "HK" || parent.country_name === "Hong Kong") {
          console.log(`Population of ${name} is ${7000000}`);
          return {population: 7000000}
        }
        
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
        console.log(`Population of ${name} is ${queryRes.data.body.population}`);
        return queryRes.status >= 400 ? {population: null} : {population: queryRes.data.body.population}
        // const population = queryRes.data.body.population;
        // return { population };
      } catch (err) {
        console.log('error with population: ', err);
      }
    },
  },
  Address: {
    address: async (_, __, context, info, next, escapeHatch) => {
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

  User: {
    country: desolver.useRoute((parent, args, context, info, next, escapeHatch) => ({
      country_id: 100,
      country_name: 'Hong Kong',
      region_id: 1234,
    }))
  }
});

if (process.env.NODE_ENV !== 'test') {
  startApolloServer(typeDefs, resolvers, PORT);
}

async function startApolloServer(typeDefs: DocumentNode, resolvers: Resolvers, apolloPort: number) {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  app.use(bodyParser.json())
  app.post('/graphql', async (req, res, next) => {
    try {
      if (req.body?.operationName === 'IntrospectionQuery') {
        return next();
      }
      await consoleSomething('Request intercepted!', req.body);
    } catch (e) {

    }
    return next();
  })
  server.applyMiddleware({ app, bodyParserConfig: true });

  return app.listen(apolloPort, () => {
    console.log(`Apollo GraphQL Server listening on port: ${apolloPort}...`);
  });
}

async function consoleSomething(input: string, another?: any) {
  console.log(input)
  console.log(another)
}

export = { startApolloServer, typeDefs, resolvers };
