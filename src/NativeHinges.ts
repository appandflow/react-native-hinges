import { TurboModuleRegistry, type TurboModule, type CodegenTypes } from 'react-native';

export type NativeHinge = Readonly<{
  status: string;
  angle: CodegenTypes.Double;
  hasAngle: boolean;
}>;

export type HingeSnapshot = Readonly<{ hinges: readonly NativeHinge[] }>;
export type HingesChangeEvent = Readonly<{
  rootTag: CodegenTypes.Double;
  hinges: readonly NativeHinge[];
}>;

export interface Spec extends TurboModule {
  getSnapshot(rootTag: CodegenTypes.Double): HingeSnapshot;
  startObserving(rootTag: CodegenTypes.Double): void;
  stopObserving(rootTag: CodegenTypes.Double): void;
  readonly onHingesChange: CodegenTypes.EventEmitter<HingesChangeEvent>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeHinges');
