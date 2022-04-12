import { RolesPerType, Role } from '.'
import { getMatcherDependenciesSelect } from './getMatcherDependenciesSelect'

interface Context {
  currentUser: {
    id: string
    isAdmin?: boolean
  }
  withAuth: <T extends unknown>(query: T) => T
}
interface Purchase {
  id: string
  User: {
    id: string
  }
}

const userContext: Context = {
  currentUser: {
    id: 'myUserId',
  },
  withAuth: (t) => t,
}

test('getMatcherDependenciesSelect', async () => {
  const rolesPerType: RolesPerType<Context, Purchase> = {
    User: {
      Owner: {
        matcher: (ctx, record) => ctx.currentUser?.id === record?.id,
        queryConstraint: (ctx) => ({
          id: ctx.currentUser?.id,
        }),
        matcherDependenciesSelect: (args: any) => ({ [args.testArg]: true }),
      },
      Nobody: {
        matcher: () => false,
        queryConstraint: () => false,
      },
    },
  }
  const globalRoles: { [role: string]: Role<Context, any, any> } = {
    Admin: {
      matcher: (ctx) => ctx.currentUser?.isAdmin === true,
      queryConstraint: (ctx) => ctx.currentUser?.isAdmin === true,
      matcherDependenciesSelect: { globalTestField: true },
    },
  }
  const config = { globalRoles, rolesPerType }

  expect(
    await getMatcherDependenciesSelect(
      'User',
      '@Auth(read:[Admin,Owner(testArg:testFieldFromArgs)])',
      config,
      userContext
    )
  ).toEqual({
    globalTestField: true,
    testFieldFromArgs: true,
  })
})
