require('dotenv').config();
const PORT = 3000;
const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const app = express();
const axios = require('axios');
const db = require('../models/elephantConnect');

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
    address: Address
  }
  type Address {
    address: String
    city: String
    state_province: String
    country_id_address: String
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

    getAllCountries: async (_, __, context, info) => {
      try {
        const query = `
        SELECT * FROM countries;
        `;
        const allCountries = await db.query(query);
        console.log(allCountries.rows);
        return allCountries.rows;
        // return allCountries.rows.map((country) => {
        //   return country.country_name;
        // });
      } catch (err) {
        console.log('error in getAllCountries: ', err);
      }
    },
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

startApolloServer(typeDefs, resolvers);

async function startApolloServer(typeDefs, resolvers) {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  await server.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}...`);
  });
}
