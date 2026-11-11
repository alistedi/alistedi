import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrateDbIfNeeded } from '../src/db/schema';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="alistedi.db" onInit={migrateDbIfNeeded}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: true, title: 'Tartışma' }} />
      </Stack>
    </SQLiteProvider>
  );
}
