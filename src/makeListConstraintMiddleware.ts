import { Middleware, Configuration } from '.'

import { PrismaSelect } from './select'

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
 * It generates a Prisma `where` and `select` clauses and overlays them over user parameters with the help of `context.withAuth`.
 * DO NOT FORGET TO APPLY IT TO THE QUERY LIKE THIS TO ALL PRISMA QUERIES:
 * ```
  context.prisma.purchase.findMany(context.withAuth({
    where: { some: 'query' }
  }))
 * ```
 */
export const makeListConstraintMiddleware: (config: Configuration) => Middleware =
  (options) => async (resolve, parent, args, context, info) => {
    const select = new PrismaSelect(info, options, context)
    context.auth = select.value

    // The order here is important: auth must be set last so it wouldn't be possible to override it with the query
    context.withAuth = <T extends unknown>(query: T, path?: string, type?: string): T => {
      const selectValue = path && type ? select.valueOf(path, type) : select.value
      return PrismaSelect.mergeDeep({}, query, selectValue)
    }

    return resolve(parent, args, context, info)
  }
