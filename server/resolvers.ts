import { QueryArrayResult } from 'pg'
import db from '../models/elephantConnect'
import axios, { AxiosResponse } from 'axios';
import { Desolver, ResolversMap } from './desolver'
import { queryAllCountries, helloFirst, helloSecond, helloThird, pokemonParser } from './desolverfragments';

const desolver = new Desolver({
    cacheDesolver: false,
    applyResolverType: 'Query'
})

desolver.use((parent, args, context, info, next) => {
  if (args.user === 'Matt' && args.password === 'bucks') {
    return next();
  }
  throw new Error('nope')
})

desolver.use(pokemonParser());

export const resolvers: ResolversMap = desolver.apply({
    Query: {
      getUser: () => ({
        id: 1,
        name: 'Michael'
      }),
  
      helloWorld: (parent, args, context, info) => {
        return 'Hello World!'
      },
  
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