#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const options = new Map()
for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index]
  if (!['--frontend', '--openapi', '--output'].includes(flag) || !process.argv[index + 1]) {
    throw new Error('Usage: audit-frontend-requests.mjs --frontend PATH --openapi PATH [--output PATH]')
  }
  options.set(flag, process.argv[index + 1])
}
if (!options.has('--frontend') || !options.has('--openapi')) throw new Error('Frontend and OpenAPI paths are required')
const root = path.resolve(options.get('--frontend'))
const require = createRequire(path.join(root, 'package.json'))
const ts = require('typescript')
const { parse: parseSfc } = require('@vue/compiler-sfc')
const { baseParse } = require('@vue/compiler-dom')
const contract = JSON.parse(await fs.readFile(options.get('--openapi'), 'utf8'))
const operations = Object.entries(contract.paths).flatMap(([route, item]) => Object.entries(item)
  .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method))
  .map(([method, operation]) => ({ path: route, method: method.toUpperCase(), operationId: operation.operationId,
    permission: operation['x-ems-permission'] ?? null, owner: operation['x-ems-owner'] ?? null,
    status: operation['x-ems-status'] ?? null, parameters: [...(contract.paths[route].parameters ?? []), ...(operation.parameters ?? [])] })))
const files = []
async function collect(directory) {
  for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path.join(directory, entry.name)
    if (entry.isDirectory() && !['__tests__', 'node_modules'].includes(entry.name)) await collect(name)
    else if (entry.isFile() && /\.(ts|vue)$/.test(name) && !/\.d\.ts$|\.(spec|test)\.ts$/.test(name)) files.push(name)
  }
}
await collect(path.join(root, 'src'))
const calls = []
const producers = []
const diagnostics = []
const methods = new Map(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'postForm', 'putForm', 'patchForm', 'request']
  .map(method => [method, method.replace('Form', '').toUpperCase()]))
function property(object, name) {
  return object && ts.isObjectLiteralExpression(object) ? object.properties.find(item => ts.isPropertyAssignment(item)
    && (ts.isIdentifier(item.name) || ts.isStringLiteral(item.name)) && item.name.text === name)?.initializer : undefined
}
function literal(node) { return node && ts.isStringLiteralLike(node) ? node.text : null }
function endpoint(node, source) {
  if (!node) return { expression: '', literal: null, pattern: null }
  const exact = literal(node)
  return { expression: node.getText(source), literal: exact,
    pattern: exact ?? (ts.isTemplateExpression(node) ? node.head.text + node.templateSpans.map(span => '{dynamic}' + span.literal.text).join('') : null) }
}
function normalize(value) {
  if (!value || /^(?:https?:|data:|blob:)/.test(value)) return null
  return '/' + value.replace(/^\/?api\/v1\//, '').replace(/^\//, '').split('?')[0]
}
function candidates(endpoint, method) {
  const normalized = normalize(endpoint)
  if (!normalized || method === 'UNRESOLVED') return []
  const segments = normalized.slice(1).split('/')
  return operations.filter(operation => {
    if (operation.method !== method) return false
    const parts = operation.path.slice(1).split('/')
    return parts.length === segments.length && parts.every((part, index) => {
      const value = segments[index]
      if (value === '{dynamic}') return true
      const parameter = /^\{([^}]+)\}$/.exec(part)
      if (!parameter) return part === value
      const schema = operation.parameters.find(item => item.in === 'path' && item.name === parameter[1])?.schema
      return !schema?.enum || schema.enum.map(String).includes(value)
    })
  })
}
for (const file of files) {
  const text = await fs.readFile(file, 'utf8')
  const relative = path.relative(root, file)
  let blocks = [{ content: text, offset: 0 }]
  if (file.endsWith('.vue')) {
    const parsed = parseSfc(text, { filename: file })
    diagnostics.push(...parsed.errors.map(error => ({ file: relative, error: String(error) })))
    blocks = [parsed.descriptor.script, parsed.descriptor.scriptSetup].filter(Boolean)
      .map(block => ({ content: block.content, offset: block.loc.start.offset }))
    const template = parsed.descriptor.template
    if (template) {
      let templateAst
      try {
        templateAst = baseParse(template.content)
      } catch (error) {
        diagnostics.push({ file: relative, error: String(error) })
      }
      function walkTemplate(node) {
        if (node.type === 1) {
          for (const prop of node.props) {
            const argument = prop.type === 7 ? prop.arg?.content : prop.name
            if (argument === 'apipath' || (prop.type === 7 && prop.name === 'bind' && !prop.arg
              && /(?:CardListView|CardSlideView)/.test(node.tag))) {
              producers.push({ file: relative, line: template.loc.start.line + prop.loc.start.line - 1,
                component: node.tag, property: argument ?? 'v-bind', expression: prop.type === 7 ? prop.exp?.content ?? '' : prop.value?.content ?? '',
                static: prop.type === 6, ownership: 'requires-current-dataflow-and-producer-contract' })
            }
          }
        }
        for (const child of node.children ?? []) walkTemplate(child)
        for (const branch of node.branches ?? []) walkTemplate(branch)
      }
      if (templateAst) walkTemplate(templateAst)
    }
  }
  for (const block of blocks) {
    const source = ts.createSourceFile(file, block.content, ts.ScriptTarget.Latest, true)
    diagnostics.push(...source.parseDiagnostics.map(item => ({ file: relative,
      error: ts.flattenDiagnosticMessageText(item.messageText, '\n') })))
    const host = ts.createCompilerHost({ noLib: true, noResolve: true })
    host.getSourceFile = name => name === file ? source : undefined
    const checker = ts.createProgram([file], { noLib: true, noResolve: true, allowNonTsExtensions: true }, host).getTypeChecker()
    const clients = new Map()
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
      const module = statement.moduleSpecifier.text
      const resolved = module.startsWith('.') ? path.resolve(path.dirname(file), module) : null
      const isApi = module === '@/api' || module === '@/api/index' || resolved === path.join(root, 'src/api/index')
      if (!isApi) continue
      if (statement.importClause?.name) clients.set(checker.getSymbolAtLocation(statement.importClause.name), 'envelope')
      const bindings = statement.importClause?.namedBindings
      if (bindings && ts.isNamedImports(bindings)) for (const specifier of bindings.elements) {
        const imported = specifier.propertyName?.text ?? specifier.name.text
        if (['api', 'pluginApi'].includes(imported)) clients.set(checker.getSymbolAtLocation(specifier.name), imported === 'pluginApi' ? 'direct' : 'envelope')
      }
    }
    function record(node, transport, client, method, target, args, responseContract) {
      const location = { file: relative, line: text.slice(0, block.offset + node.getStart(source)).split('\n').length }
      const declaration = target && ts.isIdentifier(target) ? checker.getSymbolAtLocation(target)?.valueDeclaration : undefined
      const resolved = declaration && ts.isVariableDeclaration(declaration)
        && (declaration.parent.flags & ts.NodeFlags.Const) && literal(declaration.initializer) !== null ? declaration.initializer : undefined
      const url = endpoint(resolved ?? target, source)
      if (resolved) url.expression = target.getText(source)
      const matches = candidates(url.pattern, method)
      const asset = transport === 'fetch' && url.literal && /^(?:https?:|data:|blob:)/.test(url.literal)
      calls.push({ ...location, transport, client, method, ...url, arguments: args.map(item => item.getText(source)),
        responseContract, candidates: matches, classification: asset ? 'external-resource-review-required'
          : url.literal && matches.length ? 'exact-operation-candidate'
          : matches.length ? 'dynamic-operation-candidate' : url.pattern ? 'missing-declared-contract' : 'unresolved',
        ownership: asset ? 'external-origin-and-content-security-review-required' : 'DTO-admission-error-and-mutation-review-required' })
    }
    function visit(node) {
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression)
        && ['EventSource', 'WebSocket', 'SSEManager'].includes(node.expression.text)) {
        record(node, node.expression.text, node.expression.text, 'GET', node.arguments?.[0], [...node.arguments ?? []], 'stream')
      } else if (ts.isCallExpression(node)) {
        const target = node.expression
        const args = [...node.arguments]
        if (ts.isIdentifier(target) && target.text === 'fetch') {
          const options = args[1]
          const specified = property(options, 'method')
          const method = literal(specified)?.toUpperCase() ?? (!options || ts.isObjectLiteralExpression(options)
            && !specified && !options.properties.some(ts.isSpreadAssignment) ? 'GET' : 'UNRESOLVED')
          record(node, 'fetch', 'fetch', method, args[0], args, 'raw')
        } else {
          const callable = ts.isIdentifier(target) && clients.has(checker.getSymbolAtLocation(target))
          const member = ts.isPropertyAccessExpression(target) && ts.isIdentifier(target.expression)
            && clients.has(checker.getSymbolAtLocation(target.expression)) && methods.has(target.name.text)
          if (callable || member) {
            const client = callable ? target.text : target.expression.text
            let method = member ? methods.get(target.name.text) : 'REQUEST'
            let url = args[0]
            if (method === 'REQUEST') {
              const config = ts.isObjectLiteralExpression(args[0]) ? args[0] : args[1]
              const declared = property(config, 'method')
              method = literal(declared)?.toUpperCase() ?? (!config || ts.isObjectLiteralExpression(config)
                && !declared && !config.properties.some(ts.isSpreadAssignment) ? 'GET' : 'UNRESOLVED')
              if (config === args[0]) url = property(config, 'url')
            }
            record(node, 'axios', client, method, url, args, clients.get(checker.getSymbolAtLocation(callable ? target : target.expression)))
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
}
const summary = Object.fromEntries([...new Set(calls.map(call => call.classification))].map(key => [key, calls.filter(call => call.classification === key).length]))
const result = { schemaVersion: 1, frontendRoot: root, openapi: path.resolve(options.get('--openapi')), files: files.length,
  summary, diagnostics, calls, propProducers: producers,
  limitations: ['URL candidates are not accepted contracts.', 'Opaque runtime source registries, wrapper-generated paths and aliases assigned after imports require explicit dataflow review.',
    'Template prop producers are recorded, not guessed into resolved URLs.', 'No historical expression inference is reused.'] }
if (options.has('--output')) await fs.writeFile(options.get('--output'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ files: result.files, calls: calls.length, nativeStreams: calls.filter(call => call.responseContract === 'stream').length,
  propProducers: producers.length, diagnostics, summary }, null, 2))
if (diagnostics.length) process.exitCode = 1
