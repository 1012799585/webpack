import moment from 'moment'

export function formatTime(date, pattern) {
  return moment(date).format(pattern)
}

export function treeToList(tree = [], idValue = null, childrenField = 'children', idField = 'id', parentIdField = 'parentId') {
  const list = []
  if (!childrenField) childrenField = 'children'
  for (let i = 0, j = tree.length; i < j; i++) {
    const d = tree[i]
    const id = d[idField]
    if (!list.some(l => l[idField] === id)) {
      list.push(d)
    }
    if (parentIdField) d[parentIdField] = idValue
    const children = d[childrenField]
    if (children && children.length > 0) {
      const items = treeToList(children, id, childrenField, idField, parentIdField)
      const values = items.values()
      for (const v of values) {
        if (!list.some(l => l[idField] === v[idField])) {
          list.push(v)
        }
      }
    }
  }
  return list
}

export function listToTree(list = [], root = null, idField = 'id', parentIdField = 'parentId') {
  const tree = []
  const hash = {}
  const childrenField = 'children'
  for (let i = 0, l = list.length; i < l; i++) {
    const d = list[i]
    hash[d[idField]] = d
  }

  for (let i = 0, l = list.length; i < l; i++) {
    const d = list[i]
    const parentID = d[parentIdField]
    if (parentID === '' || parentID === 0) {
      tree.push(d)
      continue
    }

    const parent = hash[parentID]
    if (!parent) {
      tree.push(d)
      continue
    }

    let children = parent[childrenField]
    if (!children) {
      children = []
      parent[childrenField] = children
    }
    children.push(d)
  }

  if (root) {
    root[childrenField] = tree
    return [root]
  }

  return tree
}

export function getListParents(list = [], idValue, idField = 'id', parentIdField = 'parentId', includeSelf = false) {
  const parents = []
  const self = list.find(o => o[idField] === idValue)
  if (!self) {
    return parents
  }

  if (includeSelf) {
    parents.unshift(self)
  }

  let parent = list.find(o => o[idField] === self[parentIdField])
  while (parent && parent[idField] > 0) {
    parents.unshift(parent)
    parent = list.find(o => o[idField] === parent[parentIdField])
  }
  return parents
}

export function getTreeParents(tree = [], idValue, childrenField = 'children', idField = 'id', parentIdField = 'parentId', parentIdValue = 0) {
  const list = treeToList(tree, parentIdValue, childrenField, idField, parentIdField)
  return getListParents(list, idValue, idField, parentIdField)
}

export function getTreeParentsWithSelf(tree = [], idValue, childrenField = 'children', idField = 'id', parentIdField = 'parentId', parentIdValue = 0) {
  const list = treeToList(tree, parentIdValue, childrenField, idField, parentIdField)
  return getListParents(list, idValue, idField, parentIdField, true)
}
/* eslint-disable no-nested-ternary */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/**
 * num 小于0，左缩进num*2个空格； 大于0，右缩进num*2个空格。
 * @param {string} str 代码
 * @param {number} num 缩进次数
 * @param {number} len 【可选】缩进单位，空格数
 */
export function indent(str, num, len = 2) {
  if (num === 0) return str
  const isLeft = num < 0; const result = []; let reg; let
    spaces = ''
  if (isLeft) {
    num *= -1
    reg = new RegExp(`(^\\s{0,${num * len}})`, 'g')
  } else {
    for (let i = 0; i < num * len; i++) spaces += ' '
  }

  str.split('\n').forEach(line => {
    line = isLeft ? line.replace(reg, '') : spaces + line
    result.push(line)
  })
  return result.join('\n')
}

// 首字母大小
export function titleCase(str) {
  return str.replace(/( |^)[a-z]/g, L => L.toUpperCase())
}

// 下划转驼峰
export function camelCase(str) {
  return str.replace(/-[a-z]/g, str1 => str1.substr(-1).toUpperCase())
}

export function isNumberStr(str) {
  return /^[+-]?(0|([1-9]\d*))(\.\d+)?$/g.test(str)
}

export const exportDefault = 'export default '

export const beautifierConf = {
  html: {
    indent_size: '2',
    indent_char: ' ',
    max_preserve_newlines: '-1',
    preserve_newlines: false,
    keep_array_indentation: false,
    break_chained_methods: false,
    indent_scripts: 'separate',
    brace_style: 'end-expand',
    space_before_conditional: true,
    unescape_strings: false,
    jslint_happy: false,
    end_with_newline: true,
    wrap_line_length: '110',
    indent_inner_html: true,
    comma_first: false,
    e4x: true,
    indent_empty_lines: true
  },
  js: {
    indent_size: '2',
    indent_char: ' ',
    max_preserve_newlines: '-1',
    preserve_newlines: false,
    keep_array_indentation: false,
    break_chained_methods: false,
    indent_scripts: 'normal',
    brace_style: 'end-expand',
    space_before_conditional: true,
    unescape_strings: false,
    jslint_happy: true,
    end_with_newline: true,
    wrap_line_length: '110',
    indent_inner_html: true,
    comma_first: false,
    e4x: true,
    indent_empty_lines: true
  }
}

function stringify(obj) {
  return JSON.stringify(obj, (key, val) => {
    if (typeof val === 'function') {
      return `${val}`
    }
    return val
  })
}

function parse(str) {
  JSON.parse(str, (k, v) => {
    if (v.indexOf && v.indexOf('function') > -1) {
      return eval(`(${v})`)
    }
    return v
  })
}

export function jsonClone(obj) {
  return parse(stringify(obj))
}

// 深拷贝对象
export function deepClone(obj) {
  const _toString = Object.prototype.toString

  // null, undefined, non-object, function
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  // DOM Node
  if (obj.nodeType && 'cloneNode' in obj) {
    return obj.cloneNode(true)
  }

  // Date
  if (_toString.call(obj) === '[object Date]') {
    return new Date(obj.getTime())
  }

  // RegExp
  if (_toString.call(obj) === '[object RegExp]') {
    const flags = []
    if (obj.global) { flags.push('g') }
    if (obj.multiline) { flags.push('m') }
    if (obj.ignoreCase) { flags.push('i') }

    return new RegExp(obj.source, flags.join(''))
  }

  const result = Array.isArray(obj) ? [] : obj.constructor ? new obj.constructor() : {}

  for (const key in obj) {
    result[key] = deepClone(obj[key])
  }

  return result
}
