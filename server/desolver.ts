export type Resolver = (
  parent: Record<string, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: Record<string, unknown>,
  escapeHatch: () => unknown,
  next: () => unknown
) => unknown;

export type ResolverWrapper = ( 
  parent: Record<string | number | symbol, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: Record<string, unknown>
) => unknown | Promise<unknown>;

// export interface ResolvedObject {
//   resolved: boolean;
//   value: unknown;
// }

// NOTES TO SELF: 
// recursive execute function 
// base case = received expected value back (expexted Type only?)
// err handling with iterative solution first
// how to catch the errors iteratively first before recursion 

export class Desolver {
  public static use(...resolvers: Resolver[]): ResolverWrapper {
    return async (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: Record<string, unknown>,
      info: Record<string, unknown>
    ): Promise<unknown> => {
        const desolver = new Desolver(parent, args, context, info);
        return await desolver.composePipeline(...resolvers);
    };
  }

  private hasNext: number = 0;
  private pipeline!: Resolver[];
  // private resolvedObject: ResolvedObject = { resolved: false, value: null }

  constructor(
    public parent: Record<string, unknown>,
    public args: Record<string, unknown>,
    public context: Record<string, unknown>,
    public info: Record<string, unknown>
  ) {
    this.next = this.next.bind(this);
    this.escapeHatch = this.escapeHatch.bind(this)
  }

  // Consider refactoring the below using the 'cause' proptery in custom error types
  // Consider own Error class to differentiate errors? Is this needed?  
  public errorLogger(error: any): any {
    let errorObj = {
      'Error': error.toString(),
      'Error Name': error.name,
      'Error Message': error.message,
    }
    throw new Error(`failed to resolve ${this.pipeline[this.hasNext]}: ${errorObj}`, {cause: error} )
    // ^ how can I refacor the above to include multiple error parameters, Error(message, options)
  }

  public composePipeline(...resolvers: Resolver[]): unknown {
    this.pipeline = resolvers;
    return this.execute();
  }

  private execute(): unknown {
    while (this.hasNext < this.pipeline.length - 1) {
      try {
        this.pipeline[this.hasNext](
          this.parent,
          this.args,
          this.context,
          this.info,
          this.next,
          this.escapeHatch
        );
      }
      // "Catch clause variable type annotation must be 'any' or 'unknown' if specified."
      catch (error: any) {
        return this.errorLogger(error)
      }
    }
    return this.pipeline[this.hasNext](
      this.parent,
      this.args,
      this.context,
      this.info,
      this.next,
      this.escapeHatch
    );
  }

  public next(): unknown {
    // if (args) {
    //   return this.hasNext += 1
    // }
    return this.hasNext += 1;
  }

  public escapeHatch(): unknown {
    // this.hasNext = this.pipeline.length
    console.log('REACHED ESCAPE HATCH!!!')
    return
    // return this.hasNext = this.pipeline.length + 1
  }
}
