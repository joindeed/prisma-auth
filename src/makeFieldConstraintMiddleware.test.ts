import { makeFieldConstraintMiddleware } from './makeFieldConstraintMiddleware'
import { Roles, Info } from '.'

interface Context {
  currentUser: {
    id: string
  }
  where?: unknown
}
interface Purchase {
  id: string
  userId: string
  ownerOnlyField: string
}

const context: Context = {
  currentUser: {
    id: 'myUserId',
  },
}

describe('makeFieldConstraintMiddleware', () => {
  const roles: Roles<Context, Purchase> = {
    Purchase: {
      Owner: {
        matcher: (ctx, record) => ctx.currentUser?.id === record?.userId,
        queryConstraint: (ctx) => ({
          userId: ctx.currentUser?.id,
        }),
      },
    },
  }
  const fieldConstraintMiddleware = makeFieldConstraintMiddleware(roles)
  const resolve = (record: any) => record?.ownerOnlyField

  const myPurchase = {
    id: 'myPurchaseId',
    userId: 'myUserId',
    ownerOnlyField: 'myOwnerOnlyField',
  }
  const foreignPurchase = {
    id: 'foreignPurchaseId',
    userId: 'foreignUserId',
    ownerOnlyField: 'foreignOwnerOnlyField',
  }

  it('Patch `String` type to `null`', () => {
    const info: Info = {
      fieldName: 'ownerOnlyField',
      returnType: 'String' as any,
      parentType: {
        name: 'Purchase',
        getFields: () => ({
          id: {} as any,
          userId: {} as any,
          ownerOnlyField: {
            description: '@Auth(read:[Owner])',
          } as any,
        }),
      } as any,
      cacheControl: '',
    } as any

    expect(fieldConstraintMiddleware(resolve, myPurchase, {}, context, info)).toBe('myOwnerOnlyField')
    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, context, info)).toBe(null)
  })
  it('Patch `String!` type to `""`', () => {
    const info: Info = {
      fieldName: 'ownerOnlyField',
      returnType: 'String!' as any,
      parentType: {
        name: 'Purchase',
        getFields: () => ({
          id: {} as any,
          userId: {} as any,
          ownerOnlyField: {
            description: '@Auth(read:[Owner])',
          } as any,
        }),
      } as any,
      cacheControl: '',
    } as any

    expect(fieldConstraintMiddleware(resolve, myPurchase, {}, context, info)).toBe('myOwnerOnlyField')
    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, context, info)).toBe('')
  })
  it('Patch list type to `[]`', () => {
    const info: Info = {
      fieldName: 'ownerOnlyField',
      returnType: '[String]!' as any,
      parentType: {
        name: 'Purchase',
        getFields: () => ({
          id: {} as any,
          userId: {} as any,
          ownerOnlyField: {
            description: '@Auth(read:[Owner])',
          } as any,
        }),
      } as any,
      cacheControl: '',
    } as any

    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, context, info)).toEqual([])
  })
})
