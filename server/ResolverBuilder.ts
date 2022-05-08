import { createClient, RedisClientType } from 'redis';
import {
  DesolverConfig,
  ResolverWrapper,
  ResolvedObject,
  DesolverFragment,
} from './Desolver';
import { GraphQLResolveInfo } from 'graphql';

export class ResolverBuilder {
  private cache: RedisClientType;
  private desolverPipeline: DesolverFragment[] = [];

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

  public reset(): void {
    this.desolverPipeline = [];
  }

  public load(...desolvers: DesolverFragment[]): this {
    this.desolverPipeline.push(...desolvers);
    return this;
  }

  public buildResolverWrapper(): ResolverWrapper {
    const pipeline = this.desolverPipeline;

    this.reset();

    return async (parent, args, context, info) => {
      try {
        if (this.config.cacheDesolver === true) {
          const cachedValue = await getCachedValue(this.cache, info);
          if (cachedValue) {
            console.log('Cache Hit!');
            return JSON.parse(cachedValue);
          }
        }

        let nextIdx = 0;

        for (const desolverFragment of pipeline) {
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

        while (nextIdx <= pipeline.length - 1) {
          const currIdx = nextIdx;

          if (nextIdx === pipeline.length - 1) {
            resolvedObject.value = await pipeline[nextIdx](
              parent,
              args,
              context,
              info,
              next,
              escapeHatch,
              ds
            );
            resolvedObject.resolved = true;
            break;
          }

          await pipeline[nextIdx](
            parent,
            args,
            context,
            info,
            next,
            escapeHatch,
            ds
          );

          if (resolvedObject.resolved) break;

          if (currIdx === nextIdx) {
            throw new Error('Next was not called');
          }
        }

        if (this.config.cacheDesolver === true) {
          console.log('Setting Cached Value');
          await setCachedValue(this.cache, info, resolvedObject.value);
        }

        return resolvedObject.value;
      } catch (e) {
        throw new Error(e.message);
      }
    };
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
