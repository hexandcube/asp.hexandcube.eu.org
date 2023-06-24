import htmlInsert from 'rollup-plugin-html-insert'
import commonjs from '@rollup/plugin-commonjs'
import static_files from 'rollup-plugin-static-files'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import css from 'rollup-plugin-import-css'
import replace from '@rollup/plugin-replace'
import { readFileSync } from 'fs'
import * as path from 'path'

const pkg = JSON.parse(readFileSync('./package.json'))
const conf = JSON.parse(readFileSync('./config.json'))

export default {
	input: 'src/main.js',
	output: {
		dir: 'dist',
		format: 'iife'
	},
    watch: {
        include: './src/**'
    },
    external: [],
    plugins: [
        {
            name: 'watch-external',
            buildStart() {
                this.addWatchFile(path.resolve('src', 'index.html'))
            }
        },
        replace({
            values: {
                "__configDefaultDomain__": conf.defaultDomain,
                "__buildDate__": () => Date.now(),
                "__buildVersion__": pkg.version
            },
            preventAssignment: true,
            include: ['./src/main.js']
        }),
        static_files({
            include: ['./static']
        }),
        nodePolyfills(),
        css(),
        commonjs(),
        nodeResolve({
            browser: true
        }),
        htmlInsert({
            template: './src/index.html'
        })
    ]
}