import { GraphQLResolveInfo } from 'graphql'

import { makeQueryConstraintMiddleware } from './makeQueryConstraintMiddleware'
import { makeFieldConstraintMiddleware } from './makeFieldConstraintMiddleware'
import { makeTypeConstraintMiddleware } from './makeTypeConstraintMiddleware'

interface Role<C, R, W> {
  matcher: (context: C, record: R) => boolean
  queryConstraint: (context: C) => W | boolean
}

export interface Roles<C = any, R = any, W = any> {
  [modelName: string]: {
    [roleName: string]: Role<C, R, W>
  }
}

export type Middleware = (
  resolve: (parent: {}, args: {}, context: { where?: unknown }, info: GraphQLResolveInfo) => unknown,
  parent: {},
  args: {},
  context: { where?: unknown },
  info: GraphQLResolveInfo
) => unknown

/**
 * Take roles config and create a bunch of middlewares for various aspects of authorization
 */
export const makeAuthorizationMiddlewares = (roles: Roles) => [
  makeQueryConstraintMiddleware(roles),
  makeTypeConstraintMiddleware(roles),
  makeFieldConstraintMiddleware(roles),
]
