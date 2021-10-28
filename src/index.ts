import { IMiddlewareResolver } from 'graphql-middleware/dist/types'

import { makeQueryConstraintMiddleware } from './makeQueryConstraintMiddleware'
import { makeFieldConstraintMiddleware } from './makeFieldConstraintMiddleware'
import { makeTypeConstraintMiddleware } from './makeTypeConstraintMiddleware'

export interface Role<C, R, W> {
  matcher: (context: C, record: R) => boolean
  queryConstraint: (context: C) => W | boolean
}

export interface RolesPerType<C = any, R = any, W = any> {
  [modelName: string]: {
    [roleName: string]: Role<C, R, W>
  }
}
export interface Configuration {
  rolesPerType?: RolesPerType
  globalRoles?: {
    [roleName: string]: Role<any, any, any>
  }
}

// @TODO: fix types
export type Info = any
export type Context = { where?: unknown }

export type Middleware = IMiddlewareResolver

/**
 * Take roles config and create a bunch of middlewares for various aspects of authorization
 */
export const makeAuthorizationMiddlewares = (config: Configuration) => [
  makeQueryConstraintMiddleware(config),
  makeTypeConstraintMiddleware(config),
  makeFieldConstraintMiddleware(config),
]
