import { Configuration, Middleware } from '.'

import { descriptionToRoles } from './descriptionToRoles'
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
    // Skip all logic for GraphQL introspection fields/types
    const parentTypeName = String(info?.parentType?.name || '')
    const returnTypeString = String(info?.returnType || '')
    if (
      parentTypeName.startsWith('__') ||
      returnTypeString.includes('__') ||
      String(info?.fieldName || '').startsWith('__')
    ) {
      return resolve(parent, args, context, info)
    }

    const result = await resolve(parent, args, context, info)

    const typeName = extractNonListType(info.returnType)
    if (!typeName) {
      return result
    }

    const model = info.schema.getType(typeName)
    const readRoles = descriptionToRoles(model?.description)?.read || []

    if (readRoles.length > 0) {
      const granted = readRoles.some((role) => {
        const roleMatcher =
          rolesPerType?.[model?.name as any]?.[role.name]?.matcher || globalRoles?.[role.name]?.matcher
        if (!roleMatcher) {
          throw new Error(`Role "${role}" in model "${model?.name}" not found`)
        }
        return roleMatcher(context, result, role.args)
      })

      if (!granted) {
        return patchResponse(info.returnType)
      }
    }

    return result
  }
