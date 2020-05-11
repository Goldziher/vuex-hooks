import { Store } from 'vuex'
import compositionApi from '@vue/composition-api'
import vue, { VueConstructor } from 'vue'
import {
	Dictionary,
	StateMap,
	GetterMap,
	MutationMap,
	ActionMap,
	ModuleKey,
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

function mapFromStore<R>(type: ModuleKey, namespace: string): R {
	validateNamespace(namespace, type)
	if (!_context[type][namespace]) {
		_context[type][namespace] =
			type === 'state' || type === 'getters'
				? generateComputedDict(_context.$vm.get(), namespace, type)
				: generateMethodDict(_context.$vm.get(), namespace, type)
	}
	return _context[type][namespace] as R
}

export function useState<T = any>(namespace: string): StateMap<T> {
	return mapFromStore<StateMap<T>>('state', namespace)
}

export function useGetters<T = any>(namespace: string): GetterMap<T> {
	return mapFromStore<GetterMap<T>>('getters', namespace)
}

export function useMutations<T = any>(namespace: string): MutationMap<T> {
	return mapFromStore<MutationMap<T>>('mutations', namespace)
}

export function useActions<T = any>(namespace: string): ActionMap<T> {
	return mapFromStore<ActionMap<T>>('actions', namespace)
}
