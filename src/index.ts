import { mapActions, mapGetters, mapMutations, mapState, Store } from 'vuex'
import compositionApi, { computed } from '@vue/composition-api'
import vue, { VueConstructor } from 'vue'
import {
	Dictionary,
	VuexStore,
	MapToComputed,
	FunctionMap,
	VuexAction,
	VuexMutation,
	Computed,
} from './types'

vue.use(compositionApi)

const _context: {
	$vm: Vue | null
	getVm: () => Vue
	state: Dictionary<any>
	actions: Dictionary<any>
	mutations: Dictionary<any>
	getters: Dictionary<any>
} = {
	$vm: null,
	getVm(): Vue {
		if (!this.$vm) {
			throw new Error(
				'[vuex-hooks] vue instance is undefined, Vue.use must be called before using the plugin',
			)
		}
		return this.$vm
	},
	state: {},
	actions: {},
	mutations: {},
	getters: {},
}

export default function (vc: VueConstructor): void {
	vc.mixin({
		beforeCreate: function (this: Vue): void {
			if (typeof this.$options.setup === 'function' && !_context.$vm)
				_context.$vm = this
		},
	})
}

export function useStore<R = any>(): Store<R> {
	const vm = _context.getVm()
	return vm.$store as Store<R>
}

const validateNamespace = (namespace: any, helper: string): void => {
	if (typeof namespace !== 'string') {
		throw new Error(
			`[vuex-hooks] invalid namespace type, expected string got ${typeof namespace}`,
		)
	} else if (!namespace.trim()) {
		throw new Error(`[vuex-hooks] ${helper} called with invalid namespace`)
	}
}

const getModuleKeys = (
	namespace: string,
	type: 'state' | 'mutations' | 'actions' | 'getters',
): string[] => {
	const store = _context.getVm().$store as VuexStore<any>
	const module =
		store._modulesNamespaceMap[
			!namespace.endsWith('/') ? `${namespace}/` : namespace
		]
	if (!module) {
		throw new Error(`[vuex-hooks] module ${namespace} not found`)
	}

	const subModule = module._rawModule[type]
	if (!subModule) {
		throw new Error(`[vuex-hooks] ${type} not found for module ${namespace}`)
	}

	return Object.keys(subModule)
}

export function useState<S = any>(namespace: string): MapToComputed<S> {
	validateNamespace(namespace, 'useState')
	if (!_context.state[namespace]) {
		_context.state[namespace] = Object.entries(
			mapState(namespace, getModuleKeys(namespace, 'state')),
		)
			.map(
				([key, value]) =>
					[key, computed(() => value.call(_context.getVm()))] as [
						string,
						Computed<any>,
					],
			)
			.reduce(
				(obj, [key, value]) => ((obj[key] = value), obj),
				{} as { [k: string]: Computed<any> },
			)
	}
	return _context.state[namespace] as MapToComputed<S>
}

export function useGetters<S = any>(namespace: string): MapToComputed<S> {
	validateNamespace(namespace, 'useGetters')
	if (!_context.getters[namespace]) {
		_context.getters[namespace] = Object.entries(
			mapGetters(namespace, getModuleKeys(namespace, 'getters')),
		)
			.map(
				([key, value]) =>
					[key, computed(() => value.call(_context.getVm()))] as [
						string,
						Computed<any>,
					],
			)
			.reduce(
				(obj, [key, value]) => ((obj[key] = value), obj),
				{} as { [k: string]: Computed<any> },
			)
	}
	return _context.getters[namespace] as MapToComputed<S>
}

export function useMutations<S = any>(
	namespace: string,
): FunctionMap<S, VuexMutation> {
	validateNamespace(namespace, 'useMutations')
	if (!_context.mutations[namespace]) {
		_context.mutations[namespace] = Object.entries(
			mapMutations(namespace, getModuleKeys(namespace, 'mutations')),
		)
			.map(
				([key, value]) =>
					[key, value.bind(_context.getVm())] as [string, Function],
			)
			.reduce(
				(obj, [key, value]) => ((obj[key] = value), obj),
				{} as { [k: string]: Function },
			)
	}
	return _context.mutations[namespace] as FunctionMap<S, VuexMutation>
}

export function useActions<S = any>(
	namespace: string,
): FunctionMap<S, VuexAction> {
	validateNamespace(namespace, 'useActions')
	if (!_context.actions[namespace]) {
		_context.actions[namespace] = Object.entries(
			mapActions(namespace, getModuleKeys(namespace, 'actions')),
		)
			.map(
				([key, value]) =>
					[key, value.bind(_context.getVm())] as [string, Function],
			)
			.reduce(
				(obj, [key, value]) => ((obj[key] = value), obj),
				{} as { [k: string]: Function },
			)
	}
	return _context.actions[namespace] as FunctionMap<S, VuexAction>
}
