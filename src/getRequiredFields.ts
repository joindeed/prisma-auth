import { Configuration, Context, RolesPerType } from '.'
import { descriptionToRoles } from './descriptionToRoles'
import { PrismaSelect } from './select'

/**
 * Get all the fields that are declared by the Role as required.
 * Rule.requiredFields takes either a `select` object or a function that takes role arguments and returns a `select` object.
 */
export const getRequiredFields = (
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
  return readRoles.reduce((acc, role) => {
    const requiredFields =
      rolesPerType?.[fieldType as keyof RolesPerType]?.[role.name]?.requiredFields ||
      globalRoles?.[role.name]?.requiredFields
    if (typeof requiredFields === 'function') {
      PrismaSelect.mergeDeep(acc, requiredFields(role.args))
    } else if (typeof requiredFields === 'object') {
      PrismaSelect.mergeDeep(acc, requiredFields)
    }
    return acc
  }, {})
}
