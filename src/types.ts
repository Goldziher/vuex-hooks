/* eslint-disable @typescript-eslint/ban-types */
import { ActionContext, Store } from 'vuex'
import { Ref } from '@vue/composition-api'
export type ModuleKey = 'state' | 'mutations' | 'actions' | 'getters'
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
export type Dictionary<T = any> = { [k: string]: T }
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
