import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewProps } from 'react-native';

export type MudraCameraViewProps = {
  mudraId?: string;
  cameraType?: 'front' | 'back';
  onAIStatusChange?: (event: { nativeEvent: { status: string } }) => void;
} & ViewProps;

const NativeView: React.ComponentType<MudraCameraViewProps> = requireNativeViewManager('MudraCamera');

export default function MudraCameraView(props: MudraCameraViewProps) {
  return <NativeView {...props} />;
}