module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: './tsconfig.json',
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'prettier',
		'prettier/@typescript-eslint',
	],
	rules: {
		'@typescript-eslint/no-explicit-any': 0,
		'@typescript-eslint/ban-ts-ignore': 0,
	},
}
