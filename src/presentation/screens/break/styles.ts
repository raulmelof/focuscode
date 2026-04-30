import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#1E2D24', 
  },
  pixelBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover', 
  },
  uiLayer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    padding: 10,
    borderRadius: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2A1128',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#2A1128',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
 timerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    marginTop: 40,
  },
  footer: {
    width: '100%',
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#2A1128',
    paddingVertical: 18,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#E6D5A7',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});