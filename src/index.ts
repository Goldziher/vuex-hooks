import { Store, mapActions, mapGetters, mapMutations, mapState } from "vuex";
import compositionApi, { Ref, computed } from "@vue/composition-api";
import vue, { VueConstructor } from "vue";

vue.use(compositionApi);

type VuexStore<R> = Store<R> & {
  _modulesNamespaceMap: Dictionary<{
    _rawModule: {
      state: Dictionary<any>;
      actions: Dictionary<any>;
      mutations: Dictionary<any>;
      getters: Dictionary<any>;
    };
  }>;
};
type Computed<T> = Readonly<Ref<Readonly<T>>>;
type Dictionary<T> = { [k: string]: T };
type MapToComputed<T = any> = T extends object
  ? {
      [K in keyof T]: T[K] extends Function
        ? Readonly<Ref<T[K]>>
        : Computed<T[K]>;
    }
  : Dictionary<Computed<any>>;

type Map<T = any> = T extends object
  ? {
      [K in keyof T]: T[K];
    }
  : Dictionary<any>;

const _context: {
  $vm: Vue | null;
  state: Dictionary<any>;
  actions: Dictionary<any>;
  mutations: Dictionary<any>;
  getters: Dictionary<any>;
} = {
  $vm: null,
  state: {},
  actions: {},
  mutations: {},
  getters: {},
};

export default function (vc: VueConstructor): void {
  vc.mixin({
    beforeCreate: function (this: Vue): void {
      if (typeof this.$options.setup === "function" && !_context.$vm)
        _context.$vm = this;
    },
  });
}

const getVm = (): Vue => {
  if (!_context.$vm) {
    throw new Error(
      "[vuex-composition-hooks] vue instance is undefined, make sure to call Vue.use on the plugin before instantiation"
    );
  }
  return _context.$vm;
};

export function useStore<R = any>(): VuexStore<R> {
  const vm = getVm();
  return vm.$store as VuexStore<R>;
}

const getModuleKeys = (namespace: string, type: 'state' | 'mutations' | 'actions' | 'getters'): string[] =>
  Object.keys(
    useStore()._modulesNamespaceMap[
      !namespace.endsWith("/") ? `${namespace}/` : namespace
    ]._rawModule[type]
  );

export function useState<S = any>(namespace: string): MapToComputed<S> {
  if (!_context.state[namespace]) {
    _context.state[namespace] = Object.fromEntries(
      Object.entries(
        mapState(namespace, getModuleKeys(namespace, "state"))
      ).map(([key, value]) => [key, computed(() => value.call(getVm()))])
    );
  }
  return _context.state[namespace] as MapToComputed<S>;
}

export function useGetters<S = any>(namespace: string): MapToComputed<S> {
  if (!_context.getters[namespace]) {
    _context.getters[namespace] = Object.fromEntries(
      Object.entries(
        mapGetters(namespace, getModuleKeys(namespace, "getters"))
      ).map(([key, value]) => [key, computed(() => value.call(getVm()))])
    );
  }
  return _context.getters[namespace] as MapToComputed<S>;
}

export function useMutations<S = any>(namespace: string): Map<S> {
  if (!_context.mutations[namespace]) {
    _context.mutations[namespace] = Object.fromEntries(
      Object.entries(
        mapMutations(namespace, getModuleKeys(namespace, "mutations"))
      ).map(([key, value]) => [key, value.bind(getVm())])
    );
  }
  return _context.mutations[namespace] as Map<S>;
}

export function useActions<S = any>(namespace: string): Map<S> {
  if (!_context.actions[namespace]) {
    _context.actions[namespace] = Object.fromEntries(
      Object.entries(
        mapActions(namespace, getModuleKeys(namespace, "actions"))
      ).map(([key, value]) => [key, value.bind(getVm())])
    );
  }
  return _context.actions[namespace] as Map<S>;
}
