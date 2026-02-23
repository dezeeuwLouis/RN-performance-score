import { useState, useRef, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Button,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { PerfScore } from 'rn-perf-score';

const ITEM_COUNT = 500;
const LIST_DATA = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  key: String(i),
  label: `Item ${i}`,
}));

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Block the JS thread for `ms` milliseconds (busy wait). */
function blockJs(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy wait
  }
}

export default function App() {
  const [recording, setRecording] = useState(false);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [status, setStatus] = useState('Ready');
  const flatListRef = useRef<FlatList>(null);

  const handleToggle = useCallback(() => {
    if (recording) {
      const report = PerfScore.stopAndSave();
      setScore(report.score);
      setRecording(false);
      setStatus(`Done — ${report.samples.length} samples`);
    } else {
      PerfScore.start({ enableAutoInstrumentation: true });
      setScore(null);
      setRecording(true);
      setStatus('Recording...');
    }
  }, [recording]);

  const runScenario = useCallback(async () => {
    setRunning(true);
    setScore(null);
    setStatus('Scenario: starting...');

    PerfScore.start({ enableAutoInstrumentation: true });
    setRecording(true);
    PerfScore.mark('scenario_start');

    // Step 1 — idle baseline
    setStatus('Step 1: idle baseline');
    PerfScore.mark('idle_baseline');
    await sleep(2000);

    // Step 2 — fast scroll
    setStatus('Step 2: fast scroll');
    PerfScore.mark('fast_scroll_start');
    flatListRef.current?.scrollToIndex({ index: 400, animated: true });
    await sleep(2000);
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    await sleep(2000);
    PerfScore.mark('fast_scroll_end');

    // Step 3 — simulate heavy JS work (sustained blocking)
    setStatus('Step 3: heavy JS computation');
    PerfScore.mark('heavy_js_start');
    for (let i = 0; i < 10; i++) {
      blockJs(150);
      await sleep(5); // minimal yield to let rAF sample, but stay blocked
    }
    PerfScore.mark('heavy_js_end');

    // Step 4 — network requests
    setStatus('Step 4: network requests');
    PerfScore.mark('network_start');
    try {
      await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/posts/1'),
        fetch('https://jsonplaceholder.typicode.com/posts/2'),
        fetch('https://jsonplaceholder.typicode.com/posts/3'),
      ]);
    } catch {
      // ignore network errors in test
    }
    PerfScore.mark('network_end');

    // Step 5 — recovery idle
    setStatus('Step 5: recovery');
    PerfScore.mark('recovery');
    await sleep(2000);

    // Done
    PerfScore.mark('scenario_end');
    const report = PerfScore.stopAndSave();
    setScore(report.score);
    setRecording(false);
    setRunning(false);
    setStatus(`Scenario done — ${report.samples.length} samples`);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>rn-perf-score</Text>
      <Text style={styles.status} testID="status-text">
        {status}
      </Text>

      <View style={styles.buttons}>
        <Button
          title={recording ? 'Stop Recording' : 'Start Recording'}
          onPress={handleToggle}
          disabled={running}
        />
        <View style={styles.gap} />
        <Button
          title="Run Scenario"
          testID="run-scenario"
          onPress={runScenario}
          disabled={running || recording}
        />
      </View>

      {running && <ActivityIndicator style={styles.spinner} />}
      {score !== null && <Text style={styles.score}>Score: {score}</Text>}

      <FlatList
        ref={flatListRef}
        data={LIST_DATA}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listText}>{item.label}</Text>
          </View>
        )}
        onScrollToIndexFailed={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gap: {
    width: 12,
  },
  spinner: {
    marginVertical: 8,
  },
  score: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 12,
  },
  list: {
    flex: 1,
    marginTop: 8,
  },
  listItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  listText: {
    fontSize: 14,
  },
});
