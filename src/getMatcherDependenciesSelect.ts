import { Configuration, Context, RolesPerType } from '.'
import { descriptionToRoles } from './descriptionToRoles'
import { PrismaSelect } from './select'

/**
 * Get all the fields that are declared by the Role as required.
 * Rule.matcherDependenciesSelect takes either a `select` object or a function that takes role arguments and returns a `select` object.
 */
export const getMatcherDependenciesSelect = (
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
    const matcherDependenciesSelect =
      rolesPerType?.[fieldType as keyof RolesPerType]?.[role.name]?.matcherDependenciesSelect ||
      globalRoles?.[role.name]?.matcherDependenciesSelect
    if (typeof matcherDependenciesSelect === 'function') {
      PrismaSelect.mergeDeep(acc, matcherDependenciesSelect(role.args))
    } else if (typeof matcherDependenciesSelect === 'object') {
      PrismaSelect.mergeDeep(acc, matcherDependenciesSelect)
    }
    return acc
  }, {})
}
