import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { computed } from '@vue/composition-api'
import { VuexStore, Dictionary } from './types'

const getModuleKeys = (
	vm: Vue,
	namespace: string,
	type: 'state' | 'mutations' | 'actions' | 'getters',
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

export function validateNamespace(namespace: any, helper: string): void {
	if (typeof namespace !== 'string') {
		throw new Error(
			`[vuex-hooks] invalid namespace type, expected string got ${typeof namespace}`,
		)
	} else if (!namespace.trim()) {
		throw new Error(`[vuex-hooks] ${helper} called with invalid namespace`)
	}
}
