import { Store } from 'vuex'
import { Ref } from '@vue/composition-api'

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
