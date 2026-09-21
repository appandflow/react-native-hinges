import type { Spec } from './NativeHinges';

const module: Spec = {
  getSnapshot: () => ({ hinges: [] }),
  startObserving: () => {},
  stopObserving: () => {},
  onHingesChange: () => ({ remove: () => {} }),
};

export default module;
