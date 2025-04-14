import { getListWhereConstrains } from './getListWhereConstrains'
import { RolesPerType, Role } from '.'

const alwaysTrueCondition = {
  id: {
    not: {
      equals: 'ffffffffffffffffffffffff',
    },
  },
}

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
const strangerContext: Context = {
  currentUser: {
    id: 'strangerUserId',
  },
  withAuth: (t) => t,
}
const adminContext: Context = {
  currentUser: {
    id: 'myUserId',
    isAdmin: true,
  },
  withAuth: (t) => t,
}

test('makeListConstraintMiddleware', async () => {
  const rolesPerType: RolesPerType<Context, Purchase> = {
    User: {
      Owner: {
        matcher: (ctx, record) => ctx.currentUser?.id === record?.id,
        queryConstraint: (ctx) => ({
          id: ctx.currentUser?.id,
        }),
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
    },
  }
  const config = { globalRoles, rolesPerType }

  expect(await getListWhereConstrains('User', '@Auth(read:[Admin,Owner])', config, userContext)).toEqual({
    AND: [
      {
        OR: [
          {
            id: 'myUserId',
          },
        ],
      },
    ],
  })
  expect(await getListWhereConstrains('User', '@Auth(read:[Admin,Owner])', config, adminContext)).toEqual({
    AND: [
      {
        OR: [
          alwaysTrueCondition,
          {
            id: 'myUserId',
          },
        ],
      },
    ],
  })
  expect(await getListWhereConstrains('User', '@Auth(read:[Admin,Owner])', config, strangerContext)).toEqual({
    AND: [
      {
        OR: [
          {
            id: 'strangerUserId',
          },
        ],
      },
    ],
  })
  expect(await getListWhereConstrains('User', '@Auth(read:[Admin,Nobody])', config, strangerContext)).toEqual({
    AND: [
      {
        id: {
          equals: 'ffffffffffffffffffffffff',
        }
      },
    ],
  })
})
