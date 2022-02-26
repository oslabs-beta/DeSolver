export type Resolver = (
  parent: Record<string, object>,
  args: Record<string, object>,
  context: Record<string, object>,
  info: Record<string, object>
) => unknown;

export class Desolver {
  constructor(
    public parent: Record<string, object>,
    public args: Record<string, object>,
    public context: Record<string, object>,
    public info: Record<string, object>,
    public pipeline: Resolver[]
  ) {}

  public use(...resolvers: Resolver[]): unknown {
    this.pipeline = resolvers;
    return this.execute();
  }

  private execute(): unknown {
    for (let i = 0; i < this.pipeline.length; i++) {
      if (i === this.pipeline.length - 1) {
        return this.pipeline[i](
          this.parent,
          this.args,
          this.context,
          this.info
        );
      }
      this.pipeline[i](this.parent, this.args, this.context, this.info);
    }
  }
}
