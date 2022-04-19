import { createClient, RedisClientType } from 'redis';
import { GraphQLResolveInfo } from 'graphql';

export type DesolverFragment = (
  parent: Record<string, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: GraphQLResolveInfo,
  next?: <T>(err?: string, resolvedObject?: T) => void
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

export interface Resolvers {
  [index: string]: { [index: string]: DesolverFragment };
}

export class Desolver {
  public static createDesolver() {
    return [new Desolver(), new Desolver()];
  }

  public static use(...desolvers: DesolverFragment[]): ResolverWrapper {
    return async (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: Record<string, unknown>,
      info: GraphQLResolveInfo
    ): Promise<unknown> => {
      const desolver = new Desolver(parent, args, context, info);
      return await desolver.composePipeline(...desolvers);
    };
  }

  public static useSync(...desolvers: DesolverFragment[]): ResolverWrapper {
    return (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: Record<string, unknown>,
      info: GraphQLResolveInfo
    ): unknown => {
      const desolver = new Desolver(parent, args, context, info);
      return desolver.composePipeline(...desolvers);
    };
  }

  private hasNext: number = 0;
  private pipeline: DesolverFragment[];
  private resolvedObject: ResolvedObject = { resolved: false, value: null };
  private cache: RedisClientType = createClient();

  constructor(
    public parent?: Record<string, unknown>,
    public args?: Record<string, unknown>,
    public context?: Record<string, unknown>,
    public info?: GraphQLResolveInfo
  ) {
    this.next = this.next.bind(this);
    this.cache.connect();
    this.cache.on('error', (err) => console.log('Redis Client Error', err));
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

  public async composePipeline(
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
    this.pipeline = desolvers;
    const resolvedValue = await this.execute(
      parent,
      args,
      context,
      info,
      ...desolvers
    );
    setCachedValue(this.cache, info, resolvedValue);
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

    const resolvedObject: ResolvedObject = { resolved: false, value: null };

    function next<T>(err?: string, resolvedValue?: T): void | T {
      try {
        if(err) throw new Error(err);
        if (resolvedValue) {
          resolvedObject.resolved = true
          return resolvedObject.value = resolvedValue
        }
        nextIdx += 1;
      } catch (e) {
        throw new Error(err)
      }
    }

    while (nextIdx <= desolvers.length - 1) {
      if (typeof desolvers[nextIdx] !== 'function')
        throw new Error('Desolver Fragment must be a function.');

      if (resolvedObject.resolved) return resolvedObject.value;

      if (nextIdx === desolvers.length - 1) {
        return await desolvers[nextIdx](
          parent,
          args,
          context,
          info,
          next,
        );
      }

      await desolvers[nextIdx](
        parent,
        args,
        context,
        info,
        next,
      );
    }

    // while (this.hasNext <= this.pipeline.length - 1) {
    //   if (typeof this.pipeline[this.hasNext] !== 'function')
    //     throw new Error('Desolver Fragment must be a function.');

    //   if (this.resolvedObject.resolved) return this.resolvedObject.value;

    //   if (this.hasNext === this.pipeline.length - 1) {
    //     return await this.pipeline[this.hasNext](
    //       this.parent,
    //       this.args,
    //       this.context,
    //       this.info,
    //       this.next
    //     );
    //   }

    //   await this.pipeline[this.hasNext](
    //     this.parent,
    //     this.args,
    //     this.context,
    //     this.info,
    //     this.next
    //   );
    // }
  }

  public next<T>(err?: string, resolveValue?: T): void | T {
    try {
      if (err) throw new Error(err);
      if (resolveValue) {
        this.resolvedObject.resolved = true;
        return (this.resolvedObject.value = resolveValue);
      }
      this.hasNext += 1;
    } catch (error: unknown) {
      throw error;
    }
  }
}

async function getCachedValue(
  cache: RedisClientType,
  info: GraphQLResolveInfo
): Promise<void | string> {
  const cachedValue = await cache.hGet('Query', JSON.stringify(info.path));
  if (cachedValue !== null) return cachedValue;
}

async function setCachedValue(
  cache: RedisClientType,
  info: GraphQLResolveInfo,
  resolvedValue: unknown
): Promise<void> {
  console.log('Setting Resolved Value to the Cache');
  await cache.hSet(
    'Query',
    JSON.stringify(info.path),
    JSON.stringify(resolvedValue)
  );
}

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
