import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, KeyboardAvoidingView, Platform, Alert, Image, Modal } from 'react-native';
import { TextInput, Snackbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TimePickerModal, en, registerTranslation } from 'react-native-paper-dates';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeOut, Layout, useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';



registerTranslation('en', en);

export default function CreateQueuePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Snackbar State
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarAction, setSnackbarAction] = useState<any>(undefined);

  const showSnackbar = (message: string, action?: any) => {
    setSnackbarMessage(message);
    setSnackbarAction(action);
    setSnackbarVisible(true);
  };

  // Basic Info
  const [queueName, setQueueName] = useState('');
  const [venue, setVenue] = useState('');
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null);

  // Timings & Capacity
  const getInitialStart = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return {
      date: d,
      time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    };
  };

  const getInitialEnd = () => {
    const d = new Date();
    d.setHours(d.getHours() + 3);
    return {
      date: d,
      time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    };
  };

  const initialStart = getInitialStart();
  const initialEnd = getInitialEnd();

  const [startDate, setStartDate] = useState<Date>(initialStart.date);
  const [endDate, setEndDate] = useState<Date>(initialEnd.date);
  const [startTime, setStartTime] = useState(initialStart.time);
  const [endTime, setEndTime] = useState(initialEnd.time);
  const [hasBreak, setHasBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState('13:00');
  const [breakEndTime, setBreakEndTime] = useState('14:00');

  // Date/Time Picker State
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'start' | 'end' | null>(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | 'breakStart' | 'breakEnd' | null>(null);

  const onConfirmDateAndroid = (event: any, selectedDate: Date) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      if (activeDateField === 'start') setStartDate(selectedDate);
      if (activeDateField === 'end') setEndDate(selectedDate);
    }
  };

  const onConfirmDateIOS = (event: any, selectedDate: Date) => {
    if (selectedDate) {
      if (activeDateField === 'start') setStartDate(selectedDate);
      if (activeDateField === 'end') setEndDate(selectedDate);
    }
  };
  
  const openDatePicker = (field: 'start' | 'end') => {
    setActiveDateField(field);
    setDatePickerVisible(true);
  };

  const onConfirmTime = React.useCallback(
    ({ hours, minutes }: { hours: number; minutes: number }) => {
      setTimePickerVisible(false);
      
      const now = new Date();
      const checkDate = (activeTimeField === 'end' || activeTimeField === 'breakEnd') ? endDate : startDate;
      
      const isToday = checkDate.getDate() === now.getDate() && 
                      checkDate.getMonth() === now.getMonth() && 
                      checkDate.getFullYear() === now.getFullYear();

      if (isToday && (activeTimeField === 'start' || activeTimeField === 'breakStart')) {
        if (hours < now.getHours() || (hours === now.getHours() && minutes < now.getMinutes())) {
          showSnackbar("You cannot select a time in the past.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
      }

      if (activeTimeField === 'end') {
        const isSameDay = endDate.getDate() === startDate.getDate() && 
                          endDate.getMonth() === startDate.getMonth() && 
                          endDate.getFullYear() === startDate.getFullYear();
        if (isSameDay) {
          const [startH, startM] = startTime.split(':').map(Number);
          if (hours < startH || (hours === startH && minutes <= startM)) {
            showSnackbar("End time must be after the start time.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
          }
        }
      }

      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      if (activeTimeField === 'start') setStartTime(formattedTime);
      if (activeTimeField === 'end') setEndTime(formattedTime);
      if (activeTimeField === 'breakStart') setBreakStartTime(formattedTime);
      if (activeTimeField === 'breakEnd') setBreakEndTime(formattedTime);
    },
    [activeTimeField, startDate, endDate]
  );

  const openTimePicker = (field: 'start' | 'end' | 'breakStart' | 'breakEnd') => {
    setActiveTimeField(field);
    setTimePickerVisible(true);
  };
  
  const [processingTime, setProcessingTime] = useState('5'); // in minutes
  const [autoAssignMaxUsers, setAutoAssignMaxUsers] = useState(true);
  const [manualMaxUsers, setManualMaxUsers] = useState('');

  // Algorithm
  const [algorithm, setAlgorithm] = useState<'FCFS' | 'BUFFER'>('BUFFER');
  const [bufferTravelTime, setBufferTravelTime] = useState<number>(60); // minutes
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [isSmartQueuing, setIsSmartQueuing] = useState(true);

  // Access & Requirements
  const [isPublic, setIsPublic] = useState(true);
  const [requirementInput, setRequirementInput] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);

  // 1 hr buffer lock
  const isLessThanOneHour = useMemo(() => {
    const startDateTime = new Date(startDate);
    const [startH, startM] = startTime.split(':').map(Number);
    startDateTime.setHours(startH, startM, 0, 0);

    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    return startDateTime < oneHourFromNow;
  }, [startDate, startTime]);

  useEffect(() => {
    if (isLessThanOneHour && algorithm === 'BUFFER') {
      setAlgorithm('FCFS');
    }
  }, [isLessThanOneHour, algorithm]);

  const translateX = useDerivedValue(() => {
    return withSpring(algorithm === 'FCFS' ? 0 : (segmentWidth - 8) / 2, {
      damping: 20,
      stiffness: 200,
      mass: 0.5,
    });
  }, [algorithm, segmentWidth]);

  const animatedSegmentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Helper to calculate time difference in minutes
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return 0;
    return h * 60 + m;
  };

  const format12Hour = (time24: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // '0' becomes '12'
    return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
  };

  const bufferEndTime = useMemo(() => {
    const startMins = timeToMinutes(startTime);
    let endMins = startMins - bufferTravelTime;
    if (endMins < 0) {
      endMins = (24 * 60) + endMins;
    }
    const h = Math.floor(endMins / 60);
    const m = endMins % 60;
    const time24 = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    return format12Hour(time24);
  }, [startTime, bufferTravelTime]);

  // Auto calculate max users
  const calculatedMaxUsers = useMemo(() => {
    if (!autoAssignMaxUsers) return manualMaxUsers;
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    
    // Calculate day difference
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
    const dayDiff = Math.round((endDay - startDay) / (1000 * 60 * 60 * 24));
    
    let totalMins = (dayDiff * 24 * 60) + endMins - startMins;
    
    if (hasBreak) {
      const bStart = timeToMinutes(breakStartTime);
      const bEnd = timeToMinutes(breakEndTime);
      let breakLen = bEnd - bStart;
      if (breakLen < 0) breakLen += (24 * 60);
      totalMins -= Math.max(0, breakLen);
    }
    
    const procTime = parseInt(processingTime) || 1;
    if (totalMins > 0) {
      return Math.floor(totalMins / procTime).toString();
    }
    return '0';
  }, [autoAssignMaxUsers, manualMaxUsers, startTime, endTime, startDate, endDate, hasBreak, breakStartTime, breakEndTime, processingTime]);

  const addRequirement = () => {
    if (requirementInput.trim() && !requirements.includes(requirementInput.trim())) {
      setRequirements([...requirements, requirementInput.trim()]);
      setRequirementInput('');
    }
  };

  const handleRequirementChange = (text: string) => {
    if (text.includes(',') || text.includes('\n')) {
      const parts = text.split(/,|\n/).map(t => t.trim()).filter(t => t.length > 0 && !requirements.includes(t));
      if (parts.length > 0) {
        setRequirements(prev => [...prev, ...parts]);
      }
      setRequirementInput('');
    } else {
      setRequirementInput(text);
    }
  };

  const removeRequirement = (req: string) => {
    setRequirements(requirements.filter(r => r !== req));
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverPhotoUri(result.assets[0].uri);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/customer-dashboard' as any);
    }
  };

  const handlePublish = async () => {
    // Basic validation
    if (!queueName.trim() || !venue.trim()) {
      showSnackbar("Please provide a name and venue for the queue.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Construct the payload matching backend schema
    const startDateTime = new Date(startDate);
    const [startH, startM] = startTime.split(':').map(Number);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(endDate);
    const [endH, endM] = endTime.split(':').map(Number);
    endDateTime.setHours(endH, endM, 0, 0);

    const safeTravelCutoff = new Date(startDateTime);
    safeTravelCutoff.setHours(safeTravelCutoff.getHours() - 1);
    const regCutoff = new Date(endDateTime);

    const payload = {
      name: queueName,
      openingTime: startDateTime.toISOString(),
      closingTime: endDateTime.toISOString(),
      isStandaloneQueue: true,
      safeTravelCutoffTime: safeTravelCutoff.toISOString(),
      registrationCutoffTime: regCutoff.toISOString(),
      latitude: 0.0,
      longitude: 0.0,
      stages: [
        {
          name: 'Main Stage',
          orderIndex: 0,
          requiredDocs: requirements,
          counters: [{ name: 'Main Counter' }]
        }
      ]
    };

    try {
      await api.post('/api/admin/workflows', payload);
      
      // Success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSnackbar("Queue successfully created!");
      
      // Reset Form for next time
      const iStart = getInitialStart();
      const iEnd = getInitialEnd();
      setQueueName('');
      setVenue('');
      setCoverPhotoUri(null);
      setStartDate(iStart.date);
      setEndDate(iEnd.date);
      setStartTime(iStart.time);
      setEndTime(iEnd.time);
      setHasBreak(false);
      setBreakStartTime('13:00');
      setBreakEndTime('14:00');
      setProcessingTime('5');
      setAutoAssignMaxUsers(true);
      setManualMaxUsers('');
      setAlgorithm('BUFFER');
      setBufferTravelTime(60);
      setIsPublic(true);
      setRequirementInput('');
      setRequirements([]);

      setTimeout(() => {
        handleGoBack();
      }, 1000);
    } catch (error) {
      console.error('Failed to create queue:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showSnackbar("Failed to publish queue. Please check connection.");
    }
  };

  const SectionHeader = ({ title, icon }: { title: string, icon: string }) => (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon as any} size={20} color={theme.colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* Full-screen Dialog Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Queue</Text>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={handlePublish}
        >
          <Text style={styles.headerActionText}>Publish</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
          
          {/* Section 1: Basic Info */}
          <View style={styles.card}>
            <SectionHeader title="Basic Info" icon="info-outline" />
            
            {coverPhotoUri ? (
              <View style={[styles.imagePlaceholder, { borderWidth: 0 }]}>
                <Image source={{ uri: coverPhotoUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
                <TouchableOpacity 
                  style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 }}
                  onPress={() => setCoverPhotoUri(null)}
                >
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 }}
                  onPress={pickImage}
                >
                  <MaterialIcons name="edit" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage} activeOpacity={0.8}>
                <MaterialIcons name="add-photo-alternate" size={32} color={theme.colors.outline} />
                <Text style={styles.imagePlaceholderText}>Add Queue Cover Photo</Text>
              </TouchableOpacity>
            )}

            <View style={styles.inputGroup}>
              <TextInput 
                mode="outlined"
                label="Queue Name"
                placeholder="e.g. Blue Bean Cafe Morning Rush"
                value={queueName}
                onChangeText={setQueueName}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.paperInput}
              />
            </View>
            <LocationPicker venue={venue} setVenue={setVenue} />
          </View>

          {/* Section 2: Timing & Capacity */}
          <View style={styles.card}>
            <SectionHeader title="Timing & Capacity" icon="schedule" />
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <TouchableOpacity onPress={() => openDatePicker('start')} activeOpacity={0.8}>
                  <View pointerEvents="none">
                    <TextInput 
                      mode="outlined"
                      label="Start Date"
                      value={startDate ? startDate.toLocaleDateString('en-GB') : ''}
                      right={<TextInput.Icon icon="calendar-today" />}
                      editable={false}
                      outlineColor={theme.colors.outlineVariant}
                      activeOutlineColor={theme.colors.primary}
                      textColor={theme.colors.onSurface}
                      style={styles.paperInput}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <TouchableOpacity onPress={() => openDatePicker('end')} activeOpacity={0.8}>
                  <View pointerEvents="none">
                    <TextInput 
                      mode="outlined"
                      label="End Date"
                      value={endDate ? endDate.toLocaleDateString('en-GB') : ''}
                      right={<TextInput.Icon icon="calendar-today" />}
                      editable={false}
                      outlineColor={theme.colors.outlineVariant}
                      activeOutlineColor={theme.colors.primary}
                      textColor={theme.colors.onSurface}
                      style={styles.paperInput}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <TouchableOpacity onPress={() => openTimePicker('start')} activeOpacity={0.8}>
                  <View pointerEvents="none">
                    <TextInput 
                      mode="outlined"
                      label="Start Time"
                      value={format12Hour(startTime)}
                      right={<TextInput.Icon icon="clock-outline" />}
                      editable={false}
                      outlineColor={theme.colors.outlineVariant}
                      activeOutlineColor={theme.colors.primary}
                      textColor={theme.colors.onSurface}
                      style={styles.paperInput}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <TouchableOpacity onPress={() => openTimePicker('end')} activeOpacity={0.8}>
                  <View pointerEvents="none">
                    <TextInput 
                      mode="outlined"
                      label="End Time"
                      value={format12Hour(endTime)}
                      right={<TextInput.Icon icon="clock-outline" />}
                      editable={false}
                      outlineColor={theme.colors.outlineVariant}
                      activeOutlineColor={theme.colors.primary}
                      textColor={theme.colors.onSurface}
                      style={styles.paperInput}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Include Break (e.g. Lunch)</Text>
              <Switch value={hasBreak} onValueChange={(val) => { Haptics.selectionAsync(); setHasBreak(val); }} trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primary }} thumbColor={hasBreak ? theme.colors.onPrimary : theme.colors.outline} />
            </View>
            
            {hasBreak && (
              <Animated.View entering={FadeIn} exiting={FadeOut} layout={Layout.springify()} style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <TouchableOpacity onPress={() => openTimePicker('breakStart')} activeOpacity={0.8}>
                    <View pointerEvents="none">
                      <TextInput 
                        mode="outlined"
                        label="Break Start"
                        value={format12Hour(breakStartTime)}
                        right={<TextInput.Icon icon="clock-outline" />}
                        editable={false}
                        outlineColor={theme.colors.outlineVariant}
                        activeOutlineColor={theme.colors.primary}
                        textColor={theme.colors.onSurface}
                        style={styles.paperInput}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <TouchableOpacity onPress={() => openTimePicker('breakEnd')} activeOpacity={0.8}>
                    <View pointerEvents="none">
                      <TextInput 
                        mode="outlined"
                        label="Break End"
                        value={format12Hour(breakEndTime)}
                        right={<TextInput.Icon icon="clock-outline" />}
                        editable={false}
                        outlineColor={theme.colors.outlineVariant}
                        activeOutlineColor={theme.colors.primary}
                        textColor={theme.colors.onSurface}
                        style={styles.paperInput}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <TextInput 
                mode="outlined"
                label="Est. Processing Time per Person (mins)"
                placeholder="e.g. 5"
                value={processingTime}
                onChangeText={setProcessingTime}
                keyboardType="numeric"
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.paperInput}
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Auto-Assign Max Users</Text>
                <Text style={styles.helperText}>Calculated from total time & processing time</Text>
              </View>
              <Switch value={autoAssignMaxUsers} onValueChange={(val) => { Haptics.selectionAsync(); setAutoAssignMaxUsers(val); }} trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primary }} thumbColor={autoAssignMaxUsers ? theme.colors.onPrimary : theme.colors.outline} />
            </View>

            <View style={styles.inputGroup}>
              <TextInput 
                mode="outlined"
                label="Max Users"
                placeholder="Enter max users"
                value={autoAssignMaxUsers ? calculatedMaxUsers : manualMaxUsers}
                onChangeText={setManualMaxUsers}
                editable={!autoAssignMaxUsers}
                keyboardType="numeric"
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                textColor={autoAssignMaxUsers ? theme.colors.onSurfaceVariant : theme.colors.onSurface}
                style={[styles.paperInput, autoAssignMaxUsers && { backgroundColor: theme.colors.surfaceContainerLow }]}
              />
            </View>
          </View>

          {/* Section 3: Algorithm */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <SectionHeader title="Algorithm Strategy" icon="calculate" />
            </View>
            
            <View 
              style={[styles.segmentedControl, { position: 'relative', overflow: 'hidden' }, isLessThanOneHour && { opacity: 0.7 }]}
              onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}
            >
              {segmentWidth > 0 && (
                <Animated.View style={[{
                  position: 'absolute',
                  top: 4,
                  bottom: 4,
                  left: 4,
                  width: (segmentWidth - 8) / 2,
                  backgroundColor: theme.colors.primary,
                  borderRadius: 100,
                }, animatedSegmentStyle]} />
              )}

              <TouchableOpacity 
                style={[styles.segment, { backgroundColor: 'transparent' }]} 
                onPress={() => { Haptics.selectionAsync(); setAlgorithm('FCFS'); }}
              >
                <Text style={[styles.segmentText, algorithm === 'FCFS' ? styles.segmentTextActive : { color: theme.colors.onSurfaceVariant }]}>FCFS</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segment, { backgroundColor: 'transparent' }]} 
                onPress={() => { 
                  if (isLessThanOneHour) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    showSnackbar("The Buffer algorithm requires at least 1 hour of lead time before the queue starts.");
                  } else {
                    Haptics.selectionAsync(); setAlgorithm('BUFFER'); 
                  }
                }}
                activeOpacity={isLessThanOneHour ? 1 : 0.2}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.segmentText, algorithm === 'BUFFER' ? styles.segmentTextActive : { color: theme.colors.onSurfaceVariant }]}>BUFFER</Text>
                  {isLessThanOneHour && <MaterialIcons name="lock" size={14} color={theme.colors.onSurfaceVariant} />}
                </View>
              </TouchableOpacity>
            </View>

            {isLessThanOneHour && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Smart Queuing</Text>
                    <Text style={styles.helperText}>Checks travel back time for users in FCFS</Text>
                  </View>
                  <Switch 
                    value={isSmartQueuing} 
                    onValueChange={(val) => { Haptics.selectionAsync(); setIsSmartQueuing(val); }} 
                    trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.tertiary }} 
                    thumbColor={isSmartQueuing ? theme.colors.onTertiary : theme.colors.outline} 
                  />
                </View>
              </Animated.View>
            )}

            <Text style={styles.helperText}>
              {isLessThanOneHour ? 'Buffer algorithm is locked because the queue starts in less than 1 hour. Only FCFS is available.' : algorithm === 'FCFS' 
                ? 'First Come First Serve: Users are placed in the queue in the exact order they register.' 
                : 'Buffer: Collects registrations in a pool during the buffer period, then intelligently sorts and assigns queue positions to optimize throughput and fairness.'}
            </Text>

            {algorithm === 'BUFFER' && !isLessThanOneHour && (
              <Animated.View entering={FadeIn} exiting={FadeOut} layout={Layout.springify()} style={{ marginTop: 16 }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Travel Time / Buffer End ({bufferTravelTime} mins)</Text>
                  
                  <Slider
                    style={{width: '100%', height: 40, marginTop: 8}}
                    minimumValue={60}
                    maximumValue={120}
                    step={15}
                    value={bufferTravelTime}
                    onValueChange={(val) => {
                      setBufferTravelTime(val);
                      Haptics.selectionAsync();
                    }}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.surfaceContainerHighest}
                    thumbTintColor={theme.colors.primary}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.outline }}>60m</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.outline }}>2h</Text>
                  </View>

                  <Text style={[styles.helperText, { marginTop: 4, lineHeight: 18 }]}>
                    Buffer collection will automatically end exactly <Text style={{fontWeight: '700', color: theme.colors.primary}}>{bufferTravelTime} mins</Text> before the queue starts. 
                    Users will be notified of their spot at <Text style={{fontWeight: '700', color: theme.colors.onSurface}}>{bufferEndTime}</Text>, allowing them travel time to the venue.
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Section 4: Access & Requirements */}
          <View style={styles.card}>
            <SectionHeader title="Access & Requirements" icon="security" />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Visibility</Text>
                <Text style={styles.helperText}>{isPublic ? 'Public: Anyone can search and join.' : 'Private: Users need a direct link or code.'}</Text>
              </View>
              <Switch value={isPublic} onValueChange={(val) => { Haptics.selectionAsync(); setIsPublic(val); }} trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primary }} thumbColor={isPublic ? theme.colors.onPrimary : theme.colors.outline} />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput 
                  mode="outlined"
                  label="Requirements to Join"
                  placeholder="e.g. Student ID, Aadhar Card"
                  value={requirementInput}
                  onChangeText={handleRequirementChange}
                  onSubmitEditing={addRequirement}
                  returnKeyType="done"
                  multiline={true}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  style={[styles.paperInput, { flex: 1 }]}
                />
                <TouchableOpacity style={styles.addButton} onPress={addRequirement}>
                  <MaterialIcons name="add" size={24} color={theme.colors.onPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {requirements.length > 0 && (
              <View style={styles.chipContainer}>
                {requirements.map((req, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{req}</Text>
                    <TouchableOpacity onPress={() => removeRequirement(req)}>
                      <MaterialIcons name="close" size={16} color={theme.colors.onSecondaryContainer} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </KeyboardAwareScrollView>

      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={onConfirmTime}
        hours={parseInt(
          (activeTimeField === 'start' ? startTime 
            : activeTimeField === 'end' ? endTime 
            : activeTimeField === 'breakStart' ? breakStartTime 
            : breakEndTime).split(':')[0]
        )}
        minutes={parseInt(
          (activeTimeField === 'start' ? startTime 
            : activeTimeField === 'end' ? endTime 
            : activeTimeField === 'breakStart' ? breakStartTime 
            : breakEndTime).split(':')[1]
        )}
        label={
          activeTimeField === 'start' ? 'Select Start Time' :
          activeTimeField === 'end' ? 'Select End Time' :
          activeTimeField === 'breakStart' ? 'Select Break Start' : 'Select Break End'
        }
        use24HourClock={false}
        animationType="fade"
      />

      {datePickerVisible && Platform.OS === 'android' && (
        <DateTimePicker
          value={activeDateField === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          minimumDate={activeDateField === 'start' ? new Date() : startDate}
          onValueChange={onConfirmDateAndroid}
          onDismiss={() => setDatePickerVisible(false)}
        />
      )}

      {datePickerVisible && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: theme.colors.surface, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                  <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: 'bold' }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={activeDateField === 'start' ? startDate : endDate}
                mode="date"
                display="inline"
                minimumDate={activeDateField === 'start' ? new Date() : startDate}
                onValueChange={onConfirmDateIOS}
                accentColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
              />
            </View>
          </View>
        </Modal>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
        action={snackbarAction}
        wrapperStyle={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 60 : 80 }}
        style={{ backgroundColor: theme.colors.inverseSurface, borderRadius: 8 }}
      >
        <Text style={{ color: theme.colors.inverseOnSurface }}>{snackbarMessage}</Text>
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '400',
    color: theme.colors.onSurface,
    marginLeft: 16,
  },
  headerAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.outline,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  paperInput: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  helperText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    maxWidth: '90%',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    marginVertical: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderRadius: 100,
    padding: 4,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  segmentTextActive: {
    color: theme.colors.onPrimary,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.onSecondaryContainer,
    fontWeight: '500',
  },
});
