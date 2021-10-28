import { Middleware, RolesPerType, Configuration } from '.'

import { descriptionToReadRoles } from './descriptionToReadRoles'

const alwaysTrueCondition = {
  id: {
    not: {
      equals: 'ffffffffffffffffffffffff',
    },
  },
}

/**
 * This is used to enforce query consttraints on list queries.
 * It's defined one model level like this:
 * ```
 * /// @Auth(read: [Owner,Admin])
 * model Purchase {}
 * ```
 *
 * It generates a Prisma `where` clause and sets it onto `context`.
 * DO NOT FORGET TO APPLY IT TO THE QUERY LIKE THIS:
 * ```
 * context.prisma.purchase.findMany({
      where: context.where
    })
 * ```
 */
export const makeQueryConstraintMiddleware: (config: Configuration) => Middleware =
  ({ rolesPerType, globalRoles }) =>
  async (resolve, parent, args, context, info) => {
    const match = /^\[(\w+)(!)?\]!?$/.exec(String(info.returnType))
    if (!match) {
      return resolve(parent, args, context, info)
    }
    const model = info.schema.getType(match?.[1])
    if (!model) {
      return resolve(parent, args, context, info)
    }

    const readRoles = descriptionToReadRoles(model?.description)

    // We are "whitelist" by default, so if there are no roles in the description, we don't apply any constraints
    if (readRoles.length > 0) {
      context.where = {
        OR: readRoles
          .map((role) => {
            const queryConstraint =
              rolesPerType?.[model?.name as keyof RolesPerType]?.[role]?.queryConstraint ||
              globalRoles?.[role]?.queryConstraint
            if (!queryConstraint) {
              throw new Error(`Query constraint for role "${role}" in model "${model?.name}" not found`)
            }
            const result = queryConstraint(context)
            if (typeof result === 'object') {
              return result
            }
            if (result === true) {
              return alwaysTrueCondition
            }
            return null
          })
          .filter(Boolean),
      }
    }
    return resolve(parent, args, context, info)
  }
