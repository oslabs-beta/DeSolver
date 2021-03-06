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
  private idCachedDesolvers: Record<string, DesolverFragment[]> = {};

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
      .loadPreHooks(...desolvers)
      .buildResolverWrapper();

    // Rename the function with the uuid, allows for checking if the useRoute has been called when using the apply method
    Object.defineProperty(newResolver, 'name', {
      value: newId,
      writable: false,
    });

    // Save these desolvers so that they can be appended later during the apply method
    this.idCachedDesolvers[newId] = desolvers;

    return newResolver;
  }

  // Iterate over all properties of the resolver map and transform the resolver map object by building new resolver functions with prehook functions
  public apply(resolversMap: ResolversMap): ResolversMap {
    for (const type in resolversMap) {
      // Currently appending functionality to subscriptions isn't supported in Desolver, skip any types not found in the store
      if (type === 'Subscription') {
        continue;
      }

      // Iterate over all the fields in the resolver map and build new Resolvers with the prehook functions
      for (const field in resolversMap[type]) {
        const currentResolver = resolversMap[type][field];

        // Checks to see if any 'All' preHooks were loaded, returns empty array if none exists
        const allPrehooks = this.preHooksPipelineStore['All']
          ? this.preHooksPipelineStore['All']
          : [];

        // Checks the current type of Resolver ('Query', 'Mutation', etc) has been loaded from desolver.use(), returns empty array if not
        const typePrehooks = this.preHooksPipelineStore[type]
          ? this.preHooksPipelineStore[type]
          : [];

        // Check name of the current resolver function in the idCachedDesolvers store, if it exists
        // Replace the existing wrapped function with a new invocation of useRoute, and re-wrap the function but with preHooks appended to the idCachedDesolvers
        if (this.idCachedDesolvers[resolversMap[type][field].name]) {
          resolversMap[type][field] = this.useRoute(
            ...allPrehooks,
            ...typePrehooks,
            ...this.idCachedDesolvers[currentResolver.name]
          );
          continue;
        }

        // Otherwise if a name does not exist, it means the resolver is defined as a singular function
        // Append the preHooks and the singular function
        resolversMap[type][field] = this.useRoute(
          ...allPrehooks,
          ...typePrehooks,
          currentResolver
        );
      }
    }
    return resolversMap;
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
