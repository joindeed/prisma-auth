import { descriptionToRoles } from './descriptionToRoles'

describe('descriptionToRoles', () => {
  it('simple roles', () => {
    expect(descriptionToRoles('a sdf djaslk;df ja;sf')).toEqual(null)
    expect(descriptionToRoles('@Auth(read:[])')).toEqual({ read: [] })
    expect(descriptionToRoles('@Auth(read:[Owner,Admin])')).toEqual({
      read: [
        { name: 'Owner', args: null },
        { name: 'Admin', args: null },
      ],
    })
    expect(descriptionToRoles('@Auth(read:[Owner,Admin]) asdfd')).toEqual({
      read: [
        { name: 'Owner', args: null },
        { name: 'Admin', args: null },
      ],
    })
    expect(descriptionToRoles('@Auth(   read:    [  Owner,   Admin  ]  ) asdfd')).toEqual({
      read: [
        { name: 'Owner', args: null },
        { name: 'Admin', args: null },
      ],
    })
  })

  it('roles with args', () => {
    expect(
      descriptionToRoles('@Auth(read:[ User(privileges:[featureA:something],type:some-type:something,approved:true) ])')
    ).toEqual({
      read: [
        {
          name: 'User',
          args: {
            privileges: ['featureA:something'],
            type: 'some-type:something',
            approved: 'true',
          },
        },
      ],
    })
  })
  // @TODO: figure out how to support short syntax
  // it('roles with default args', () => {
  //   expect(descriptionToRoles('@Auth(read: [ User([featureA]) ] )')).toEqual({
  //     read: [
  //       {
  //         name: 'User',
  //         args: {
  //           _default: ['featureA'],
  //         },
  //       },
  //     ],
  //   })
  // })
})
