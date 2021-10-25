import { IMiddlewareFunction } from 'graphql-middleware'

import { makeQueryConstraintMiddleware } from './makeQueryConstraintMiddleware'
import { makeFieldConstraintMiddleware } from './makeFieldConstraintMiddleware'
import { makeTypeConstraintMiddleware } from './makeTypeConstraintMiddleware'

interface Role<C, R, W> {
  matcher: (context: C, record: R) => boolean
  queryConstraint: (context: C) => W | boolean
}

export interface Roles<C, R, W> {
  [modelName: string]: {
    [roleName: string]: Role<C, R, W>
  }
}

/**
 * Take roles config and create a bunch of middlewares for various aspects of authorization
 */
export const makeAuthorizationMiddlewares = <C, R, W>(
  roles: Roles<C, R, W>
): Array<IMiddlewareFunction<R, C, unknown>> => [
  makeQueryConstraintMiddleware(roles),
  makeTypeConstraintMiddleware(roles),
  makeFieldConstraintMiddleware(roles),
]
