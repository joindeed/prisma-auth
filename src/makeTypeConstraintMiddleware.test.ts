import { makeTypeConstraintMiddleware } from './makeTypeConstraintMiddleware'
import { RolesPerType, Info, Role } from '.'

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

test('makeTypeConstraintMiddleware', async () => {
  const rolesPerType: RolesPerType<Context, Purchase> = {
    User: {
      Owner: {
        matcher: (ctx, record) => ctx.currentUser?.id === record?.id,
        queryConstraint: (ctx) => ({
          userId: ctx.currentUser?.id,
        }),
      },
    },
  }
  const globalRoles: { [role: string]: Role<Context, any, any> } = {
    Admin: {
      matcher: (ctx) => ctx.currentUser?.isAdmin === true,
      queryConstraint: (ctx) => ctx.currentUser?.isAdmin === true,
    },
  }
  const fieldConstraintMiddleware = makeTypeConstraintMiddleware({ rolesPerType, globalRoles })
  const resolve = (record: any) => record?.User

  const myPurchase = {
    id: 'myPurchaseId',
    User: {
      id: 'myUserId',
    },
  }
  const foreignPurchase = {
    id: 'foreignPurchaseId',
    User: {
      id: 'foreignUserId',
    },
  }

  const info: Info = {
    fieldName: 'User',
    returnType: 'User!' as any,
    schema: {
      getType: (typeName: string) => ({ description: '@Auth(read:[Owner,Admin])', name: typeName }),
    },
    parentType: {
      name: 'Purchase',
      getFields: () => ({
        id: {} as any,
        User: {} as any,
      }),
    } as any,
    cacheControl: '',
  } as any

  expect(await fieldConstraintMiddleware(resolve, myPurchase, {}, userContext, info)).toEqual({
    id: 'myUserId',
  })
  expect(await fieldConstraintMiddleware(resolve, foreignPurchase, {}, userContext, info)).toBe(null)

  expect(await fieldConstraintMiddleware(resolve, foreignPurchase, {}, adminContext, info)).toEqual({
    id: 'foreignUserId',
  })

  expect(await fieldConstraintMiddleware(resolve, myPurchase, {}, strangerContext, info)).toBe(null)
})

test('makeTypeConstraintMiddleware skips on introspection types', async () => {
  const rolesPerType: RolesPerType<any, any> = {}
  const globalRoles: { [role: string]: Role<any, any, any> } = {}
  const mw = makeTypeConstraintMiddleware({ rolesPerType, globalRoles })
  const resolve = (record: any) => record

  const result = { some: 'data' }
  const info: Info = {
    fieldName: 'inputFields',
    returnType: '[__InputValue]!' as any,
    schema: {
      getType: (typeName: string) => ({ description: '', name: typeName }),
    },
    parentType: {
      name: '__Type',
      getFields: () => ({} as any),
    } as any,
    cacheControl: '',
  } as any

  expect(await mw(resolve, result, {}, {}, info)).toBe(result)
})
