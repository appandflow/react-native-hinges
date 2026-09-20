import { codegenNativeComponent, type CodegenTypes, type ViewProps } from 'react-native';

export type HingesChangeEvent = Readonly<{
  hinges: { status: string; angle: CodegenTypes.Double; hasAngle: boolean }[];
}>;

export interface NativeProps extends ViewProps {
  onHingesChange?: CodegenTypes.DirectEventHandler<HingesChangeEvent>;
}

export default codegenNativeComponent<NativeProps>('HingesView');
