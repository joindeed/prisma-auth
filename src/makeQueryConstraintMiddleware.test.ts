import { makeQueryConstraintMiddleware } from './makeQueryConstraintMiddleware'
import { RolesPerType, Info, Role } from '.'

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
  where?: unknown
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
}
const strangerContext: Context = {
  currentUser: {
    id: 'strangerUserId',
  },
}
const adminContext: Context = {
  currentUser: {
    id: 'myUserId',
    isAdmin: true,
  },
}

test('makeQueryConstraintMiddleware', async () => {
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
  const fieldConstraintMiddleware = makeQueryConstraintMiddleware({ rolesPerType, globalRoles })
  const resolve = (root: any, args: unknown, ctx: any) => ctx.where

  const info: Info = {
    fieldName: 'users',
    returnType: '[User!]!' as any,
    schema: {
      getType: (typeName: string) => ({ description: '@Auth(read:[Admin,Owner])', name: typeName }),
    },
    parentType: {
      name: 'Query',
    } as any,
    cacheControl: '',
  } as any

  expect(await fieldConstraintMiddleware(resolve, {}, {}, userContext, info)).toEqual({
    OR: [
      {
        id: 'myUserId',
      },
    ],
  })
  expect(await fieldConstraintMiddleware(resolve, {}, {}, adminContext, info)).toEqual({
    OR: [
      alwaysTrueCondition,
      {
        id: 'myUserId',
      },
    ],
  })
  expect(await fieldConstraintMiddleware(resolve, {}, {}, strangerContext, info)).toEqual({
    OR: [
      {
        id: 'strangerUserId',
      },
    ],
  })
})
