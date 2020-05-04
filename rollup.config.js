import typescript from 'rollup-plugin-typescript2'

const input = 'src/index.ts'
const output = (type) => ({
	output: {
		exports: 'named',
		file: `dist/${type}/index.js`,
		format: type,
		name: 'vuex-hooks',
		sourcemap: true,
	},
})
const plugins = (useDeclaration) => ({
	plugins: typescript({
		useTsconfigDeclarationDir: true,
		tsconfigOverride: {
			compilerOptions: {
				target: 'ESNEXT',
				declaration: useDeclaration,
			},
		},
	}),
})
const external = ['vue', 'vuex', '@vue/composition-api']

export default [
	{
		input,
		external,
		...output('esm'),
        ...plugins(true),
	},
	{
		input,
		external,
		...output('cjs'),
        ...plugins(false),
	},
]
