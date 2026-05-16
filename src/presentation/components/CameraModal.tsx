import React, { useState, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { Feather } from '@expo/vector-icons';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
}

export const CameraModal = ({ visible, onClose, onCapture }: CameraModalProps) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!visible) return null;

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Feather name="camera-off" size={64} color="#2A1128" />
          <Text style={styles.permissionText}>Precisamos de permissão para acessar a câmera.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Conceder Permissão</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photoData = await cameraRef.current.takePictureAsync({
          quality: 0.2, // Compacta a imagem para caber perfeitamente no Firestore (limite de 1MB)
        });
        if (photoData) {
          setPhoto(photoData);
        }
      } catch {
        Alert.alert('Erro', 'Não foi possível tirar a foto.');
      }
    }
  };

  const handleConfirm = () => {
    if (photo) {
      onCapture(photo.uri);
      setPhoto(null);
      onClose();
    }
  };

  const handleRetake = () => {
    setPhoto(null);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        {photo ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photo.uri }} style={styles.preview} />
            <View style={styles.previewControls}>
              <TouchableOpacity style={styles.controlButton} onPress={handleRetake}>
                <Feather name="refresh-cw" size={32} color="#FFFFFF" />
                <Text style={styles.controlText}>Repetir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlButton, styles.confirmButton]} onPress={handleConfirm}>
                <Feather name="check" size={32} color="#FFFFFF" />
                <Text style={styles.controlText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <CameraView style={styles.camera} ref={cameraRef}>
            <View style={styles.overlay}>
              <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                <Feather name="x" size={32} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.cameraControls}>
                <View style={{ width: 64 }} /> 
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                <View style={{ width: 64 }} />
              </View>
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#E6D5A7',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 24,
    color: '#2A1128',
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#2A1128',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    color: '#2A1128',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 40,
  },
  closeIcon: {
    alignSelf: 'flex-end',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 15,
    minWidth: 100,
  },
  confirmButton: {
    backgroundColor: 'rgba(42, 17, 40, 0.8)',
  },
  controlText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: 'bold',
  },
});
