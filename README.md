# vuex-hooks

This package offers TypeScript enabled vuex composition-api hooks, closing the gap between [Vuex](https://github.com/vuejs/vuex) and the [@Vue/composition-api](https://github.com/vuejs/composition-api).

## installation

Install the package using your package manager of choice:

`npm i vuex-hooks` or `yarn add vuex-hooks`

Then install the plugin in your entry point before calling new Vue:

```javascript
import Vue from 'vue'
import CompositionApi from '@vue/composition-api'
import VuexHooks from 'vuex-hooks'

Vue.use(CompositionApi)
Vue.use(VuexHooks)
...

new Vue(...)

```

## usage

You can use the plugin inside regular javascript or typescript. When using typescript **all typing is optional**.

```javascript
<script>
import { defineComponent } from '@vue/composition-api'
import { useStore, useState, useActions, useMutations, useGetters } from 'vuex-hooks'

export default defineComponent({
    name: 'MyApp',
    setup() {
        const Store = useStore()
        const { supportedLocales } = useState('locales')
        const { SET_LOCALE } = useMutations('locales')
        const { getLocales } = useActions('locales')
        const { currentLocale } = useGetters('locales')

        ...
    }
})
<script>
```

### computed refs and methods

The `useState` and `useGetters` hooks return computed readonly refs, thus to access their value inside the setup function you should use .value:

```javascript
setup() {
    ...
    if (currentLocale.value.lang === 'en') {
        ...
    }
    ...
}

```

`useActions` and `useMutations` return regular functions:

```javascript
setup() {
    ...
    if (currentLocale.value.lang === 'en') {
        ...
    } else {
        getLocales()
    }
    ...
}
```

`useStore` return the main store object that is attached to the \$vm.

### api

Although the api appears similar to the vuex helpers - `mapState, mapActions, mapGetters and mapMutations`, you do not need to pass a second "mapping" argument of the desired keys. That is, when you use the vuex helpers you would usually do something like this:

```javascript
computed: {
    ...mapState('locales', ['currentLocale'])
}
```

This is not required here, just give the module name as a first argument and then destructure what is needed.
If you want to remap names, do this:

```javascript
const { SET_LOCALE: setLocale } = useMutations('locales')
```

The vuex helpers are being called under the hood by the hooks, and they are being given the entire module keys. So when you choose a module called `locales` inside the useMutations helper, all locales mutations are returned. This sounds inefficent, but is in fact a bit more efficent than the regular implementation because the hooks use memoization. Thus called `useMutations('locales')` will compute only once - when you first call this, and then always return the result afterwards, and the rest is done using destructuring.

### usage with typing

To use with typescript and typing, you should of course use either a ts/tsx file, or a vue file with the correct script header, and then pass an interface as a generic argument to the hooks.

Lets assume you defined some interfaces like so in a types.ts file:

```typescript
type Locale = { lang: string; id: number }

interface LocalesState {
	supportedLocales: Locale[]
	currentLocaleId: number
}

interface LocalesGetters {
	currentLocale: () => Locale
}

interface LocalesActions {
	getLocales: () => Promise<Locale[]>
}

interface LocalesMutations {
	SET_LOCALE: (payload: Locale) => void
}

interface RootState {
	locales: LocalesState
}
```

You can then use these in the hooks to get type inference:

```typescript
<script>
import { LocalesState, LocalesGetters, LocalesActions, LocalesMutations, RootState }
import { defineComponent } from '@vue/composition-api'
import { useStore, useState, useActions, useMutations, useGetters } from 'vuex-hooks'

export default defineComponent({
    name: 'MyApp',
    setup() {
        const Store = useStore<RootState>()
        const { supportedLocales } = useState<LocalesState>('locales')
        const { SET_LOCALE } = useMutations<LocalesMutations>('locales')
        const { getLocales } = useActions<LocalesActions>('locales')
        const { currentLocale } = useGetters<LocalesGetters>('locales')

        ...
    }
})
<script>
```

## Credit where its due

This package was inspired by the package [vue-hooks](https://github.com/u3u/vue-hooks). The differences between this package and the vue-hooks package are (a) this package is only for vuex-hooks, (b) this package has very few dependencies and (c) this package is fully typescript enabled.
