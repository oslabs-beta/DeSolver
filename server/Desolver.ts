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

  public use(typeName: ResolverType, ...desolvers: DesolverFragment[]): void {
    if (!this.preHooksPipelineStore[typeName]) {
      this.preHooksPipelineStore[typeName] = [];
    }
    this.preHooksPipelineStore[typeName].push(...desolvers);
  }

  public apply(resolvers: ResolversMap): ResolversMap {
    for (const type in resolvers) {
      if (type === 'Subscription') {
        continue;
      }

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
    const newId = uuidv4();

    const newResolver = this.resolverBuilder
      .load(...desolvers)
      .buildResolverWrapper();

    Object.defineProperty(newResolver, 'name', {
      value: newId,
      writable: false,
    });

    this.idCache[newId] = desolvers;

    return newResolver;
  }

  private errorLogger(error: any): void {
    let errorObj = {
      Error: error.toString(),
      'Error Name': error.name,
      'Error Message': error.message,
    };

    throw new Error(`failed to resolve: ${errorObj}`);
  }
}
