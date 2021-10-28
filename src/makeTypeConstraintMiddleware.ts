import { Configuration, Middleware, RolesPerType } from '.'

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
export const makeTypeConstraintMiddleware: (config: Configuration) => Middleware =
  ({ rolesPerType, globalRoles }) =>
  async (resolve, parent, args, context, info) => {
    const result = await resolve(parent, args, context, info)

    const typeName = extractNonListType(info.returnType)
    if (!typeName) {
      return result
    }

    const model = info.schema.getType(typeName)
    const readRoles = descriptionToReadRoles(model?.description)

    if (readRoles.length > 0) {
      const granted = readRoles.some((role) => {
        const roleMatcher = rolesPerType?.[model?.name as any]?.[role]?.matcher || globalRoles?.[role]?.matcher
        if (!roleMatcher) {
          throw new Error(`Role "${role}" in model "${model?.name}" not found`)
        }
        return roleMatcher(context, result)
      })

      if (!granted) {
        return patchResponse(info.returnType)
      }
    }

    return result
  }
