import { PrismaSelect } from './select'

describe('PrismaSelect.mergeDeep', () => {
  describe('prototype pollution protection', () => {
    it('should not pollute Object.prototype via __proto__', () => {
      const target = {}
      const source = JSON.parse('{"__proto__": {"polluted": true}}')

      PrismaSelect.mergeDeep(target, source)

      // This should NOT be polluted
      expect(({} as any).polluted).toBeUndefined()
      expect(Object.prototype.hasOwnProperty('polluted')).toBe(false)
    })

    it('should not pollute Object.prototype via constructor', () => {
      const target = {}
      const source = { constructor: { prototype: { polluted: true } } }

      PrismaSelect.mergeDeep(target, source)

      // This should NOT be polluted
      expect(({} as any).polluted).toBeUndefined()
      expect(Object.prototype.hasOwnProperty('polluted')).toBe(false)
    })

    it('should not pollute Object.prototype via prototype', () => {
      const target = {}
      const source = { prototype: { polluted: true } }

      PrismaSelect.mergeDeep(target, source)

      // This should NOT be polluted via prototype chain
      const testObj: any = {}
      expect(testObj.polluted).toBeUndefined()
    })

    it('should block __proto__ key explicitly', () => {
      const target = {}
      const source = { __proto__: { evil: true } }

      const result = PrismaSelect.mergeDeep(target, source)

      // The __proto__ property should not have been merged (result should not have 'evil' property)
      expect((result as any).evil).toBeUndefined()
      expect(result.hasOwnProperty('__proto__')).toBe(false)
    })

    it('should block constructor key', () => {
      const target = {}
      const source = { constructor: { evil: true } }

      const result = PrismaSelect.mergeDeep(target, source)

      // constructor should not be merged
      expect((result as any).constructor.evil).toBeUndefined()
    })

    it('should block prototype key', () => {
      const target = {}
      const source = { prototype: { evil: true } }

      const result = PrismaSelect.mergeDeep(target, source)

      // prototype should not be merged
      expect(result.hasOwnProperty('prototype')).toBe(false)
    })
  })

  describe('normal merging behavior', () => {
    it('should merge simple objects', () => {
      const target = { a: 1 }
      const source = { b: 2 }

      const result = PrismaSelect.mergeDeep(target, source)

      expect(result).toEqual({ a: 1, b: 2 })
    })

    it('should merge nested objects', () => {
      const target = { a: { b: 1 } }
      const source = { a: { c: 2 } }

      const result = PrismaSelect.mergeDeep(target, source)

      expect(result).toEqual({ a: { b: 1, c: 2 } })
    })

    it('should handle multiple sources', () => {
      const target = { a: 1 }
      const source1 = { b: 2 }
      const source2 = { c: 3 }

      const result = PrismaSelect.mergeDeep(target, source1, source2)

      expect(result).toEqual({ a: 1, b: 2, c: 3 })
    })

    it('should handle deep nested objects', () => {
      const target = { select: { id: true } }
      const source = { select: { name: true, posts: { select: { title: true } } } }

      const result = PrismaSelect.mergeDeep(target, source)

      expect(result).toEqual({
        select: {
          id: true,
          name: true,
          posts: { select: { title: true } },
        },
      })
    })

    it('should override primitive values', () => {
      const target = { a: 1 }
      const source = { a: 2 }

      const result = PrismaSelect.mergeDeep(target, source)

      expect(result).toEqual({ a: 2 })
    })

    it('should handle empty sources', () => {
      const target = { a: 1 }

      const result = PrismaSelect.mergeDeep(target)

      expect(result).toEqual({ a: 1 })
    })
  })
})
