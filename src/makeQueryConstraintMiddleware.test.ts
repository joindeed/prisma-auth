import { makeQueryConstraintMiddleware } from './makeQueryConstraintMiddleware'
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
  where: undefined,
}

test('makeQueryConstraintMiddleware', async () => {
  const roles: Roles<Context, Purchase> = {
    User: {
      Owner: {
        matcher: (ctx, record) => ctx.currentUser?.id === record?.id,
        queryConstraint: (ctx) => ({
          id: ctx.currentUser?.id,
        }),
      },
      Admin: {
        matcher: () => true,
        queryConstraint: () => true,
      },
      Nobody: {
        matcher: () => false,
        queryConstraint: () => false,
      },
    },
  }
  const fieldConstraintMiddleware = makeQueryConstraintMiddleware(roles)
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

  expect(await fieldConstraintMiddleware(resolve, {}, {}, context, info)).toEqual({
    OR: [
      true,
      {
        id: 'myUserId',
      },
    ],
  })
})
