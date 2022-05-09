import { v4 as uuidv4 } from 'uuid';
import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import { GraphQLResolveInfo } from 'graphql';

// This is the type for the DeSolver middleware function passed into useRoute() and use().
// DeSolverFragment mimics the structure of an individual resolver object. 
export type DesolverFragment = (
  parent: Record<string, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: GraphQLResolveInfo,
  next?: <T>(err?: string, resolvedObject?: T) => void,
  escapeHatch?: <T>(resolvedObject: T) => T | void,
  ds?: Record<string, unknown>
) => unknown | Promise<void | unknown>;

// Type annotation for individual resolvers.  
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
  private preHookPipeline: DesolverFragment[] = [];
  private cache: RedisClientType;
  private idCache: Record<string, ResolverWrapper> = {};

  constructor(public config?: DesolverConfig) {
    if (this.config?.cacheDesolver === true) {
      // Redis cache starting with custom config
      this.cache = createClient(this.config);
      this.cache.connect();
      this.cache.on('error', (err) => console.log('Redis Client Error', err));
    } else if (this.config?.cacheDesolver === false) {
      // Do nothing, cache not started
    } else {
      // No Desolver Configuration specified, starting default Redis Client
      this.cache = createClient();
      this.cache.connect();
      this.cache.on('error', (err) => console.log('Redis Client Error', err));
    }
  }

  public use(...preHookDesolvers: DesolverFragment[]): void {
    this.preHookPipeline.push(...preHookDesolvers);
  }

  public apply(resolvers: Resolvers): Resolvers {
    for (const type in resolvers) {
      if (
        this.config?.applyResolverType &&
        type === this.config.applyResolverType
      ) {
        for (const field in resolvers[type]) {
          // Skips wrapping the field if the function id is stored in the cache already
          if (this.idCache[resolvers[type][field].name]) {
            continue;
          }
          resolvers[type][field] = this.useRoute(resolvers[type][field]);
        }
      } else if (
        !this.config?.applyResolverType ||
        this.config.applyResolverType === 'All'
      ) {
        for (const field in resolvers[type]) {
          // Skips wrapping the field if the function id is stored in the cache already
          if (this.idCache[resolvers[type][field].name]) {
            continue;
          }
          resolvers[type][field] = this.useRoute(resolvers[type][field]);
        }
      }
    }
    return resolvers;
  }

  public useRoute(...desolvers: DesolverFragment[]): ResolverWrapper {
    const newId = uuidv4();

    this.idCache[newId] = async (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: Record<string, unknown>,
      info: GraphQLResolveInfo
    ) => {
      // Returns the execution of all DesolverFragments loaded into the pipeline. 
      return await this.composePipeline(
        parent,
        args,
        context,
        info,
        ...desolvers
      );
    };

    Object.defineProperty(this.idCache[newId], 'name', {
      value: newId,
      writable: false,
    });

    return this.idCache[newId];
  }

  private async composePipeline(
    parent: Record<string, unknown>,
    args: Record<string, unknown>,
    context: Record<string, unknown>,
    info: GraphQLResolveInfo,
    ...desolvers: DesolverFragment[]
  ): Promise<unknown> {
    // If caching is enabled, the cache is checked prior to the invocation of the DesolverFragments.
    if (this.config.cacheDesolver === true) {
      const cachedValue = await getCachedValue(this.cache, info);
      if (cachedValue) {
        // Cache Hit!
        return JSON.parse(cachedValue);
      }
    }

    // Invokes the functions loaded into the preHookPipeline and then invokes the individual DesolverFrgment. 
    const resolvedValue = await this.execute(
      parent,
      args,
      context,
      info,
      ...this.preHookPipeline,
      ...desolvers
    );

    if (this.config.cacheDesolver === true) {
      // Setting Cached Value
      await setCachedValue(this.cache, info, resolvedValue);
    }

    return resolvedValue;
  }

  /*
  Iterates over the DesolverFragments after the preHookPipeline.
  Executes the preHookPipeline functions and then executes the DesolverFragments.
  DesolverFragments are executed in the order they are passed into useRoute.
  If useRoute is not invoked in the resolver, just the individual resolver is resolved. 
  */
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
      `failed to resolve ${this.preHookPipeline[this.hasNext]}: ${errorObj}`
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
