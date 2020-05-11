import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { computed } from '@vue/composition-api'
import { VuexStore, Dictionary, ModuleKey } from './types'

const getModuleKeys = (
	vm: Vue,
	namespace: string,
	type: ModuleKey,
): string[] => {
	const store = vm.$store as VuexStore<any>
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

const reduceToDict = (inputArr: [string, any][]): Dictionary =>
	inputArr.reduce(
		(obj, [key, value]) => ((obj[key] = value), obj),
		{} as { [k: string]: any },
	)

export function generateComputedDict(
	vm: Vue,
	namespace: string,
	type: 'state' | 'getters',
): Dictionary {
	const map = getModuleKeys(vm, namespace, type)
	return reduceToDict(
		Object.entries(
			type === 'state' ? mapState(namespace, map) : mapGetters(namespace, map),
		).map(([key, value]) => [key, computed(() => value.call(vm))]),
	)
}

export function generateMethodDict(
	vm: Vue,
	namespace: string,
	type: 'actions' | 'mutations',
): Dictionary {
	const map = getModuleKeys(vm, namespace, type)
	return reduceToDict(
		Object.entries(
			type === 'actions'
				? mapActions(namespace, map)
				: mapMutations(namespace, map),
		).map(([key, value]) => [key, value.bind(vm)]),
	)
}

export function validateNamespace(namespace: any, type: ModuleKey): void {
	const HELPER_NAMES = {
		state: 'useState',
		getters: 'useGetters',
		actions: 'useActions',
		mutations: 'useMutations',
	}
	if (typeof namespace !== 'string' || !namespace.trim()) {
		throw new Error(
			`[vuex-hooks] ${HELPER_NAMES[type]} called with invalid namespace`,
		)
	}
}
