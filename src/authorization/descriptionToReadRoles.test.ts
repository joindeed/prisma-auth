import { descriptionToReadRoles } from './descriptionToReadRoles'
describe('descriptionToReadRoles', () => {
  it('should patch things according to response type', () => {
    expect(descriptionToReadRoles('a sdf djaslk;df ja;sf')).toEqual([])
    expect(descriptionToReadRoles('@Auth(read:[])')).toEqual([])
    expect(descriptionToReadRoles('@Auth(read:[Owner,Admin])')).toEqual(['Owner', 'Admin'])
    expect(descriptionToReadRoles('asfdadf  @Auth(read:[Owner,Admin]) asdfd')).toEqual(['Owner', 'Admin'])
    expect(descriptionToReadRoles('asfdadf  @Auth(   read:    [  Owner,   Admin  ]  ) asdfd')).toEqual([
      'Owner',
      'Admin',
    ])
  })
})
