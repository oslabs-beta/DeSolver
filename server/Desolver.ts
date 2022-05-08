import { v4 as uuidv4 } from 'uuid';
import {
  ResolverBuilder,
  DesolverConfig,
  DesolverFragment,
  ResolverWrapper,
  ResolverType,
  ResolversMap,
} from './ResolverBuilder';

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
        // Always load the prehook functions related to 'All' first
        const allPipeline = this.preHooksPipelineStore['All']
          ? this.preHooksPipelineStore['All']
          : [];

        // Then load up the prehook functions related to the specific Resolver Type ('Query' or 'Mutation' or etc.)
        const typePipeline = this.preHooksPipelineStore[type]
          ? this.preHooksPipelineStore[type]
          : [];

        // Check the name of the resolver function in the idCache
        // If it exists already, then it means useRoute already wrapped the function
        // Replace the existing wrapped function with a new invocation of useRoute but with preHooks and the previously cached desolvers
        if (this.idCache[resolvers[type][field].name]) {
          resolvers[type][field] = this.useRoute(
            ...allPipeline,
            ...typePipeline,
            ...this.idCache[resolvers[type][field].name]
          );
          continue;
        }

        // Otherwise if a name does not exist, it means the resolver is defined as a singular function
        // Append the preHooks and the singular function
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
