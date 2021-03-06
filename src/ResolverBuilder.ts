import { GraphQLResolveInfo } from 'graphql';
import { createClient, RedisClientType, RedisClientOptions } from 'redis';

export interface ResolvedObject {
  resolved: boolean;
  value: unknown;
}

// Type annotation for individual resolvers.  
export type ResolverWrapper = (
  parent: Record<string, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: GraphQLResolveInfo
) => unknown | Promise<void | unknown>;

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

export type ResolverType = 'Query' | 'Mutation' | 'Root' | 'All' | string;

export interface DesolverConfig extends RedisClientOptions {
  cacheDesolver?: boolean;
  applyResolverType?: ResolverType;
}

export interface ResolversMap {
  [index: string]: { [index: string]: DesolverFragment };
}

export class ResolverBuilder {
  private cache: RedisClientType;
  private desolverPipeline: DesolverFragment[] = [];

  constructor(public config?: DesolverConfig) {
    if (this.config?.cacheDesolver === true) {
      // Redis cache starting with custom config
      this.cache = createClient(this.config);
      this.cache.connect();
      this.cache.on('error', (err) => console.log('Redis Client Error', err));
    }
  }

  // Call this method after building a Resolver Wrapper to reset the pipeline store
  public reset(): void {
    this.desolverPipeline = [];
  }

  // Method to load DesolverFragments into the pipeline
  // Return 'this' so that multiple load methods and buildResolverWrapper method can be chained
  public loadPreHooks(...preHookDesolvers: DesolverFragment[]): this {
    this.desolverPipeline.push(...preHookDesolvers);
    return this;
  }

  // Builds the resolver wrapper with the loaded pipeline
  public buildResolverWrapper(): ResolverWrapper {
    // Save the pipeline in the ResolverWrapper's closure
    const pipeline = this.desolverPipeline;

    // Pipeline can be safely reset after saving reference to the built pipeline
    this.reset();

    // Return a function that wraps around the execution of the desolver pipeline
    return async (parent, args, context, info) => {
      try {
        if (this.config.cacheDesolver === true) {
          const cachedValue = await getCachedValue(this.cache, info);
          if (cachedValue) {
            // Cache hit
            return JSON.parse(cachedValue);
          }
        }

        let nextIdx = 0;
        
        // Scope a variable that will keep track if the escapehatch was invoked
        const resolvedObject: ResolvedObject = { resolved: false, value: null };

        // Scope a context object that can be used to pass data between Desolver Fragments
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
          // keep track of the current index so that calling next can be tracked
          const currIdx = nextIdx;

          if (nextIdx === pipeline.length - 1) {
            // Always resolve the returned value of the final function in the pipeline
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

          // This if statement will be true is escapeHatch is called within the desolver fragments
          // Hence if escapeHatch is invoked, break out of the while loop, then proceed to save to cache if caching enabled
          if (resolvedObject.resolved) break;

          // Warn that next must be called
          // If after execution of the Desolver Fragment middlewares, nextIdx should be greater than currIdx if next is called
          // If they are equal, then that means next was not called, throw error to warn
          if (currIdx === nextIdx) {
            throw new Error('Next was not called');
          }
        }

        if (this.config.cacheDesolver === true) {
          // Sets the resolved value to the cache
          await setCachedValue(this.cache, info, resolvedObject.value);
        }

        return resolvedObject.value;
      } catch (e) {
        throw new Error(e.message);
      }
    };
  }
}

// Helper Functions for getting and setting of the cached values
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
