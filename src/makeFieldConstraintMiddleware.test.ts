import { makeFieldConstraintMiddleware } from './makeFieldConstraintMiddleware'
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
  userId: string
  ownerOnlyField: string
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

describe('makeFieldConstraintMiddleware', () => {
  const rolesPerType: RolesPerType<Context, Purchase> = {
    Purchase: {
      Owner: {
        matcher: (ctx, record) => ctx.currentUser?.id === record?.userId,
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
  const fieldConstraintMiddleware = makeFieldConstraintMiddleware({ rolesPerType, globalRoles })
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
            description: '@Auth(read:[Owner,Admin])',
          } as any,
        }),
      } as any,
      cacheControl: '',
    } as any

    expect(fieldConstraintMiddleware(resolve, myPurchase, {}, userContext, info)).toBe('myOwnerOnlyField')
    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, userContext, info)).toBe(null)

    expect(fieldConstraintMiddleware(resolve, myPurchase, {}, adminContext, info)).toBe('myOwnerOnlyField')
    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, adminContext, info)).toBe('foreignOwnerOnlyField')

    expect(fieldConstraintMiddleware(resolve, myPurchase, {}, strangerContext, info)).toBe(null)
    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, strangerContext, info)).toBe(null)
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
            description: '@Auth(read:[Owner,Admin])',
          } as any,
        }),
      } as any,
      cacheControl: '',
    } as any

    expect(fieldConstraintMiddleware(resolve, myPurchase, {}, userContext, info)).toBe('myOwnerOnlyField')
    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, userContext, info)).toBe('')

    expect(fieldConstraintMiddleware(resolve, myPurchase, {}, adminContext, info)).toBe('myOwnerOnlyField')
    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, adminContext, info)).toBe('foreignOwnerOnlyField')

    expect(fieldConstraintMiddleware(resolve, myPurchase, {}, strangerContext, info)).toBe('')
    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, strangerContext, info)).toBe('')
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
            description: '@Auth(read:[Owner,Admin])',
          } as any,
        }),
      } as any,
      cacheControl: '',
    } as any

    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, userContext, info)).toEqual([])
    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, adminContext, info)).toEqual('foreignOwnerOnlyField')
    expect(fieldConstraintMiddleware(resolve, foreignPurchase, {}, strangerContext, info)).toEqual([])
  })
})
