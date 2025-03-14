import type { Plugin } from 'vite'
import _ from 'lodash'
import { basename } from 'node:path'
import { OutputChunk } from 'rollup'
import { parse } from '@babel/parser'
import _traverse, { NodePath } from '@babel/traverse'
import _generate from '@babel/generator'
import * as t from '@babel/types'
import esbuild from 'esbuild'

import { getManifest } from '../helper'
import { resolveEntries } from '../entries'

const traverse = (_traverse as unknown as { default: typeof _traverse }).default
const generate = (_generate as unknown as { default: typeof _generate }).default

function convertToAsyncFunction(code: string): string {
  // 解析代码生成 AST
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })

  // 遍历 AST，将静态 import 转换为动态 import()
  traverse(ast, {
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      const source = path.node.source.value
      const specifiers = path.node.specifiers

      // 构造动态 import() 调用
      const dynamicImport = t.callExpression(t.import(), [
        t.stringLiteral(source),
      ])

      // 构造解构或默认赋值
      let declaration: t.VariableDeclaration | t.ExpressionStatement
      if (
        specifiers.length === 1 &&
        t.isImportDefaultSpecifier(specifiers[0])
      ) {
        // 默认导入
        declaration = t.variableDeclaration('const', [
          t.variableDeclarator(
            specifiers[0].local,
            t.awaitExpression(dynamicImport),
          ),
        ])
      } else if (specifiers.length > 0) {
        // 命名导入
        const destructuring = t.objectPattern(
          specifiers.map((spec) => {
            if (t.isImportSpecifier(spec)) {
              return t.objectProperty(spec.imported, spec.local, false, true)
            }
            return t.objectProperty(spec.local, spec.local, false, true)
          }),
        )
        declaration = t.variableDeclaration('const', [
          t.variableDeclarator(destructuring, t.awaitExpression(dynamicImport)),
        ])
      } else {
        // 仅 side-effect import
        declaration = t.expressionStatement(t.awaitExpression(dynamicImport))
      }

      path.replaceWith(declaration)
    },
  })

  // 包装成 async IIFE
  const asyncIIFE = t.program([
    t.expressionStatement(
      t.callExpression(
        t.arrowFunctionExpression([], t.blockStatement(ast.program.body), true),
        [],
      ),
    ),
  ])

  // 生成转换后的代码
  const { code: transformedCode } = generate(asyncIIFE)
  return esbuild.transformSync(transformedCode, { minifyWhitespace: true }).code
}

function collectionWebAccessibleResources(
  manifest: chrome.runtime.ManifestV3,
  webResources: Record<string, Set<string>> = {},
): chrome.runtime.ManifestV3['web_accessible_resources'] {
  const resources: chrome.runtime.ManifestV3['web_accessible_resources'] =
    _.cloneDeep(_.get(manifest, 'web_accessible_resources', []))
  Object.entries(webResources).forEach(([key, value]) => {
    const path = key.replace(/\.(js|resources)/, '')
    const matches = _.get(manifest, `${path}.matches`)
    const currentResources = resources.find((d) =>
      _.isEqual(matches, d.matches),
    )
    if (currentResources) {
      const set = new Set(value)
      currentResources.resources.forEach((d) => set.add(d))
      currentResources.resources = Array.from(set)
    } else {
      resources.push({
        matches,
        resources: Array.from(value),
      })
    }
  })
  return resources.filter((d) => d.resources.length)
}

export function createManifestPlugin(): Plugin {
  function transformToAsyncImport(
    chunk: OutputChunk,
    assetMap: Record<string, string>,
  ) {
    const injectCode = `\nfunction getAssetURL(asset) {
  const map = ${JSON.stringify(assetMap)}
  if (map[asset]) {
    return chrome.runtime.getURL(map[asset])
  }
  return chrome.runtime.getURL(asset)
}\n`
    chunk.code = convertToAsyncFunction(`${injectCode}${chunk.code}`)
  }

  return {
    name: 'chrome-extension-manifest-plugin',

    enforce: 'post',

    generateBundle(__, bundle) {
      const manifest = getManifest()
      const entries = resolveEntries()
      const webResources: Record<string, Set<string>> = {}
      const icons: Array<string> = []
      const assetMap: Record<string, string> = {}

      if (process.env.EXTENSION_RELEASE_VERSION) {
        manifest.version = process.env.EXTENSION_RELEASE_VERSION
      }

      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk' && chunk.isEntry) {
          const { facadeModuleId } = chunk
          const entry = entries.find((d) => d.file === facadeModuleId)
          if (entry) {
            assetMap[entry.value] = file
          }
        } else if (chunk.type === 'asset' && !file.includes('.html')) {
          const [assetOriginalName] = chunk.originalFileNames
          if (assetOriginalName) {
            assetMap[assetOriginalName] = file
          }
        }
      }

      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk' && chunk.isEntry) {
          const { facadeModuleId } = chunk
          const entry = entries.find((d) => d.file === facadeModuleId)
          if (entry && manifest) {
            const entryName = facadeModuleId?.endsWith('.html')
              ? basename(facadeModuleId)
              : file
            _.set(manifest, entry.manifestPath, entryName)
            if (
              entry.manifestPath.includes('web_accessible_resources') ||
              entry.manifestPath.includes('content_scripts')
            ) {
              transformToAsyncImport(chunk, assetMap)

              const resourcePath = entry.manifestPath.replace(/\.\d+$/, '')
              const set = webResources[resourcePath] ?? new Set()
              webResources[resourcePath] = set
              const { imports, viteMetadata } = chunk
              imports.forEach((i) => set.add(i))
              viteMetadata?.importedCss?.forEach((d) => set.add(d))
              viteMetadata?.importedAssets?.forEach((d) => set.add(d))
            }
          }
        } else if (chunk.type === 'asset') {
          if (file.startsWith('icons/')) {
            icons.push(file)
          }
          const [assetOriginalName] = chunk.originalFileNames
          const entry = entries.find((d) => d.value === assetOriginalName)
          if (entry && manifest) {
            _.set(manifest, entry.manifestPath, file)
          }
        }
      }

      _.set(
        manifest,
        'web_accessible_resources',
        collectionWebAccessibleResources(manifest, webResources),
      )

      if (icons.length) {
        _.set(
          manifest,
          'icons',
          Object.fromEntries(
            icons.map((icon) => [/_(\d+)\./.exec(icon)?.[1], icon]),
          ),
        )
      }

      this.emitFile({
        fileName: 'manifest.json',
        type: 'asset',
        source: JSON.stringify(manifest, null, 2),
      })
    },
  }
}
