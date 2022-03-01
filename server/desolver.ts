export type Resolver = (
  parent: Record<string, object>,
  args: Record<string, object>,
  context: Record<string, object>,
  info: Record<string, object>,
  next: (() => void)
) => unknown;

export type resolverWrapper = (
  parent: Record<string, object>,
  args: Record<string, object>,
  context: Record<string, object>,
  info: Record<string, object>
) => unknown;

export class Desolver {
  public static use(...resolvers: Resolver[]): resolverWrapper {
    return async (parent, args, context, info) => {
      const desolver = new Desolver(parent, args, context, info);
      return await desolver.composePipeline(...resolvers);
    };
  }

  private hasNext: number = 0;
  private pipeline: Resolver[];
  
  constructor(
    public parent: Record<string, object>,
    public args: Record<string, object>,
    public context: Record<string, object>,
    public info: Record<string, object>,

    ) {
      this.next = this.next.bind(this);
    }

  public composePipeline(...resolvers: Resolver[]): unknown {
    this.pipeline = resolvers;
    return this.execute();
  }

  private execute(): unknown {
    while (this.hasNext <= this.pipeline.length - 1) {
      if (this.hasNext === this.pipeline.length - 1) {
        return this.pipeline[this.hasNext](this.parent, this.args, this.context, this.info, this.next);
      }
      this.pipeline[this.hasNext](this.parent, this.args, this.context, this.info, this.next);
    }
  }

  public next() {
    this.hasNext += 1;
  }
}