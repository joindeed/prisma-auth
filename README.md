# prisma-auth

**What?**: A declarative authorisation middleware that operates on Prisma model level (and not on GraphQL resolver level).

**Why?**: Because imperatively crafting authorization rules is dangerous, especially in GraphQL+Prisma world, where we tend to automatically expose the whole schema (with tools like Pal.js, nexus-prisma).

## Theory

Every modern GraphQL platform (like Hasura or MongoDB Realm) offer resource authorisation at the schema level.
Prisma however lacks such luxury, being merely an ORM.
But if we are building a GraphQL API on top of Prisma with a tool that automatically exposes all relations (like nexus-prisma, typegraphql-prisma or Pal.js), we're left to handle resource authorisation on our own.

And suddenly securing all relations inside a resolver becomes a huge P.I.T.A.: are you sure that `Purchase.User.Organization.Users` suddenly won't expose all users on the platform? If you patch it at resolver level it's quite easy to overlook a huge security hole!

Instead, we believe authorisation should be handled at the Prisma model level.
For each model type, we can define a set of roles that are allowed to access it, together with its fields.

We support two kinds of authorisation definitions:

**1. Model level**

```
/// @Auth(read: [Owner( privileges: [x,y,z], smth: else ), Admin])
model Purchases {...}
```

**2. Individual field level**

```
model User {
  /// @Auth(read:[ Owner, Admin ])
  email String
}
```

Note how roles may accept arbitrary arguments that would be passed to the role matcher (see below).

## Usage

0. `yarn add @joindeed/prisma-auth`

1. Define @Auth annotations as Prisma comments (see above, note triple slash)

2. You can define global role matchers that would apply to all Prisma models, and you may override them per each model:

```js
const config = {
  globalRoles: {
    Owner: {
      matcher: (ctx, record, roleArgs) => ctx.currentUser?.id === record?.[roleArgs.userField],
      queryConstraint: (ctx, roleArgs) => ({
        [roleArgs.userField]: ctx.currentUser?.id,
      }),
    },
  },
  rolesPerType: {
    Purchases: {
      Owner: {
        matcher: (ctx, record, roleArgs) => someCondition(ctx) && ctx.currentUser?.id === record?.[roleArgs.userField],
        queryConstraint: (ctx, roleArgs) =>
          someCondition(ctx) && {
            [roleArgs.userField]: ctx.currentUser?.id,
          },
      },
    },
  },
}
```

`matcher` is used to restrict access to individual records. It should return `boolean`.
`queryConstraint` is used to generate a `where` clause for Prisma which should be used to restrict list fields and list relations.

3. Apply `context.withAuth` to every Prisma call like this:

```js
resolve: async (parent, args, context) =>
  return context.prisma.purchases.findMany(context.withAuth({
    where: {
      some: 'query'
    }
  }))
},
```

4. Configure your GraphQL schema to use the middleware

```js
import { applyMiddleware } from 'graphql-middleware'
import { makeAuthorizationMiddlewares } from '@joindeed/prisma-auth'
const server = new ApolloServer({
  schema: applyMiddleware(schema, ...makeAuthorizationMiddlewares(config)),
  ...
})
```

**Get in touch if you have ideas how all of this could have been done better!**

## Plans

Currently, this package only supports `read` operations, since it's the biggest concern in terms of GraphQL security.
`update`/`create`/`delete` are easy to secure with a custom input type.

Nevertheless, we might want to support them in the future.

## Credit

This package has been proudly developed by the Deed team!

Check us out, we may be hiring!

https://www.joindeed.com/

The basis for the `select` plugin has been forked from [prisma-tools](https://raw.githubusercontent.com/paljs/prisma-tools/main/packages/plugins/src/select.ts).
Thanks, Ahmed Elywa!
