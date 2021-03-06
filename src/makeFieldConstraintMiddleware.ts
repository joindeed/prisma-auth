import { RolesPerType, Middleware, Configuration } from '.'

import { descriptionToRoles } from './descriptionToRoles'
import { patchResponse } from './patchResponse'

/**
 * This is used to enfore authorization on individual fields of a type.
 *
 * E.g.:
 * ```
 * model User {
 *    /// @Auth(read:[Owner,Admin])
 *    email String
 * }
 * ```
 */
export const makeFieldConstraintMiddleware: (roles: Configuration) => Middleware =
  ({ rolesPerType, globalRoles }) =>
  (resolve, parent, args, context, info) => {
    const description = info.parentType.getFields()[info.fieldName].description
    const typeName = info.parentType.name

    const readRoles = descriptionToRoles(description)?.read || []

    // We are "whitelist" by default, so if there are no roles in the description, we don't apply any constraints
    if (readRoles.length > 0) {
      // At least one role must be granted
      const granted = readRoles.some((role) => {
        const roleMatcher =
          rolesPerType?.[typeName as keyof RolesPerType]?.[role.name]?.matcher || globalRoles?.[role.name]?.matcher
        if (!roleMatcher) {
          throw new Error(`Role matcher for role "${role.name}" in model "${typeName}" not found`)
        }
        return roleMatcher(context, parent, role.args)
      })

      if (!granted) {
        return patchResponse(info.returnType)
      }
    }

    return resolve(parent, args, context, info)
  }
