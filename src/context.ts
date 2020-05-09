export default: {$vm: Vue | null
    getVm: () => Vue
    state: Dictionary
    actions: Dictionary
    mutations: Dictionary
    getters: Dictionary}  {
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