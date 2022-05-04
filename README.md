<p align="center" > 
<img src = "assets/orangesphere_web.gif" width="250"/> 
</p>

<h1 align="center">DeSolver</h1>
&nbsp;

## Table of Contents

- [About](https://github.com/oslabs-beta/DeSolver/#about)
- [Getting Started](https://github.com/oslabs-beta/DeSolver/#gettingstarted)
- [Features](https://github.com/oslabs-beta/DeSolver/#features)
  - [DeSolver Pipeline](https://github.com/oslabs-beta/DeSolver/#pipeline)
  - [Other DeSolver Arguments](https://github.com/oslabs-beta/DeSolver/#desolverargs)
  - [Error Handling](https://github.com/oslabs-beta/DeSolver/#desolvererrors)
- [Example](https://github.com/oslabs-beta/DeSolver/#desolverexample)
- [Contributors](https://github.com/oslabs-beta/DeSolver/#team)
- [License](https://github.com/oslabs-beta/DeSolver/#license)

<p><br>
<h2 href="#about"></h2>

# About

DeSolver for [GraphQL](https://graphql.org/): a minimalist and unopinionated Node.js GraphQL framework providing a powerful yet approachable API for modularizing resolver business logic.

DeSolver is an optimized solution for writing resolvers in GraphQL. Leveraging promises, private and public functions, DeSolver forms a wrapper around the resolver queries eliminating the template or boilerplate code needed. A pipeline (or array) of resolvers are executed with error handling between each resolver. Desolver even has an 'escape hatch' that permits ending the pipeline at your query needs or due to conditional statements.

<p><br>

<h2 href="#gettingstarted"> </h2>

# Getting Started

1. Installing Desolver
2. OTHER INFORMATION

<p><br>

<h2 href="#features"></h2>

# Features

<h3 href="#cache"></h3>

### **Cache**

DeSolver utilizes Redis caching to for greater optimization. [Redis](https://redis.io) is an "open-source, in-memory data store...used as a database, cache, streaming engine, and message broker." Desolver employs Redis caching for faster resolver query results or even for developer use for authentication and session storage. Using Redis' ability to cache with a hash key for the field queries lead to DeSolver seeing early testing results optimized by 400%.

<p><br>
<h3 href="#pipeline"></h3>

### **Desolver Pipeline**

GraphQL Fragments are used to share logic throughout multiple queries or mutations. The DesolverFragment performs similar logic with the ResolverWrapper. The ResolverWrapper is a type that maintains the four arguments of the native GraphQL Resolvers (parent, args, context, info), within the DeSolver. When the route for desolvers is called (useRoute), the DesolverFragment returns a promise that configures a pipeline or an array, which configures all the resolvers into the DeSolver object. This pipeline is executed on use of the DeSolver, iterating through the pipeline via next callbacks, to handle the request response cycle of the resolvers.

<p><br>
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
