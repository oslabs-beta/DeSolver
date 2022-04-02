import { Pool, QueryResult, QueryArrayResult } from 'pg'

type Callback = (err: Error, result: QueryResult<any>) => any

const PG_URI = process.env.DB_elephant;

const pool = new Pool({
  connectionString: PG_URI,
});

pool.on('connect', () => {
  console.log('connected to database');
});

export = {
  PG_URI,
  query: (text: string, params?: string[], callback?: Callback): any => {
    console.log('executed query', text);
    return pool.query(text, params, callback);
  },
};
