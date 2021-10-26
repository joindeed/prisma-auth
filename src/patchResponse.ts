/**
 * Lists are always non-nullable in Prisma, so we need to patch their response with an empty array instead.
 * For convinience, we do the same with required strings.
 *
 * `[User]!` => `[]`
 * `String!` => `''`
 * Everything else => null
 */
export const patchResponse = (returnType: unknown): null | [] | '' => {
  const returnTypeString = String(returnType)
  if (returnTypeString === 'String!') {
    return ''
  }
  if (/^\[.+\]!$/.test(returnTypeString)) {
    return []
  }
  return null
}
