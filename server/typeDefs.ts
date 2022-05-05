import { gql } from 'apollo-server-express'

export const typeDefs = gql`
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