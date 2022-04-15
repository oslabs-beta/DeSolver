export type Resolver = (
  parent: Record<string, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: Record<string, unknown>,
  next: () => unknown,
  escapeHatch: (args: any) => unknown
) => unknown;

export type ResolverWrapper = ( 
  parent: Record<string | number | symbol, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: Record<string, unknown>
) => unknown | Promise<unknown>;

export type EscapeDesolver = {
  bool: boolean;
  resolveVal: null;
}

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
  private escapeDesolver: EscapeDesolver = {bool: false, resolveVal: null}

  constructor(
    public parent: Record<string, unknown>,
    public args: Record<string, unknown>,
    public context: Record<string, unknown>,
    public info: Record<string, unknown>,
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
    throw new Error(`failed to resolve ${this.pipeline[this.hasNext]}: ${errorObj}`)
    // ^ how can I refacor the above to include multiple error parameters, Error(message, options)
  }

  public composePipeline(...resolvers: Resolver[]): unknown {
    this.pipeline = resolvers;
    return this.execute();
  }

  private async execute(): Promise<unknown> {
    while (this.hasNext < this.pipeline.length - 1) {
      console.log('this.hasNext:',this.hasNext, 'pipe length',this.pipeline.length)
      
      if (this.escapeDesolver.bool === true) {
        console.log(`
          Reached conditional for escapeDesolver.
          Returning: ${this.escapeDesolver.resolveVal}`
        )
        return this.escapeDesolver.resolveVal
      }
      
      try {
        await this.pipeline[this.hasNext](
          this.parent,
          this.args,
          this.context,
          this.info,
          this.next,
          this.escapeHatch
        );
      }
      catch (error: any) {
        return this.errorLogger(error)
      }
    }

    return await this.pipeline[this.hasNext](
      this.parent,
      this.args,
      this.context,
      this.info,
      this.next,
      this.escapeHatch
    );
  }

  public next(): unknown {
    return this.hasNext += 1;
  }

  public escapeHatch(args: any): unknown {
    console.log('REACHED ESCAPE HATCH, args = ', args);

    this.escapeDesolver.bool = true;
    console.log('new boolean value : ', this.escapeDesolver.bool)

    this.escapeDesolver.resolveVal = args;
    console.log('return value out of escapeHatch: ', this.escapeDesolver.resolveVal)
    return 
  }
}
