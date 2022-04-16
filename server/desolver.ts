import { createClient, RedisClientType } from 'redis';
import { GraphQLResolveInfo } from 'graphql';

export type ResolverFragment = (
  parent: Record<string, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: GraphQLResolveInfo,
  next?: <T>(err?: string, resolvedObject?: T) => void
) => unknown;

export type ResolverWrapper = (
  parent: Record<string | number | symbol, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: GraphQLResolveInfo
) => unknown | Promise<unknown>;

export interface ResolvedObject {
  resolved: boolean;
  value: unknown;
}

export interface Resolvers {
  [index: string]: { [index: string]: ResolverFragment };
}

export class Desolver {
  public static use(...resolvers: ResolverFragment[]): ResolverWrapper {
    return async (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: Record<string, unknown>,
      info: GraphQLResolveInfo
    ): Promise<unknown> => {
      const desolver = new Desolver(parent, args, context, info);
      return await desolver.composePipeline(...resolvers);
    };
  }

  public static useSync(...resolvers: ResolverFragment[]): ResolverWrapper {
    return (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: Record<string, unknown>,
      info: GraphQLResolveInfo
    ): unknown => {
      const desolver = new Desolver(parent, args, context, info);
      return desolver.composePipeline(...resolvers);
    };
  }

  private hasNext: number = 0;
  private pipeline: ResolverFragment[];
  private resolvedObject: ResolvedObject = { resolved: false, value: null };
  private cache: RedisClientType = createClient();

  constructor(
    public parent: Record<string, unknown>,
    public args: Record<string, unknown>,
    public context: Record<string, unknown>,
    public info: GraphQLResolveInfo
  ) {
    this.next = this.next.bind(this);
    this.cache.connect();
  }

  public async composePipeline(...resolvers: ResolverFragment[]): Promise<unknown> {
    const cachedValue = await getCachedValue(this.cache, this.info)
    if (cachedValue) {
      console.log('Cache Hit!')
      return JSON.parse(cachedValue);
    }
    console.log('Cached value not found, executing pipeline')
    this.pipeline = resolvers;
    const resolvedValue = await this.execute();
    setCachedValue(this.cache, this.info, resolvedValue)
    return resolvedValue;
  }

  private async execute(): Promise<unknown> {
    while (this.hasNext <= this.pipeline.length - 1) {
      if (typeof this.pipeline[this.hasNext] !== 'function') throw new Error('Resolver Fragment must be a function.')
      
      if (this.resolvedObject.resolved) return this.resolvedObject.value;

      if (this.hasNext === this.pipeline.length - 1) {
        return await this.pipeline[this.hasNext](
          this.parent,
          this.args,
          this.context,
          this.info,
          this.next
        );
      }

      await this.pipeline[this.hasNext](
        this.parent,
        this.args,
        this.context,
        this.info,
        this.next
      );
    }
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

async function getCachedValue(cache: RedisClientType, info: GraphQLResolveInfo): Promise<void | string> {
  const cachedValue = await cache.hGet('Query', JSON.stringify(info.path))
  if (cachedValue !== null) return cachedValue;
}

async function setCachedValue(cache: RedisClientType, info: GraphQLResolveInfo, resolvedValue: unknown): Promise<void> {
  console.log('Setting Resolved Value to the Cache')
  await cache.hSet('Query', JSON.stringify(info.path), JSON.stringify(resolvedValue))
}
