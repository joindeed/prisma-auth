import { makeQueryConstraintMiddleware } from './makeQueryConstraintMiddleware'
import { Roles } from '.'
import { GraphQLResolveInfo } from 'graphql'

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
  const resolve = () => ['some result']

  const info: GraphQLResolveInfo = {
    fieldName: 'users',
    returnType: '[User!]!' as any,
    schema: {
      getType: (typeName: string) => ({ description: '@Auth(read:[Admin,Owner])', name: typeName }),
    },
    parentType: {
      name: 'Query',
    } as any,
  } as any

  expect(await fieldConstraintMiddleware(resolve, {}, {}, context, info)).toEqual(['some result'])

  expect(context.where).toEqual({
    OR: [
      true,
      {
        id: 'myUserId',
      },
    ],
  })
})
