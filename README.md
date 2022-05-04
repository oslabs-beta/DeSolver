<p align="center" > 
<img src = "assets/orangesphere_web.gif" width="250"/> 
</p>

<h1 align="center">DeSolver</h1>
&nbsp;

## Table of Contents

- [About](https://github.com/oslabs-beta/DeSolver/#about)
- [Getting Started](https://github.com/oslabs-beta/DeSolver/#gettingstarted)
- [How to Use](https://github.com/oslabs-beta/DeSolver/#howtouse)
  - [DeSolver Pipeline](https://github.com/oslabs-beta/DeSolver/#pipeline)
  - [Other DeSolver Arguments](https://github.com/oslabs-beta/DeSolver/#desolverargs)
  - [Error Handling](https://github.com/oslabs-beta/DeSolver/#desolvererrors)
- [Example](https://github.com/oslabs-beta/DeSolver/#desolverexample)
- [Contributors](https://github.com/oslabs-beta/DeSolver/#team)
- [License](https://github.com/oslabs-beta/DeSolver/#license)

<p><br>
<h2 href="#about"></h2>

# About

DeSolver for [GraphQL](https://graphql.org/): a lightweight, minimalist, unopinionated Node.js GraphQL framework providing a powerful yet approachable API for composing modular and reusable resolver business logic.

DeSolver aims to provide an easy to use and approachable API to write reusable code logic across GraphQL resolvers. It utilizes the middleware pattern as seen in other popular frameworks as a way to create "routing" for your resolvers.

The DeSolver instance methods allows one to load a pipeline with mini-resolver functions, and then forms a wrapper around the resolver map object, allowing one to chain a series of functions or "pre-hook" functions to execute prior to a query or mutation.  This minimizes the need to wrap individual resolver functions manually, thereby reducing templating and additional boilerplate. It follows the "write once, run everywhere" mantra.

<p><br>

<h2 href="#gettingstarted"> </h2>

# Getting Started

1. Installing Desolver

- Start by running the npm command:

```javascript
npm install desolver
```
- The DeSolver framework works best when combined with [GraphQL tools](https://www.graphql-tools.com/docs/generate-schema) Executable Schema package. It is recommended to download that package and use that to generate your type defintions, resolver map and schema. 

- The DeSolver framework also works with the popular Apollo Server API.  DeSolver can be utilized when combined with the resolver map object in Apollo Server.

- Redis is also used for caching resolvers. Check out [Redis](https://redis.io) and [node-redis](https://github.com/redis/node-redis) for installation details. If you wish to opt out of using Redis, and provide your own caching logic, DeSolver provides a configuration option to disable this default behavior.

<p><br>

<h2 href="#howtouse"></h2>

# How to use

<h3 href="#Desolver Instance"></h3>

### **Desolver Instance and Configuration**

In your GraphQL server or resolvers file create a new instance of DeSolver:

```javascript
const desolver = new Desolver(desolverConfig)
```

The following optional configuration object can be declared as the argument of the DeSolver constructor:

```javascript
const desolverConfig = {
  cacheDesolver?: boolean, // set to true to enable Redis caching
  applyResolverType?: string // resolver type to target for running prehooks
}
```

- `cacheDesolver`: Set to true to enable Redis caching, by default if nothing is passed, the default redis instance will be started. Set to false to disable this behavior.

- `applyResolverType`: Takes a string value that represents either a root query ( `Query`, `Mutation` ) or some other custom type as defined in your schema.  Specify `Root` to chain both `Query` and `Mutation`. Set to `All` to wrap every resolver. By default, if none is specified, all resolvers will be chained to the middleware pipeline. 

The desolverConfig object can also be defined with configuration options from Redis. See [node-redis](https://github.com/redis/node-redis) for a list of additional custom configuration options that can be defined from Redis.
<br><br>

<h3 href="#cache"></h3>

### **Cache**

DeSolver utilizes Redis caching to for greater query optimization. If cacheDesolver option is set to true, this will enable automated caching of resolver queries. DeSolver will automatically generate a unique key for the Redis cache based on path property from the info argument. Set the cacheDesolver property to false if you would like to disable this default behavior and provide your own caching logic.
<br><br>

<h3 href="#Desolver Fragments"></h3>

### **Desolver Fragments**

Desolver Fragments are this frameworks version of middleware functions.  Each resolver can be decomposed into a series of "fragment" functions.  To maintain full functionality of a normal resolver, it provides the current field resolvers first 4 arguments (the root/parent, arguments, context, and info) as well as 3 additional custom parameters (next, escape, and ds)

```javascript
const desolverFragment = (parent, args, context, info, next, escape, ds) => {
  // write your resolver business logic here
  // The first 4 parameters associated with the current resolver are usable here

  // ds - a context object for passing data from one function to the next

  // @return
    // next() - calls the next function in the middleware chain
    // escapeHatch(input) - pass a value to input to resolve immediately
}
```

The Desolver Parameters are as follows:
- ```parent```: Sometimes referred to as the root object. The same parent/root object which is the result of the previous query.
- ```arguments```:
- ```context```: 
- ```info```:
- ```next```: Calls the next Desolver Fragment in the middleware chain.
- escapeHatch: Immediately resolves the current root or field resolver.


<h3 href="#pipeline"></h3>

### **Creating your middleware pipeline**

Utilize the 'use' method on the desolver instance to generate your pipeline of prehook functions. Functions passed to ```desolver.use()``` will be pushed to the function pipeline. Multiple successive invocations of ```desolver.use()``` will add additional functions to the pipeline.

The following is an example use case for the desolver middleware pipeline involving guarding your root queries with authentication logic:

```javascript
const desolver = new Desolver()

// Declare authentication Desolver Fragment Function
const authentication = (parent, args, context, info, next, escape, ds) => {
  // Define some authentication logic here using args or context
  // throw error if not authenticated
}

// Add to the authentication function to pipeline with desolver.use()
// This function will execute prior to all resolvers
desolver.use(authentication)

// Invoke desolver.apply() method with the resolver map object passed
const resolvers = desolver.apply({
  Query: {
    getUserById: (parent, args, context, info) => {
      // this root query is now guarded by the authentication function
    },

    getPostsById: (parent, args, context, info) => {
      // this root query is now guarded by the authentication function
    },
  }

  // Additional resolvers here
})
```
<br><br>

<h3 href="#chainofdesolvers"></h3>

### **Define your resolvers as multiple DeSolver fragments**

If you would like to define your resolvers as a chain of desolver fragments, you can declare a resolver function utilizing ```desolver.useRoute()```.  The useRoute method takes any number of Desolver Fragment middleware functions and forms a "route" for your field resolver.

See the example below:

```javascript
// desolver.use(), desolver.apply() and desolver.useRoute() can 
// be used together to create longer chains

desolver.use(authentication)

const resolvers = desolver.apply({
  Query: {
    // Define your resolver using desolver.useRoute() and add 
    // any number of desolver fragments to modularize resolver logic
    // The authentication function will execute followed by desolverFragment1
    // and desolverFragment2
    getUserById: desolver.useRoute(desolverFragment1, desolverFragment2),

    // desolver.use(), desolver.apply(), desolver.useRoute() and 
    // normal resolver functions used together seamlessly throughout the
    // resolver map
    getPostsById: (parent, { id }, context, info) => {
      return ctx.db.findPosts(id)
    },
  }
})
```
<br><br>

<h3 href="#targetatype"></h3>

### **Targeting a specific resolver or type**

If you would like to chain your resolvers to a specific root type or field resolvers, specify the root query or field to chain the middleware pipeline to.

See the example below:

```javascript
// Specify when instantiating Desolver which resolvers to chain to in the
// configuration object
const desolver = new Desolver({
  applyResolverType: 'Query'
})

desolver.use(authentication)

const resolvers = desolver.apply({
  Query: {
    // Only these root query resolvers will be guarded by the authentication
    // function
    getUserById: desolver.useRoute(desolverFragment1, desolverFragment2),

    getPostsById: (parent, { id }, context, info) => {
      return ctx.db.findPosts(id)
    },
  }

  Mutation: {
    createUser: (parent, root, args, context, info) => {
      // This query is not guarded by the authentication logic
      // set applyResolverType to 'Root' to wrap chain to both 
      // 'Query' and 'Mutation'
    }
  }
})
```
<br><br>

<h3 href="#desolverargs"></h3>

### **EscapeHatch and ds Arguments**

While executing the pipeline, DeSolver offers two additional arguments to pass: ds and escapeHatch. 'ds' is an object that can be passed into a DeSolver query to provide additional configuration of the expected response value(s), similiar to res.locals within Express. The DeSolver escapeHatch argument can be used for additional configuration to stop the DeSolver pipeline and therefore the resolvers from completing their execution if a condition is met. The escapeHatch offers greater control to developer, denying the execution to continue running if there's reason to stop aside from an error. For example, developers may want to confirm the session is still valid for the client prior to completing a query.

<p><br>
<h3 href="#desolvererrors"></h3>

### **Error Handling**

By maintaining an error logging object within the DeSolver class, the DeSolver pipeline can provide individual resolver or field level error reporting back to the .
&nbsp;

<p><br>
<h3 href="#example"></h3>

# **Example**

XXX Pokeman parser demo???

<!-- optimization demo gif that shows side by side of before desolver and after-->
<p><br>
<h3 href="#team"></h3>

# **Contributors**

DeSolver is an open-source community project on Github and accelerated by [OS Labs](https://opensourcelabs.io/). We are maintained by a small group of dedicated software engineers. We appreciate your paricipation, feedback, bug fixes and feature developments.

<p><br>

|                     | GitHub                           | LinkedIn                                        |
| ------------------- | -------------------------------- | ----------------------------------------------- |
| Michael Chan        | https://github.com/mckchan13     | https://www.linkedin.com/in/michael-ck-chan/    |
| Mia Kang            | https://github.com/jcmiakang     | https://www.linkedin.com/in/mia-kang/           |
| Alexander Gurfinkel | https://github.com/AlexGurfinkel | https://www.linkedin.com/in/alexandergurfinkel/ |
| Julia Hickey        | https://github.com/hijulia1136   | https://www.linkedin.com/in/juliahickey/        |

<p><br>
If you are interested in creating an open-source project that builds on top of DeSolver, please don't hesitate to reach out, and we'd be happy to provide feedback and support.

<p><br>
<h3 href="#license"></h3>

# License

This product is licensed under the MIT License - see the LICENSE.md file for details.

This is an open source product.

This product is accelerated by [OS Labs](https://github.com/oslabs-beta).
