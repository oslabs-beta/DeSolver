"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Desolver = void 0;
// export interface ResolvedObject {
//   resolved: boolean;
//   value: unknown;
// }
// NOTES TO SELF: 
// recursive execute function 
// base case = received expected value back (expexted Type only?)
// err handling with iterative solution first
// how to catch the errors iteratively first before recursion 
var Desolver = /** @class */ (function () {
    // private resolvedObject: ResolvedObject = { resolved: false, value: null }
    function Desolver(parent, args, context, info) {
        this.parent = parent;
        this.args = args;
        this.context = context;
        this.info = info;
        this.hasNext = 0;
        this.next = this.next.bind(this);
        // this.escapeHatch = this.escapeHatch.bind(this)
    }
    Desolver.use = function () {
        var _this = this;
        var resolvers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            resolvers[_i] = arguments[_i];
        }
        return function (parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
            var desolver;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        desolver = new Desolver(parent, args, context, info);
                        return [4 /*yield*/, desolver.composePipeline.apply(desolver, resolvers)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
    };
    // Consider refactoring the below using the 'cause' proptery in custom error types
    // Consider own Error class to differentiate errors? Is this needed?  
    Desolver.prototype.errorLogger = function (error) {
        var errorObj = {
            'Error': error.toString(),
            'Error Name': error.name,
            'Error Message': error.message
        };
        throw new Error("failed to resolve ".concat(this.pipeline[this.hasNext], ": ").concat(errorObj));
        // ^ how can I refacor the above to include multiple error parameters, Error(message, options)
    };
    Desolver.prototype.composePipeline = function () {
        var resolvers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            resolvers[_i] = arguments[_i];
        }
        this.pipeline = resolvers;
        return this.execute();
    };
    Desolver.prototype.execute = function () {
        while (this.hasNext < this.pipeline.length - 1) {
            console.log('this.hasNext:', this.hasNext, 'pipe length', this.pipeline.length);
            try {
                this.pipeline[this.hasNext](this.parent, this.args, this.context, this.info, this.next, this.escapeHatch);
            }
            // "Catch clause variable type annotation must be 'any' or 'unknown' if specified."
            catch (error) {
                return this.errorLogger(error);
            }
        }
        return this.pipeline[this.hasNext](this.parent, this.args, this.context, this.info, this.next, this.escapeHatch);
    };
    Desolver.prototype.next = function () {
        // if (args) {
        //   return this.hasNext += 1
        // }
        return this.hasNext += 1;
    };
    Desolver.prototype.escapeHatch = function () {
        // this.hasNext = this.pipeline.length
        console.log('REACHED ESCAPE HATCH!!!');
        return;
        // return this.hasNext = this.pipeline.length + 1
    };
    return Desolver;
}());
exports.Desolver = Desolver;
