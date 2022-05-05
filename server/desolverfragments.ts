import axios, { AxiosResponse } from 'axios';
import { DesolverFragment } from "./desolver";
import { QueryArrayResult } from "pg";
import db from '../models/elephantConnect'

// Desolver Test Middleware for getAllCountries root query
export const queryAllCountries: DesolverFragment = async (_, __, context, info, next, escapeHatch) => {
    try {
      const query = `
      SELECT * FROM countries;`;
      const allCountries = await db.query(query) as unknown as QueryArrayResult;
      return next(null, allCountries.rows);
    } catch (err) {
      throw new Error('Error in queryAllCountries')
    }
  };

  // Desolver Test Middleware for hello root query
export const helloFirst: DesolverFragment = async (parent, args, context, info, next, escapeHatch, ds) => {
    ds.context = 'hello'
    // return escapeHatch('I am resolved first!');
    return next();
  };

export const helloSecond: DesolverFragment = async (parent, args, context, info, next, escapeHatch, ds) => {
    console.log('context afterwards', ds.context)
    console.log('Hello Second!');
    return next<unknown>(null, 2);
  };

export const helloThird: DesolverFragment = async (parent, args, context, info, next, escapeHatch, ds) => {
    console.log('Hello Third!');
    return next()
  };

  // Demonstration middleware/Desolver Fragment to perform asynchronous actions prior to executing resolvers
export function pokemonParser(): DesolverFragment {
    function getRandomIntInclusive(min: number, max: number): number {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    return async (parent, args, context, info, next, escapeHatch) => {
      try {
        const randomNum = getRandomIntInclusive(0, 1126);
        console.log(randomNum);
        const pokeRes: AxiosResponse = await axios({
          method: 'GET',
          url: `https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0`,
        });
        const { name, url } = pokeRes.data.results[randomNum];
        console.log({ name, url });
        return next();
      } catch (e) {
        console.error(e);
      }
    };
  }