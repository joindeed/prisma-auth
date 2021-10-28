# This is a mere PoC!!! Not production-ready! API will change!

**What?**: declarative authorisation middleware that operates on Prisma level (and not graphql resolver level).

**Why?**: because imperatively crafting auth rules is dangerous, especially in GraphQL+Prisma world, if we automatically expose the whole schema with Pal.js, nexus-prisma or similar tool.

## Theory

So we support two types of authorisation definitions:

**1. individual field level**

```
model User {
  /// @Auth(read:[ Owner, Admin(privileges:[x,y,z],smth:else) ])
  email String
}
```

**2. model level**

```
/// @Auth(read: [Owner,Admin])
model Purchases {...}
```

Model level read permissions should be enforced in these scenarios:

- custom resolver that returns a single entity of given type
- custom resolver that returns a list of entities of given type. In this case we should actually enforce authorisation at Prisma query level (using the auto-generated `where` clause)
- relation resolver that returns a single entity of given type
- relation resolver that returns a list of entities of given type. **This one is not yet handled**

## Usage

1. Define auth annotations as Prisma comments (see above, not tripple slash)

2. Define role matchers per each Prisma model in this fashion:

```js
const roles = {
  Purchases: {
    Owner: {
      matcher: (ctx, record, roleArgs) => isAuthenticated(ctx) && ctx.currentUser?.id === record?.userId,
      queryConstraint: (ctx, roleArgs) =>
        isAuthenticated(ctx) && {
          userId: ctx.currentUser?.id,
        },
    },
  },
}
```

`matcher` is used to restrict access to individual records.
`queryConstraint` is used to generate a `where` clause for Prisma which should be used to restrict list fields.

3. Configure your GraphQL schema to use the middleware

```js
import { applyMiddleware } from 'graphql-middleware'
import { makeAuthorizationMiddlewares } from 'prisma-auth'
const server = new ApolloServer({
  schema: applyMiddleware(schema, ...makeAuthorizationMiddlewares(roles)),
  ...
})

```

**Get in touch if you have ideas how all of this could have been done better!**

TODO:

- [ ] enforce authorisation on relation resolver that returns a list of entities
- [ ] write proper readme
- [ ] update/delete/create operation support

## Credit

This package has been proudly developed by the Deed team!

Check us out, we may be hiring!

https://www.joindeed.com/
