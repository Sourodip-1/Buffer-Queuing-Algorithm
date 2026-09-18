import React, { useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableOpacity, Text, View, Modal } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DevNavigationButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const pan = useRef(new Animated.ValueXY()).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  // Render unconditionally for now to ensure it shows up regardless of env config during testing
  return (
    <>
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.buttonInner} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>DEV</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Dev Navigation</Text>
            
            <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/customer-dashboard'); }}>
              <Text style={styles.link}>Customer Dashboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/customer-dashboard-enhanced'); }}>
              <Text style={styles.link}>Customer Dashboard (Enhanced)</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/live-queue-ticket'); }}>
              <Text style={styles.link}>Live Queue Ticket</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/live-queue-ticket-enhanced'); }}>
              <Text style={styles.link}>Live Queue Ticket (Enhanced)</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/scan-qr'); }}>
              <Text style={styles.link}>Scan QR</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/scan-result'); }}>
              <Text style={styles.link}>Scan Result</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/'); }}>
              <Text style={styles.link}>Splash Screen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 9999,
  },
  buttonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  link: {
    fontSize: 16,
    color: 'blue',
    marginVertical: 10,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    minWidth: 100,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
