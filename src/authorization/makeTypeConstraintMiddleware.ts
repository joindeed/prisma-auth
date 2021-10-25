import { IMiddlewareFunction } from 'graphql-middleware'

import { Roles } from '.'

import { descriptionToReadRoles } from './descriptionToReadRoles'
import { patchResponse } from './patchResponse'

/**
 * Make sure it's not a list type, and extract the type name out of it,
 * e.g.:
 * `User!` => `User`,
 * `[User]! => `null`
 */
const extractNonListType = (type: unknown): string | null => {
  const match = /^(\w+)(!)?$/.exec(String(type))
  if (!match || !match?.[1]) {
    return null
  }
  return match?.[1]
}

/**
 * This is used to enforce Authroization on 1-to-1 relation fields.
 * E.g. given:
 *
 * ```
 * /// @Auth(read: [Owner,Organizer,Admin])
 * model User {}
 * model Purchase {
 *   User User @relation(fields: [userId], references: [id])
 * }
 * ```
 * `Purchase.User` here should be automatically enforced
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeTypeConstraintMiddleware: (roles: Roles) => IMiddlewareFunction<any, unknown, unknown> =
  (roles) => async (resolve, parent, args, context, info) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await resolve(parent, args, context, info)

    const typeName = extractNonListType(info.returnType)
    if (!typeName) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result
    }

    const model = info.schema.getType(typeName)
    const readRoles = descriptionToReadRoles(model?.description)

    if (readRoles.length > 0) {
      const granted = readRoles.some((role) => {
        const roleMatcher = roles[model?.name]?.[role]?.matcher
        if (!roleMatcher) {
          throw new Error(`Role "${role}" in model "${model?.name}" not found`)
        }
        return roleMatcher(context, result)
      })

      if (!granted) {
        return patchResponse(info.returnType)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result
  }
