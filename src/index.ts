import { Store, mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import compositionApi, { Ref, computed } from '@vue/composition-api'
import vue, { VueConstructor } from 'vue'

export type VuexStore<R> = Store<R> & {
	_modulesNamespaceMap: Dictionary<{
		_rawModule: {
			state?: Dictionary<any>
			actions?: Dictionary<any>
			mutations?: Dictionary<any>
			getters?: Dictionary<any>
		}
	}>
}
export type Computed<T> = Readonly<Ref<Readonly<T>>>
export type Dictionary<T> = { [k: string]: T }
export type MapToComputed<T = any> = T extends object
	? {
			[K in keyof T]: T[K] extends Function
				? Readonly<Ref<T[K]>>
				: Computed<T[K]>
	  }
	: Dictionary<Computed<any>>

export type FunctionMap<T = any, F = Function> = T extends object
	? {
			[K in keyof T]: T[K]
	  }
	: Dictionary<F>

export type VuexMutation = (payload: any) => void
export type VuexAction = (payload: any) => Promise<any> | any

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

function generateComputedDict<S>(
	mapper: ReturnType<typeof mapState> | ReturnType<typeof mapGetters>,
): MapToComputed<S> {
	return Object.entries(mapper)
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
		) as MapToComputed<S>
}

function generateMethodDict<S, F>(
	mapper: ReturnType<typeof mapActions> | ReturnType<typeof mapMutations>,
): FunctionMap<S, F> {
	return Object.entries(mapper)
		.map(
			([key, value]) =>
				[key, value.bind(_context.getVm())] as [string, Function],
		)
		.reduce(
			(obj, [key, value]) => ((obj[key] = value), obj),
			{} as { [k: string]: any },
		) as FunctionMap<S, F>
}

export function useState<S = any>(namespace: string): MapToComputed<S> {
	validateNamespace(namespace, 'useState')
	if (!_context.state[namespace]) {
		_context.state[namespace] = generateComputedDict(
			mapState(namespace, getModuleKeys(namespace, 'state')),
		)
	}
	return _context.state[namespace]
}

export function useGetters<S = any>(namespace: string): MapToComputed<S> {
	validateNamespace(namespace, 'useGetters')
	if (!_context.getters[namespace]) {
		_context.getters[namespace] = generateComputedDict(
			mapGetters(namespace, getModuleKeys(namespace, 'getters')),
		)
	}
	return _context.getters[namespace]
}

export function useMutations<S = any>(
	namespace: string,
): FunctionMap<S, VuexMutation> {
	validateNamespace(namespace, 'useMutations')
	if (!_context.mutations[namespace]) {
		_context.mutations[namespace] = generateMethodDict<S, VuexMutation>(
			mapMutations(namespace, getModuleKeys(namespace, 'mutations')),
		)
	}
	return _context.mutations[namespace]
}

export function useActions<S = any>(
	namespace: string,
): FunctionMap<S, VuexAction> {
	validateNamespace(namespace, 'useActions')
	if (!_context.actions[namespace]) {
		_context.actions[namespace] = generateMethodDict<S, VuexAction>(
			mapActions(namespace, getModuleKeys(namespace, 'actions')),
		)
	}
	return _context.actions[namespace]
}
