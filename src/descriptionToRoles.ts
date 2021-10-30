import { parse } from './generated/parser'

export type RoleArgs = Record<string, string | string[]>

export interface RoleDescription {
  name: string
  args: RoleArgs
}

/**
 * Parse type description and extract read role names.
 * E.g. `@Auth(read: [Owner, Admin])` => `['Owner', 'Admin']`
 *
 * In the future this would have to be adjust for update and delete operations
 */
export const descriptionToRoles = (
  description?: string | null
): Record<'create' | 'read' | 'update' | 'delete', RoleDescription[]> | null => {
  if (!description || !description.includes('@Auth')) {
    return null
  }
  return parse(description)
}
