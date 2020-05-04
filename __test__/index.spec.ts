import compositionApi, { defineComponent } from '@vue/composition-api'
import VuexHooks, {
	useStore,
	useActions,
	useState,
	useMutations,
	useGetters,
} from '../src'
import Vuex, { ActionContext } from 'vuex'
import { mount, createLocalVue } from '@vue/test-utils'

const localVue = createLocalVue()
localVue.use(compositionApi)
localVue.use(VuexHooks)

const createTestApp = (namespace: string): any =>
	defineComponent({
		name: 'App',
		setup() {
			const store = useStore()
			const actions = useActions(namespace)
			const state = useState(namespace)
			const mutations = useMutations(namespace)
			const getters = useGetters(namespace)

			return { store, actions, state, mutations, getters }
		},
	})

const createWrapper = (namespace: string): any => {
	const testApp = createTestApp(namespace)
	const store = new Vuex.Store({
		modules: {
			test: {
				namespaced: true,
				state: {
					boolan: false,
					numeric: 1,
				},
				mutations: {
					TOGGLE_BOOLEAN(state: any): void {
						state.test = !state.test
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
		},
	})
	return mount(testApp, {
		store,
		localVue,
	})
}

describe('test module', () => {})
