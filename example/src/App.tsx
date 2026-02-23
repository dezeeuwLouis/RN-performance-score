import { useState } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { PerfScore } from 'rn-perf-score';

export default function App() {
  const [recording, setRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleToggle = () => {
    if (recording) {
      const report = PerfScore.stopAndSave();
      setScore(report.score);
      setRecording(false);
    } else {
      PerfScore.start();
      setScore(null);
      setRecording(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>rn-perf-score</Text>
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={handleToggle}
      />
      {score !== null && <Text style={styles.score}>Score: {score}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  score: {
    fontSize: 32,
    marginTop: 20,
    fontWeight: 'bold',
  },
});
