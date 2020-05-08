import {
	ActionContext,
	Store,
	mapActions,
	mapGetters,
	mapMutations,
	mapState,
} from 'vuex'
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
export type StateMap<T = any> = T extends object
	? {
			[K in keyof T]: T[K] extends Function
				? Readonly<Ref<T[K]>>
				: Computed<T[K]>
	  }
	: Dictionary<Computed<any>>

export type GetterMap<T = any> = T extends object
	? {
			[K in keyof T]: T[K] extends (...args: any) => infer R
				? R extends Function
					? Readonly<Ref<R>>
					: Readonly<Ref<T[K]>>
				: Computed<T[K]>
	  }
	: Dictionary<Computed<any>>

export type ActionMap<T = any> = T extends object
	? {
			[K in keyof T]: T[K] extends (
				ctx: ActionContext<any, any>,
				...payload: infer P
			) => infer R
				? (...payload: P) => R
				: T[K]
	  }
	: Dictionary<(payload: any) => Promise<any> | any>

export type MutationMap<T = any> = T extends object
	? {
			[K in keyof T]: T[K] extends (state: any, ...payload: infer P) => infer R
				? (...payload: P) => R
				: T[K]
	  }
	: Dictionary<(payload: any) => void>

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

const reduceToDict = (inputArr: [string, any][]): Dictionary<any> =>
	inputArr.reduce(
		(obj, [key, value]) => ((obj[key] = value), obj),
		{} as { [k: string]: any },
	)

function generateComputedDict<R>(
	mapper: ReturnType<typeof mapState> | ReturnType<typeof mapGetters>,
): R {
	return reduceToDict(
		Object.entries(mapper).map(([key, value]) => [
			key,
			computed(() => value.call(_context.getVm())),
		]),
	) as R
}

function generateMethodDict<R>(
	mapper: ReturnType<typeof mapActions> | ReturnType<typeof mapMutations>,
): R {
	return reduceToDict(
		Object.entries(mapper).map(([key, value]) => [
			key,
			value.bind(_context.getVm()),
		]),
	) as R
}

export function useState<S = any>(namespace: string): StateMap<S> {
	validateNamespace(namespace, 'useState')
	if (!_context.state[namespace]) {
		_context.state[namespace] = generateComputedDict(
			mapState(namespace, getModuleKeys(namespace, 'state')),
		)
	}
	return _context.state[namespace]
}

export function useGetters<S = any>(namespace: string): GetterMap<S> {
	validateNamespace(namespace, 'useGetters')
	if (!_context.getters[namespace]) {
		_context.getters[namespace] = generateComputedDict<GetterMap<S>>(
			mapGetters(namespace, getModuleKeys(namespace, 'getters')),
		)
	}
	return _context.getters[namespace]
}

export function useMutations<S = any>(namespace: string): MutationMap<S> {
	validateNamespace(namespace, 'useMutations')
	if (!_context.mutations[namespace]) {
		_context.mutations[namespace] = generateMethodDict<MutationMap<S>>(
			mapMutations(namespace, getModuleKeys(namespace, 'mutations')),
		)
	}
	return _context.mutations[namespace]
}

export function useActions<S = any>(namespace: string): ActionMap<S> {
	validateNamespace(namespace, 'useActions')
	if (!_context.actions[namespace]) {
		_context.actions[namespace] = generateMethodDict<ActionMap<S>>(
			mapActions(namespace, getModuleKeys(namespace, 'actions')),
		)
	}
	return _context.actions[namespace]
}
