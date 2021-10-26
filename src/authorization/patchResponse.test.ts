import { patchResponse } from './patchResponse'
describe('patchResponse', () => {
  it('should patch things according to response type', () => {
    expect(patchResponse('String')).toEqual(null)
    expect(patchResponse('String!')).toEqual('')
    expect(patchResponse('[String!]')).toEqual(null)
    expect(patchResponse('[String!]!')).toEqual([])
    expect(patchResponse('Asdf')).toEqual(null)
    expect(patchResponse('Asdf!')).toEqual(null)
  })
})
