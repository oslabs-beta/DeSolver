"use strict";
exports.__esModule = true;
exports.Desolver = void 0;
var Desolver = /** @class */ (function () {
    function Desolver(parent, args, context, info, pipeline) {
        this.parent = parent;
        this.args = args;
        this.context = context;
        this.info = info;
        this.pipeline = pipeline;
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
        for (var i = 0; i < this.pipeline.length; i++) {
            if (i === this.pipeline.length - 1) {
                return this.pipeline[i](this.parent, this.args, this.context, this.info);
            }
            this.pipeline[i](this.parent, this.args, this.context, this.info);
        }
    };
    return Desolver;
}());
exports.Desolver = Desolver;
