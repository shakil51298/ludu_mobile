import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { gradients } from '../../theme';

export function GradientBackground({
  children,
  colors: gradientColors = gradients.screenBackground,
  style,
}: {
  children: ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient colors={[...gradientColors]} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
