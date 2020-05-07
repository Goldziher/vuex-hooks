import typescript from 'rollup-plugin-typescript2'
import { uglify } from 'rollup-plugin-uglify'

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

export default [
	{
		input,
		external,
		...output('esm'),
		plugins: [
			typescript({
				useTsconfigDeclarationDir: false,
			}),
		],
	},
	{
		input,
		external,
		...output('cjs'),
		plugins: [
			typescript({
				useTsconfigDeclarationDir: false,
			}),
		],
	},
	{
		input,
		external,
		...output('umd'),
		plugins: [
			typescript({
				useTsconfigDeclarationDir: false,
			}),
			uglify(),
		],
	},
]
