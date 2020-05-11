# vuex-hooks

[![Build Status](https://travis-ci.org/Goldziher/vuex-hooks.svg?branch=master)](https://travis-ci.org/Goldziher/vuex-hooks) [![Coverage Status](https://coveralls.io/repos/github/Goldziher/vuex-hooks/badge.svg?branch=master)](https://coveralls.io/github/Goldziher/vuex-hooks?branch=master) [![npm version](https://badge.fury.io/js/vuex-hooks.svg)](https://badge.fury.io/js/vuex-hooks) [![Maintainability](https://api.codeclimate.com/v1/badges/de1f807703330e29c31f/maintainability)](https://codeclimate.com/github/Goldziher/vuex-hooks/maintainability)

This tiny package offers TypeScript enabled vuex composition-api hooks, closing the gap between [vuex](https://github.com/vuejs/vuex) and the [@vue/composition-api](https://github.com/vuejs/composition-api).

- [Installation](#installation)
- [Usage](#usage)
  - [Computed Refs and Methods](#computed-refs-and-methods)
  - [TypeScript Support](#typescript-support)

## Installation

Install the package using your package manager of choice:

`npm i vuex-hooks` or `yarn add vuex-hooks`

Then install the plugin in your entry point before instantiating vue:

```javascript
import Vue from 'vue'
import CompositionApi from '@vue/composition-api'
import VuexHooks from 'vuex-hooks'

Vue.use(CompositionApi)
Vue.use(VuexHooks)
...

new Vue(...)

```

## Usage

You can use the plugin in your composition functions or vue components.

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

Although the api appears similar to the vuex helpers - `mapState, mapActions, mapGetters and mapMutations`, you do not need to pass a second "mapping" argument of the desired keys. That is, when you use the native vuex helpers you would usually do something like this:

```javascript
computed: {
    ...mapState('locales', ['currentLocale'])
}
```

This is not required here, just give the module name as the only argument and then destructure what is needed from the returned value.

If you want to remap names, do this:

```javascript
const { SET_LOCALE: setLocale } = useMutations('locales')
```

The vuex helpers are being called under the hood by the hooks, and they are being given the entire module's keys. So when you choose a module called `locales` inside the useState helper for example, all locales' module state entries are returned. This sounds inefficent, but is in fact a bit more efficent than the regular implementation because the hooks use memoization.

### Computed Refs and Methods

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

`useStore` returns the main store object that is attached to the vue instance.

### TypeScript Support

When using TypeScript **typing is optional** but is of course highly recommended. To use typing, you should use either a ts/tsx file or a vue file with the correct script header, and then pass an interface as a generic argument to the respective hook.

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

You can then use these in the hooks to get type checking and inference:

```typescript
<script lang="ts">
import {
    LocalesState,
    LocalesGetters,
    LocalesActions,
    LocalesMutations,
    RootState,
} from './types'
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

Doing this will result in the return values being correctly typed, so for example the `supportedLocales` value will be:

```typescript

    supportedLocales === Readonly<Ref<Locale>>

```

You can also use the typings of a module directly. Lets assume there is a module that looks like so:

```typescript
interface User {
    id: number
    name: string
    email: sring
    company: string
}
interface UserState {
    allUsers: User[]
    currentUserId: number | null
}
const state: UserState = {
	users: [],
	currentUserId: null,
}

export default {
	namespaced: true,
	state,
	actions: {
		async getUsers(ctx: ActionContext<UserState, any>): Promise<void> {
            try {
                const response = await api.get('myapi/users/')
                ctx.commit('SET_USERS', response.data)
            } catch(error) {
                ...
            }
        },
        async updateUser(ctx: ActionContext<UserState, any>, payload: Partial<User>): Promise<void | User> {
            try {
                const userId = ctx.state.currentUserId
                const response = await api.patch(`myapi/users/${userId}/`)
                return response.data
            } catch(error) {
                ...
            }
        }
    },
    getters: {
        getUserById(state: UserState) => (id: number): User | undefiend {
            return state.users.find(user => user.id === id)
        }
    },
    mutations: {
        SET_USERS(state: UserState, payload: User[]): void {
            state.users = payload
        },
    }
}
```

Obviously you already have typings in this case, and you can use these:

```typescript
<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { useState, useActions, useMutations, useGetters } from 'vuex-hooks'
import UsersStore from './store'

export default defineComponent({
    name: 'MyApp',
    setup() {
        const { currentUserId } = useState<typeof UsersStore['state']>('users') // ReadOnly<Ref<number | null>>
        const { SET_USERS } = useMutations<typeof UsersStore['mutations']>('users') // (payload: User[]) => void
        const { getUserById } = useActions<typeof UsersStore['actions']>('users') // (payload: Partial<User>) => Promise<void | User>
        const { updateUser } = useGetters<typeof UsersStore['getters']>('users') // ReadOnly<Ref<(id: number) => User | undefiend>>

        ...
    }
})
</script>
```

The plugin remaps the typings and strips the vuex specific arguments from actions and mutations, so for example `updateUser` will not be inferred as `(ctx: ActionContext<UserState, any>, payload: Partial<User>) => Promise<void | User>` but rather as `(payload: Partial<User>) => Promise<void | User>`. It also returns correctly curried functions from getters.
