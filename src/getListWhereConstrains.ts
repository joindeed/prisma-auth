import { Configuration, Context, RolesPerType } from '.'
import { descriptionToRoles } from './descriptionToRoles'

/**
 * We need some kind of Prisma condition that would be always TRUE. This is the best I could think of...
 */
export const alwaysTrueCondition = {
  id: {
    not: {
      equals: 'ffffffffffffffffffffffff',
    },
  },
}

/**
 * Generate a Prisma `where` clause for filtering list queries and list relations
 */
export const getListWhereConstrains = (
  fieldType: string,
  description: string,
  config: Configuration | undefined,
  context: Context
) => {
  const rolesPerType = config?.rolesPerType
  const globalRoles = config?.globalRoles

  const readRoles = descriptionToRoles(description)?.read || []
  if (readRoles.length === 0) {
    return null
  }
  return {
    // We wrap the enforced query into AND to make sure it doesn't clash with the user's OR query
    AND: [
      {
        OR: readRoles
          .map((role) => {
            const queryConstraint =
              rolesPerType?.[fieldType as keyof RolesPerType]?.[role.name]?.queryConstraint ||
              globalRoles?.[role.name]?.queryConstraint
            if (!queryConstraint) {
              throw new Error(`Query constraint for role "${role.name}" in model "${fieldType}" not found`)
            }
            const result = queryConstraint(context, role.args)
            if (typeof result === 'object') {
              return result
            }
            if (result === true) {
              return alwaysTrueCondition
            }
            return null
          })
          .filter(Boolean),
      },
    ],
  }
}
