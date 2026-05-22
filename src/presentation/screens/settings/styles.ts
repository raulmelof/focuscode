import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6D5A7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    minHeight: 60,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(42, 17, 40, 0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A1128',
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(42, 17, 40, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A1128',
    marginBottom: 24,
    textAlign: 'center',
  },
  settingRow: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1128',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 17, 40, 0.05)',
    borderRadius: 12,
  },
  input: {
    flex: 1,
    color: '#2A1128',
    fontSize: 16,
    padding: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  unitText: {
    color: '#2A1128',
    opacity: 0.5,
    paddingRight: 16,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 24,
  },
});
