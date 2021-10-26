import { makeTypeConstraintMiddleware } from './makeTypeConstraintMiddleware'
import { Roles, Info } from '.'

interface Context {
  currentUser: {
    id: string
  }
  where?: unknown
}
interface Purchase {
  id: string
  User: {
    id: string
  }
}

const context: Context = {
  currentUser: {
    id: 'myUserId',
  },
}

test('makeTypeConstraintMiddleware', async () => {
  const roles: Roles<Context, Purchase> = {
    User: {
      Owner: {
        matcher: (ctx, record) => ctx.currentUser?.id === record?.id,
        queryConstraint: (ctx) => ({
          userId: ctx.currentUser?.id,
        }),
      },
    },
  }
  const fieldConstraintMiddleware = makeTypeConstraintMiddleware(roles)
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
      getType: (typeName: string) => ({ description: '@Auth(read:[Owner])', name: typeName }),
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

  expect(await fieldConstraintMiddleware(resolve, myPurchase, {}, context, info)).toMatchObject({
    id: 'myUserId',
  })
  expect(await fieldConstraintMiddleware(resolve, foreignPurchase, {}, context, info)).toBe(null)
})
