import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6D5A7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    minHeight: 60,
  },
  menuButton: {
    position: 'absolute',
    left: 24,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A1128',
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  taskPill: {
    backgroundColor: 'rgba(42, 17, 40, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 32, 
  },
  taskPillText: {
    color: '#2A1128',
    fontSize: 16,
    fontWeight: '600',
  },
  timerContainer: {
    marginTop: 40,
    marginBottom: 40,
  }
});
