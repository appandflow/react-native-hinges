import {
  forwardRef,
  type ComponentRef,
  type ForwardRefExoticComponent,
  type PropsWithoutRef,
  type RefAttributes,
} from 'react';
import { View, type ViewProps } from 'react-native';
import type { HingesChangeEvent } from './HingesViewNativeComponent';

export type HingesViewProps = ViewProps & {
  onHingesChange?: (event: { nativeEvent: HingesChangeEvent }) => void;
};

export const HingesView: ForwardRefExoticComponent<
  PropsWithoutRef<HingesViewProps> & RefAttributes<ComponentRef<typeof View>>
> = forwardRef<ComponentRef<typeof View>, HingesViewProps>(function HingesView(
  { onHingesChange: _onHingesChange, ...props },
  ref,
) {
  return <View {...props} ref={ref} />;
});
