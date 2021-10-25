import { IMiddlewareFunction } from 'graphql-middleware'

import { Roles } from '.'

import { descriptionToReadRoles } from './descriptionToReadRoles'

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeQueryConstraintMiddleware: <C, R, W>(roles: Roles<C, R, W>) => IMiddlewareFunction<R, C, unknown> =
  (roles) => async (resolve, parent, args, context, info) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await resolve(parent, args, context, info)
    const match = /^\[(\w+)(!)?\]!?$/.exec(String(info.returnType))
    if (!match) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result
    }
    const model = info.schema.getType(match?.[1])
    if (!model) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result
    }

    const readRoles = descriptionToReadRoles(model?.description)

    // We are "whitelist" by default, so if there are no roles in the description, we don't apply any constraints
    if (readRoles.length > 0) {
      context.where = {
        OR: readRoles.map((role) => {
          const config = roles[model?.name as keyof Roles]?.[role]
          const queryConstraint = config?.queryConstraint
          if (!queryConstraint) {
            throw new Error(`Query constraint for role "${role}" in model "${model?.name}" not found`)
          }
          return queryConstraint(context)
        }),
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result
  }
