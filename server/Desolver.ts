import { v4 as uuidv4 } from 'uuid';
import { RedisClientOptions } from 'redis';
import { GraphQLResolveInfo } from 'graphql';
import { ResolverBuilder } from './ResolverBuilder';

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

export interface ResolversMap {
  [index: string]: { [index: string]: DesolverFragment };
}

export class Desolver {
  private resolverBuilder: ResolverBuilder;
  private preHooksPipelineStore: Record<ResolverType, DesolverFragment[]> = {};
  private idCache: Record<string, DesolverFragment[]> = {};

  constructor(public config?: DesolverConfig) {
    this.resolverBuilder = new ResolverBuilder(config);
  }

  // Specify a resolver type as a string, and then define the middleware Desolver Fragments
  public use(typeName: ResolverType, ...desolvers: DesolverFragment[]): void {
    if (!this.preHooksPipelineStore[typeName]) {
      this.preHooksPipelineStore[typeName] = [];
    }
    this.preHooksPipelineStore[typeName].push(...desolvers);
  }

  public apply(resolvers: ResolversMap): ResolversMap {
    for (const type in resolvers) {
      // Currently appending functionality to subscriptions isn't supported in Desolver
      if (type === 'Subscription') {
        continue;
      }

      // Iterate over all the fields in the resolver map and build new Resolvers with the prehook functions
      for (const field in resolvers[type]) {
        const allPipeline = this.preHooksPipelineStore['All']
          ? this.preHooksPipelineStore['All']
          : [];

        const typePipeline = this.preHooksPipelineStore[type]
          ? this.preHooksPipelineStore[type]
          : [];

        if (this.idCache[resolvers[type][field].name]) {
          resolvers[type][field] = this.useRoute(
            ...allPipeline,
            ...typePipeline,
            ...this.idCache[resolvers[type][field].name]
          );
          continue;
        }

        resolvers[type][field] = this.useRoute(
          ...allPipeline,
          ...typePipeline,
          resolvers[type][field]
        );
      }
    }
    return resolvers;
  }

  public useRoute(...desolvers: DesolverFragment[]): ResolverWrapper {
    // Error handling in case some other value other than a function is loaded into useRoute
    for (const desolverFragment of desolvers) {
      if (typeof desolverFragment !== 'function') {
        throw new Error('Desolver Fragment must be a function.');
      }
    }

    const newId = uuidv4();

    // Builds the pipeline with the all the desolvers that have been wrapped into useRoute
    const newResolver = this.resolverBuilder
      .load(...desolvers)
      .buildResolverWrapper();

    // Rename the function with the uuid, allows for checking if the useRoute has been called when using the apply method
    Object.defineProperty(newResolver, 'name', {
      value: newId,
      writable: false,
    });

    // Save these desolvers so that they can be appended later during the apply method
    this.idCache[newId] = desolvers;

    return newResolver;
  }

  // TO DO: Hook up the error handler
  private errorLogger(error: any): void {
    let errorObj = {
      Error: error.toString(),
      'Error Name': error.name,
      'Error Message': error.message,
    };

    throw new Error(`failed to resolve: ${errorObj}`);
  }
}
