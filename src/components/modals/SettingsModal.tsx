import { BlurView } from 'expo-blur';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, radius, typography } from '../../theme';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';

export function SettingsModal({
  musicOn,
  onClose,
  onMusicToggle,
  onSoundToggle,
  soundOn,
  visible,
  vibrationOn,
  onVibrationToggle,
}: {
  musicOn: boolean;
  onClose: () => void;
  onMusicToggle: (v: boolean) => void;
  onSoundToggle: (v: boolean) => void;
  soundOn: boolean;
  visible: boolean;
  vibrationOn: boolean;
  onVibrationToggle: (v: boolean) => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <GlassCard style={styles.panel}>
          <Text style={styles.title}>SETTINGS</Text>
          <Row label="Sound effects" value={soundOn} onValueChange={onSoundToggle} />
          <Row label="Music" value={musicOn} onValueChange={onMusicToggle} />
          <Row label="Vibration" value={vibrationOn} onValueChange={onVibrationToggle} />
          <PremiumButton label="CLOSE" onPress={onClose} style={styles.btn} variant="secondary" />
        </GlassCard>
      </View>
    </Modal>
  );
}

function Row({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (v: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.navyLight, true: colors.royalBlue }}
        thumbColor={value ? colors.gold : colors.whiteMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 340,
  },
  title: {
    ...typography.title,
    marginBottom: 16,
    textAlign: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowLabel: {
    ...typography.body,
    color: colors.white,
  },
  btn: {
    marginTop: 8,
  },
});
