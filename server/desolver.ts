import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import { GraphQLResolveInfo } from 'graphql';

export type DesolverFragment = (
  parent: Record<string, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: GraphQLResolveInfo,
  next: <T>(err?: string, resolvedObject?: T) => void,
  escapeHatch: <T>(resolvedObject: T) => T | void
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

export interface DesolverCacheConfig extends RedisClientOptions {
  cacheDesolver?: boolean;
}

export interface Resolvers {
  [index: string]: { [index: string]: DesolverFragment };
}

export class Desolver {
  private hasNext: number = 0;
  private pipeline: DesolverFragment[] = [];
  private cache: RedisClientType;

  constructor(public cacheConfig?: DesolverCacheConfig) {
    if (this.cacheConfig) {
      this.cache = createClient(this.cacheConfig);
      this.cache.connect();
      this.cache.on('error', (err) => console.log('Redis Client Error', err));
    } else {
      this.cache = createClient();
      this.cache.connect();
      this.cache.on('error', (err) => console.log('Redis Client Error', err));
    }
  }

  public use(...desolvers: DesolverFragment[]): void {
    this.pipeline.push(...desolvers);
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
    const cachedValue = await getCachedValue(this.cache, info);
    if (cachedValue) {
      console.log('Cache Hit!');
      return JSON.parse(cachedValue);
    }
    console.log('Cache Miss, executing pipeline');
    const resolvedValue = await this.execute(
      parent,
      args,
      context,
      info,
      ...this.pipeline,
      ...desolvers
    );
    await setCachedValue(this.cache, info, resolvedValue);
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
    }

    const escapeHatch = <T>(resolvedValue: T): void | T => {
      try {
        resolvedObject.resolved = true;
        return (resolvedObject.value = resolvedValue);
      } catch (e) {
        throw new Error(e.message);
      }
    }

    while (nextIdx <= desolvers.length - 1) {
      if (resolvedObject.resolved) return resolvedObject.value;

      if (nextIdx === desolvers.length - 1) {
        return await desolvers[nextIdx](
          parent,
          args,
          context,
          info,
          next,
          escapeHatch
        );
      }

      await desolvers[nextIdx](parent, args, context, info, next, escapeHatch);
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
  // Add AST parse logic here and pass into the cache
  const cachedValue = await cache.hGet('Query', JSON.stringify(info.path));
  if (cachedValue !== null) return cachedValue;
}

async function setCachedValue(
  cache: RedisClientType,
  info: GraphQLResolveInfo,
  resolvedValue: unknown
): Promise<void> {
  // console.log('Setting Resolved Value to the Cache');
  await cache.hSet(
    'Query',
    JSON.stringify(info.path),
    JSON.stringify(resolvedValue)
  );
}

/* Alternative Iterations of the getCache and setCache functions

function getCache(cache: RedisClientType): DesolverFragment {
  return async function (parent, args, context, info, next) {
    const cachedValue = await cache.hGet('Query', JSON.stringify(info.path));
    if (cachedValue !== null) return next(null, cachedValue);
    return next();
  };
}

function setCache(
  cache: RedisClientType,
  resolvedValue: unknown
): DesolverFragment {
  return async function (parent, args, context, info, next) {
    console.log('Setting Resolved Value to the Cache');
    await cache.hSet(
      'Query',
      JSON.stringify(info.path),
      JSON.stringify(resolvedValue)
    );
    return next(null, resolvedValue);
  };
}
*/
