"use strict";
exports.__esModule = true;
exports.Desolver = void 0;
var Desolver = /** @class */ (function () {
    function Desolver(parent, args, context, info, pipeline, hasNext) {
        if (hasNext === void 0) { hasNext = 0; }
        this.parent = parent;
        this.args = args;
        this.context = context;
        this.info = info;
        this.pipeline = pipeline;
        this.hasNext = hasNext;
        this.next = this.next.bind(this);
    }
    Desolver.prototype.use = function () {
        var resolvers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            resolvers[_i] = arguments[_i];
        }
        this.pipeline = resolvers;
        return this.execute();
    };
    Desolver.prototype.execute = function () {
        while (this.hasNext <= this.pipeline.length - 1) {
            if (this.hasNext === this.pipeline.length - 1) {
                return this.pipeline[this.hasNext](this.parent, this.args, this.context, this.info, this.next);
            }
            this.pipeline[this.hasNext](this.parent, this.args, this.context, this.info, this.next);
        }
    };
    Desolver.prototype.next = function () {
        console.log('before increment next: ', this.hasNext);
        this.hasNext += 1;
        console.log('after increment next: ', this.hasNext);
    };
    return Desolver;
}());
exports.Desolver = Desolver;
