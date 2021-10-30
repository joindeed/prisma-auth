# Not production-ready! API might change!

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
- custom resolver that returns a list of entities of given type
- relation resolver that returns a single entity of given type
- relation resolver that returns a list of entities of given type

## Usage

1. Define auth annotations as Prisma comments (see above, not tripple slash)

2. Define role matchers per each Prisma model in this fashion:

```js
const config = {
  globalRoles: {
    Owner: {
      matcher: (ctx, record, roleArgs) => isAdmin(ctx),
      queryConstraint: (ctx, roleArgs) => isAdmin(ctx),
    },
  },
  rolesPerType: {
    Purchases: {
      Owner: {
        matcher: (ctx, record, roleArgs) => isAuthenticated(ctx) && ctx.currentUser?.id === record?.[roleArgs.userField],
        queryConstraint: (ctx, roleArgs) =>
          isAuthenticated(ctx) && {
            userId: ctx.currentUser?.id,
          },
      },
    },
  }
  // Optionally provide path to prisma dmmf, if it's not in `@prisma/client`
  dmmf: [Prisma.dmmf]
}
```

`matcher` is used to restrict access to individual records.
`queryConstraint` is used to generate a `where` clause for Prisma which should be used to restrict list fields and list relations.

3. Configure your GraphQL schema to use the middleware

```js
import { applyMiddleware } from 'graphql-middleware'
import { makeAuthorizationMiddlewares } from '@joindeed/prisma-auth'
const server = new ApolloServer({
  schema: applyMiddleware(schema, ...makeAuthorizationMiddlewares(config)),
  ...
})

```

4. Apply `context.auth` to every Prisma call

```js
resolve: async (parent, args, context) =>
  return context.prisma.purchases.findMany({
    ...context.auth,
  })
},
```

**Get in touch if you have ideas how all of this could have been done better!**

TODO:

- [ ] write proper readme
- [ ] update/delete/create operation support

## Credit

This package has been proudly developed by the Deed team!

Check us out, we may be hiring!

https://www.joindeed.com/
