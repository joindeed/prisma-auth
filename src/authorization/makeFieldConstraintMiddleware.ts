import { IMiddlewareFunction } from 'graphql-middleware'

import { Roles } from '.'

import { descriptionToReadRoles } from './descriptionToReadRoles'
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
export const makeFieldConstraintMiddleware: (roles: Roles) => IMiddlewareFunction<unknown, unknown, unknown> =
  (roles) => (resolve, parent, args, context, info) => {
    const description = info.parentType.getFields()[info.fieldName].description
    const typeName = info.parentType.name

    const readRoles = descriptionToReadRoles(description)

    // We are "whitelist" by default, so if there are no roles in the description, we don't apply any constraints
    if (readRoles.length > 0) {
      // At least one role must be granted
      const granted = readRoles.some((role) => {
        const config = roles[typeName as keyof Roles]?.[role]
        const roleMatcher = config?.matcher
        if (!roleMatcher) {
          throw new Error(`Role matcher for role "${role}" in model "${typeName}" not found`)
        }
        return roleMatcher(context, parent)
      })

      if (!granted) {
        return patchResponse(info.returnType)
      }
    }

    return resolve(parent, args, context, info)
  }
