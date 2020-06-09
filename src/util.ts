export const NOOP = () => {}
export const UNSUPPORTED = () => ERR('UNSUPPORTED')
export const ERR = (...msgs): any => {
  throw new Error(msgs.join(' '))
}

export const last = arr => arr[arr.length - 1]

export const camelCase = name => name.replace(/\-[a-zA-Z]/g, match => match.slice(1).toUpperCase())
export const kebabCase = name => name.replace(/[A-Z]/g, match => '-' + match.toLowerCase())
export const pascalCase = name => ((name = camelCase(name)), name[0].toUpperCase() + name.slice(1))

export const applyMixin = (targetClass, mixinClass) => {
  Object.getOwnPropertyNames(mixinClass).forEach(name => {
    if (name !== 'prototype') {
      Object.defineProperty(targetClass, name, Object.getOwnPropertyDescriptor(mixinClass, name)!)
    }
  })

  Object.getOwnPropertyNames(mixinClass.prototype).forEach(name => {
    if (name !== 'constructor') {
      Object.defineProperty(targetClass.prototype, name, Object.getOwnPropertyDescriptor(mixinClass.prototype, name)!)
    }
  })
}