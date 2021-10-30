import { IMiddlewareResolver } from 'graphql-middleware/dist/types'

import { makeListConstraintMiddleware } from './makeListConstraintMiddleware'
import { makeFieldConstraintMiddleware } from './makeFieldConstraintMiddleware'
import { makeTypeConstraintMiddleware } from './makeTypeConstraintMiddleware'
import { RoleArgs } from './descriptionToRoles'

export interface Role<C, R, W> {
  matcher: (context: C, record: R, roleArgs: RoleArgs) => boolean
  queryConstraint: (context: C, roleArgs: RoleArgs) => W | boolean
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
  dmmf?: any[]
}

// @TODO: fix types
export type Info = any
export type Context = { auth?: unknown; withAuth: <T extends unknown>(query: T) => T }

export type Middleware = IMiddlewareResolver

/**
 * Take roles config and create a bunch of middlewares for various aspects of authorization
 */
export const makeAuthorizationMiddlewares = (config: Configuration) => [
  makeFieldConstraintMiddleware(config),
  makeTypeConstraintMiddleware(config),
  makeListConstraintMiddleware(config),
]
