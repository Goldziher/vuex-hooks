import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

const input = 'src/index.ts'
const output = (type) => ({
	output: {
		exports: 'named',
		file: type === 'umd' ? 'dist/umd/index.min.js' : `dist/${type}/index.js`,
		format: type,
		name: 'vuex-hooks',
		sourcemap: true,
		globals: {
			'vue': 'Vue',
			'@vue/composition-api': 'vueCompositionApi',
			'vuex': 'vuex',
		},
	},
})
const external = ['vue', 'vuex', '@vue/composition-api']
const plugins = [
	typescript({
		useTsconfigDeclarationDir: false,
	}),
	terser(),
]

export default [
	{
		input,
		external,
		...output('esm'),
		plugins,
	},
	{
		input,
		external,
		...output('cjs'),
		plugins,
	},
	{
		input,
		external,
		...output('umd'),
		plugins,
	},
]
