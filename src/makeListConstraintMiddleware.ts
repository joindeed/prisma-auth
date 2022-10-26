import { Middleware, Configuration } from '.'
import { getListWhereConstrains } from './getListWhereConstrains'

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
    
    const withAuth = <T extends unknown>(query: T, path?: string, type?: string): T => {
      let selectValue
      
      // Get nested value from the return type of the resolver
      if (path && type) {
        selectValue = select.valueOf(path, type)
      // Get ONLY `where` clause for the specified type, without relation to the resolver at all
      // The `select` clause would have to be crafted manually in this case, as it's not possible to deduce it from the return type of the resolver
      // Useful for getting the auth constraints in situations where it's not possible to get it from the resolver return type
      // (e.g. a `count` resolver that only returns a number)
      } else if (!path && type) {
        const where = 
          getListWhereConstrains(
          type,
          info.schema.getType(type)?.description || '',
          options,
          context
        )
        selectValue = { where }
      // Get the value for the root return type of the resolver
      } else {
        selectValue = select.value
      }
      // The order here is important: auth must be set last so it wouldn't be possible to override it with the query
      return PrismaSelect.mergeDeep({}, query || {}, selectValue)
    }

    return resolve(parent, args, {
      ...context, 
      withAuth, 
      // @deprecated, use `withAuth` instead
      auth: select.value
    }, info)
  }
