import { Middleware, Configuration } from '.'

import { PrismaSelect } from './select'

export const alwaysTrueCondition = {
  id: {
    not: {
      equals: 'ffffffffffffffffffffffff',
    },
  },
}

/**
 * This is used to enforce query consttraints on list queries and on nested relation queries.
 * Additionally this middleware takes over the responsibility
 * of selecting just the righ fields from the `select` plugin (essentially just forking it).
 * 
 * It's defined one model level like this:
 * ```
 * /// @Auth(read: [Owner,Admin])
 * model Purchase {}
 * ```
 *
 * It generates a Prisma `where` clause and sets it onto `context.auth`, together with `select` clause.
 * DO NOT FORGET TO APPLY IT TO THE QUERY LIKE THIS TO ALL PRISMA QUERIES:
 * ```
  context.prisma.purchase.findMany({
    ...context.auth,
  })
 * ```
 */
export const makeQueryConstraintMiddleware: (config: Configuration) => Middleware =
  (options) => async (resolve, parent, args, context, info) => {
    const select = new PrismaSelect(info, options, context)
    context.auth = select.value

    return resolve(parent, args, context, info)
  }
