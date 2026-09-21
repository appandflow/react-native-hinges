import type * as React from 'react';
import {
  codegenNativeCommands,
  codegenNativeComponent,
  type CodegenTypes,
  type HostComponent,
  type ViewProps,
} from 'react-native';

export type HingesObserverChangeEvent = Readonly<{
  hinges: { status: string; angle: CodegenTypes.Double; hasAngle: boolean }[];
}>;

export interface NativeProps extends ViewProps {
  onHingesChange?: CodegenTypes.DirectEventHandler<HingesObserverChangeEvent>;
}

export interface NativeCommands {
  /** Re-emits the view's current hinge snapshot so a late listener observes it. */
  refresh: (viewRef: React.ComponentRef<HostComponent<NativeProps>>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['refresh'],
});

export default codegenNativeComponent<NativeProps>('HingesObserverView');
