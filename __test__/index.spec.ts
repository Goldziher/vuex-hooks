//@ts-ignore
import jsdom from 'jsdom-global'

jsdom()

import VuexHooks, {
	useActions,
	useGetters,
	useMutations,
	useState,
	useStore,
} from '../src'
import compositionApi, { defineComponent } from '@vue/composition-api'
import Vuex, { ActionContext } from 'vuex'
import { mount, createLocalVue, Wrapper } from '@vue/test-utils'

const localVue = createLocalVue()

localVue.config.silent = true

localVue.use(compositionApi)
localVue.use(VuexHooks)
localVue.use(Vuex)

export const store = new Vuex.Store({
	modules: {
		test: {
			namespaced: true,
			state: {
				boolean: false,
				numeric: 1,
			},
			mutations: {
				TOGGLE_BOOLEAN(state: any): void {
					state.boolean = !state.boolean
				},
				SET_NUMERIC(state: any, value: number): void {
					state.numeric = value
				},
			},
			getters: {
				multiplyNumeric(state: any): number {
					return state.numeric * 2
				},
			},
			actions: {
				toggle({ commit }: ActionContext<any, any>): void {
					commit('TOGGLE_BOOLEAN')
				},
			},
		},
		dummy: {
			namespaced: true,
		},
	},
})

export const createTestApp = (
	hook: Function | Function[],
	namespace?: string,
): Wrapper<any> => {
	const compositionMock = defineComponent({
		name: 'compositionMock',
		template: '<div></div>',
		props: {
			compositionFn: {
				type: [Function, Array],
				required: true,
			},
			namespace: {
				type: String,
				required: false,
			},
		},
		setup({
			compositionFn,
			namespace,
		}: {
			compositionFn: Function | Function[]
			namespace?: string
		}) {
			if (typeof compositionFn === 'function') {
				if (!namespace) return { testStore: compositionFn() }
				return { ...compositionFn(namespace) }
			}
			const returnVal: { [k: string]: any } = {}
			compositionFn.map((fn) => {
				Object.entries(fn(namespace)).forEach(
					([key, value]) => (returnVal[key] = value),
				)
			})

			return { ...returnVal }
		},
	})

	return mount(compositionMock, {
		store,
		localVue,
		propsData: { compositionFn: hook, namespace },
	})
}

describe('test helpers', () => {
	test('error throwing', () => {
		expect(() => useStore()).toThrow()
		expect(() => createTestApp(useState, ' ')).toThrow()
		expect(() => createTestApp(useState)).toThrow()
		expect(() => createTestApp(useState, 'nonExistingModule')).toThrow()
		expect(() => createTestApp(useState, 'dummy/')).toThrow()
	})
	test('useStore', () => {
		const testApp = createTestApp(useStore)
		expect(testApp.vm.testStore).toEqual(testApp.vm.$store)
	})
	test('useState mapping', () => {
		const testApp = createTestApp(useState, 'test')
		expect(testApp.vm.boolean).toEqual(store.state.test.boolean)
		expect(testApp.vm.numeric).toEqual(store.state.test.numeric)
	})
	test('useGetters mapping', () => {
		const testApp = createTestApp(useGetters, 'test')
		expect(testApp.vm.multiplyNumeric).toEqual(store.state.test.numeric * 2)
	})
	test('useMutations mapping', () => {
		const testApp = createTestApp(useMutations, 'test')
		expect(typeof testApp.vm.TOGGLE_BOOLEAN).toBe('function')
		expect(typeof testApp.vm.SET_NUMERIC).toBe('function')
	})
	test('useActions mapping', () => {
		const testApp = createTestApp(useActions, 'test')
		expect(typeof testApp.vm.toggle).toBe('function')
	})

	test('useMutations mutations mutating value, and useGetters keeping reactivity', () => {
		const testApp = createTestApp([useGetters, useMutations], 'test')
		expect(testApp.vm.multiplyNumeric).toEqual(store.state.test.numeric * 2)
		testApp.vm.SET_NUMERIC(2)
		expect(store.state.test.numeric).toEqual(2)
		expect(testApp.vm.multiplyNumeric).toEqual(store.state.test.numeric * 2)
	})

	test('useAction commiting mutation, and useState keeping reactivity', () => {
		const testApp = createTestApp([useState, useActions], 'test')
		expect(store.state.test.boolean).toBeFalsy()
		expect(testApp.vm.boolean).toBeFalsy()
		testApp.vm.toggle()
		expect(store.state.test.boolean).toBeTruthy()
		expect(testApp.vm.boolean).toBeTruthy()
	})
})
