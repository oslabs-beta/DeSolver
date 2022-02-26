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
        // iterate over array
        // check hasNext < array length
        // call next -> icrement hasNext 
        for (var i = 0; i < this.pipeline.length; i++) {
            if (i === this.pipeline.length - 1) {
                return this.pipeline[i](this.parent, this.args, this.context, this.info, this.next);
            }
            while (this.hasNext < this.pipeline.length) {
                this.pipeline[this.hasNext](this.parent, this.args, this.context, this.info, this.next);
            }
        }
    };
    Desolver.prototype.next = function () {
        return this.hasNext += 1;
    };
    return Desolver;
}());
exports.Desolver = Desolver;
