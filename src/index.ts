import { Store } from 'vuex'
import compositionApi from '@vue/composition-api'
import vue, { VueConstructor } from 'vue'
import {
	Dictionary,
	StateMap,
	GetterMap,
	MutationMap,
	ActionMap,
} from './types'
import {
	validateNamespace,
	generateComputedDict,
	generateMethodDict,
} from './utils'

vue.use(compositionApi)

const _context: {
	$vm: {
		value: Vue | null
		get: () => Vue
		set: (vm: Vue) => void
	}
	state: Dictionary
	actions: Dictionary
	mutations: Dictionary
	getters: Dictionary
} = {
	$vm: {
		value: null,
		set(vm: Vue): void {
			this.value = vm
		},
		get(): Vue {
			if (!this.value) {
				throw new Error(
					'[vuex-hooks] vue instance is undefined, Vue.use must be called before using the plugin',
				)
			}
			return this.value
		},
	},
	state: {},
	actions: {},
	mutations: {},
	getters: {},
}

export default function (vc: VueConstructor): void {
	vc.mixin({
		beforeCreate: function (this: Vue): void {
			if (typeof this.$options.setup === 'function' && !_context.$vm.value)
				_context.$vm.set(this)
		},
	})
}

export function useStore<RootState = any>(): Store<RootState> {
	const vm = _context.$vm.get()
	return vm.$store as Store<RootState>
}

export function useState<T = any>(namespace: string): StateMap<T> {
	validateNamespace(namespace, 'useState')
	if (!_context.state[namespace]) {
		_context.state[namespace] = generateComputedDict(
			_context.$vm.get(),
			namespace,
			'state',
		)
	}
	return _context.state[namespace]
}

export function useGetters<T = any>(namespace: string): GetterMap<T> {
	validateNamespace(namespace, 'useGetters')
	if (!_context.getters[namespace]) {
		_context.getters[namespace] = generateComputedDict(
			_context.$vm.get(),
			namespace,
			'getters',
		)
	}
	return _context.getters[namespace]
}

export function useMutations<T = any>(namespace: string): MutationMap<T> {
	validateNamespace(namespace, 'useMutations')
	if (!_context.mutations[namespace]) {
		_context.mutations[namespace] = generateMethodDict(
			_context.$vm.get(),
			namespace,
			'mutations',
		)
	}
	return _context.mutations[namespace]
}

export function useActions<T = any>(namespace: string): ActionMap<T> {
	validateNamespace(namespace, 'useActions')
	if (!_context.actions[namespace]) {
		_context.actions[namespace] = generateMethodDict(
			_context.$vm.get(),
			namespace,
			'actions',
		)
	}
	return _context.actions[namespace]
}
