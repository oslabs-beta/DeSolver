export type Resolver = (
  parent: Record<string, object>,
  args: Record<string, object>,
  context: Record<string, object>,
  info: Record<string, object>,
  next: (() => void)
) => unknown;

export class Desolver {
  
  constructor(
    public parent: Record<string, object>,
    public args: Record<string, object>,
    public context: Record<string, object>,
    public info: Record<string, object>,
    public pipeline: Resolver[],
    public hasNext: number = 0,
    ) {
      this.next = this.next.bind(this);
    }

  public use(...resolvers: Resolver[]): unknown {
    this.pipeline = resolvers;
    return this.execute();
  }

  private execute(): unknown {
    // iterate over array
    // check hasNext < array length
    // call next -> icrement hasNext 
    
    // for (let i = 0; i < this.pipeline.length; i++) {
    //   // console.log('this.hasNext: ', this.hasNext)
    //   // this.next()
    //   if (i === this.pipeline.length - 1) {
    //     return this.pipeline[i](
    //       this.parent,
    //       this.args,
    //       this.context,
    //       this.info,
    //       this.next
    //     );
    //   }
    //   // console.log('this.next: ', this.next)
    //   this.pipeline[i](this.parent, this.args, this.context, this.info, this.next);
    // }
    
    while (this.hasNext <= this.pipeline.length - 1) {
      if (this.hasNext === this.pipeline.length - 1) {
        return this.pipeline[this.hasNext](this.parent, this.args, this.context, this.info, this.next);
      }
      this.pipeline[this.hasNext](this.parent, this.args, this.context, this.info, this.next);
      // if (returnedValue !== undefined) {
      //   return returnedValue;
      // }
    }
  }

  public next() {
    console.log('before increment next: ', this.hasNext)
    this.hasNext += 1;
    console.log('after increment next: ', this.hasNext)
  }
}
