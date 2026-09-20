import { View, type ViewProps } from 'react-native';
import type { HingesChangeEvent } from './HingesViewNativeComponent';

export type HingesViewProps = ViewProps & {
  onHingesChange?: (event: { nativeEvent: HingesChangeEvent }) => void;
};

export function HingesView({ onHingesChange: _onHingesChange, ...props }: HingesViewProps) {
  return <View {...props} />;
}
