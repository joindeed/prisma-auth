/**
 * Parse type description and extract read role names.
 * E.g. `@Auth(read: [Owner, Admin])` => `['Owner', 'Admin']`
 *
 * In the future this would have to be adjust for update and delete operations
 */
export const descriptionToReadRoles = (description?: string | null): string[] => {
  if (!description || !description.includes('@Auth')) {
    return []
  }
  const match = /@Auth\(\s*read:\s*\[([\w,\s]*)\]\s*\)/.exec(description)
  if (!match?.[1]) {
    return []
  }
  return match?.[1].split(',').map((s) => s.trim()) || []
}
