export type ResolverFragment = (
  parent: Record<string, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: Record<string, unknown>,
  next?: <T>(err?: string, resolvedObject?: T) => void
) => unknown;

export type ResolverWrapper = ( 
  parent: Record<string | number | symbol, unknown>,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: Record<string, unknown>
) => unknown | Promise<unknown>;

export interface ResolvedObject {
  resolved: boolean;
  value: unknown;
}

export interface Resolvers {
  [index: string]: {[index: string] : ResolverFragment}
}

export class Desolver {
  public static use(...resolvers: ResolverFragment[]): ResolverWrapper {
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
  private pipeline: ResolverFragment[];
  private resolvedObject: ResolvedObject = { resolved: false, value: null }

  constructor(
    public parent: Record<string, unknown>,
    public args: Record<string, unknown>,
    public context: Record<string, unknown>,
    public info: Record<string, unknown>
  ) {
    this.next = this.next.bind(this);
  }

  public composePipeline(...resolvers: ResolverFragment[]): unknown {
    this.pipeline = resolvers;
    return this.execute();
  }

  private execute(): unknown {
    while (this.hasNext <= this.pipeline.length - 1) {
      if (this.resolvedObject.resolved) return this.resolvedObject.value;

      if (this.hasNext === this.pipeline.length - 1) {
        return this.pipeline[this.hasNext](
          this.parent,
          this.args,
          this.context,
          this.info,
          this.next
        );
      }

      this.pipeline[this.hasNext](
        this.parent,
        this.args,
        this.context,
        this.info,
        this.next
      );
    }
  }

  public next<T>(err?: string, resolveValue?: T ): void | T {
    try {
      if (err) throw new Error(err)
      if (resolveValue) {
        this.resolvedObject.resolved = true;
        return this.resolvedObject.value = resolveValue;
      };
      this.hasNext += 1;
    } catch (error: unknown) {
      throw error;
    }
  }
}
