import axios, { AxiosResponse } from 'axios';
import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import { GraphQLResolveInfo } from 'graphql';

export type DesolverFragment = (
  parent: Record<string, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: GraphQLResolveInfo,
  next?: <T>(err?: string, resolvedObject?: T) => void,
  escapeHatch?: <T>(resolvedObject: T) => T | void,
  ds?: Record<string, unknown>
) => unknown | Promise<void | unknown>;

export type ResolverWrapper = (
  parent: Record<string, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: GraphQLResolveInfo
) => unknown | Promise<void | unknown>;

export interface ResolvedObject {
  resolved: boolean;
  value: unknown;
}

export type ResolverType = 'Query' | 'Mutation' | 'Root' | 'All' | string;

export interface DesolverConfig extends RedisClientOptions {
  cacheDesolver?: boolean;
  applyResolverType?: ResolverType;
}

export interface Resolvers {
  [index: string]: { [index: string]: DesolverFragment };
}

export class Desolver {
  private hasNext: number = 0;
  private pipeline: DesolverFragment[] = [];
  private cache: RedisClientType;

  constructor(public config?: DesolverConfig) {
    if (this.config?.cacheDesolver === true) {
      // console.log('Redis cache starting with custom config')
      this.cache = createClient(this.config);
      this.cache.connect();
      this.cache.on('error', (err) => console.log('Redis Client Error', err));
    } else if (this.config?.cacheDesolver === false) {
      // Do nothing, cache not started
    } else {
      // console.log('No Desolver Configuration specified, starting default Redis Client')
      this.cache = createClient();
      this.cache.connect();
      this.cache.on('error', (err) => console.log('Redis Client Error', err));
    }
  }

  public use(...desolvers: DesolverFragment[]): void {
    this.pipeline.push(...desolvers);
  }

  public apply(resolvers: Resolvers): Resolvers {
    for (const type in resolvers) {
      if (
        this.config?.applyResolverType &&
        type === this.config.applyResolverType
      ) {
        for (const field in resolvers[type]) {
          // console.log('inside if statement', type);
          resolvers[type][field] = this.useRoute(resolvers[type][field]);
        }
      } else if (
        !this.config?.applyResolverType ||
        this.config.applyResolverType === 'All'
      ) {
        for (const field in resolvers[type]) {
          // console.log('Im here!!!', type);
          resolvers[type][field] = this.useRoute(resolvers[type][field]);
        }
      }
    }
    return resolvers;
  }

  public useRoute(...desolvers: DesolverFragment[]): ResolverWrapper {
    return async (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: Record<string, unknown>,
      info: GraphQLResolveInfo
    ) => {
      return await this.composePipeline(
        parent,
        args,
        context,
        info,
        ...desolvers
      );
    };
  }

  private async composePipeline(
    parent: Record<string, unknown>,
    args: Record<string, unknown>,
    context: Record<string, unknown>,
    info: GraphQLResolveInfo,
    ...desolvers: DesolverFragment[]
  ): Promise<unknown> {
    if (this.config.cacheDesolver === true) {
      const cachedValue = await getCachedValue(this.cache, info);
      if (cachedValue) {
        console.log('Cache Hit!');
        return JSON.parse(cachedValue);
      }
    }

    const resolvedValue = await this.execute(
      parent,
      args,
      context,
      info,
      ...this.pipeline,
      ...desolvers
    );

    if (this.config.cacheDesolver === true) {
      console.log('Setting cached value');
      await setCachedValue(this.cache, info, resolvedValue);
    }

    return resolvedValue;
  }

  private async execute(
    parent: Record<string, unknown>,
    args: Record<string, unknown>,
    context: Record<string, unknown>,
    info: GraphQLResolveInfo,
    ...desolvers: DesolverFragment[]
  ): Promise<void | unknown> {
    let nextIdx = 0;

    for (const desolverFragment of desolvers) {
      if (typeof desolverFragment !== 'function') {
        throw new Error('Desolver Fragment must be a function.');
      }
    }

    const resolvedObject: ResolvedObject = { resolved: false, value: null };

    const ds = {};

    const next = <T>(err?: string, resolvedValue?: T): void | T => {
      try {
        if (err) throw new Error(err);
        if (resolvedValue) {
          resolvedObject.resolved = true;
          return (resolvedObject.value = resolvedValue);
        }
        nextIdx += 1;
      } catch (e) {
        throw new Error(err);
      }
    };

    const escapeHatch = <T>(resolvedValue: T): void | T => {
      try {
        resolvedObject.resolved = true;
        return (resolvedObject.value = resolvedValue);
      } catch (e) {
        throw new Error(e.message);
      }
    };

    while (nextIdx <= desolvers.length - 1) {
      if (resolvedObject.resolved) return resolvedObject.value;

      if (nextIdx === desolvers.length - 1) {
        return await desolvers[nextIdx](
          parent,
          args,
          context,
          info,
          next,
          escapeHatch,
          ds
        );
      }

      await desolvers[nextIdx](
        parent,
        args,
        context,
        info,
        next,
        escapeHatch,
        ds
      );
    }
  }

  private errorLogger(error: any): void {
    let errorObj = {
      Error: error.toString(),
      'Error Name': error.name,
      'Error Message': error.message,
    };
    throw new Error(
      `failed to resolve ${this.pipeline[this.hasNext]}: ${errorObj}`
    );
  }
}

async function getCachedValue(
  cache: RedisClientType,
  info: GraphQLResolveInfo
): Promise<void | string> {
  // Add AST parse logic here to create a unique key and pass into the cache to fetch
  const cachedValue = await cache.hGet('Query', JSON.stringify(info.path));
  if (cachedValue !== null) return cachedValue;
}

async function setCachedValue(
  cache: RedisClientType,
  info: GraphQLResolveInfo,
  resolvedValue: unknown
): Promise<void> {
  // Add AST parse logic here to create a unique key and pass into the cache to be set
  await cache.hSet(
    'Query',
    JSON.stringify(info.path),
    JSON.stringify(resolvedValue)
  );
}

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
