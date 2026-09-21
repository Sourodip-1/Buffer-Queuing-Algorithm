import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Modal, Platform, Switch } from 'react-native';
import { TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { TimePickerModal, DatePickerModal } from 'react-native-paper-dates';
import Animated, { FadeIn, FadeOut, Layout, SlideInDown, SlideOutDown, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

type WorkflowQueue = {
  id: string;
  name: string;
  staff: string[];
};

type WorkflowStep = {
  id: string;
  queues: WorkflowQueue[];
};

export default function CreateWorkflowPage() {
  const router = useRouter();

  // Basic Info
  const [workflowName, setWorkflowName] = useState('');
  const [description, setDescription] = useState('');
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null);
  const [isWorkflowEnabled, setIsWorkflowEnabled] = useState(true);

  // Master Timings & Algorithm
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [hasBreak, setHasBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState('13:00');
  const [breakEndTime, setBreakEndTime] = useState('14:00');
  const [algorithm, setAlgorithm] = useState<'FCFS' | 'BUFFER'>('BUFFER');
  const [segmentWidth, setSegmentWidth] = useState(0);

  // Date/Time Picker State
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | 'breakStart' | 'breakEnd' | null>(null);

  const onConfirmDate = React.useCallback((params: any) => {
    setDatePickerVisible(false);
    if (params.date) setDate(params.date);
  }, []);

  const onConfirmTime = React.useCallback(({ hours, minutes }: { hours: number; minutes: number }) => {
    setTimePickerVisible(false);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    if (activeTimeField === 'start') setStartTime(formattedTime);
    if (activeTimeField === 'end') setEndTime(formattedTime);
    if (activeTimeField === 'breakStart') setBreakStartTime(formattedTime);
    if (activeTimeField === 'breakEnd') setBreakEndTime(formattedTime);
  }, [activeTimeField]);

  const openTimePicker = (field: 'start' | 'end' | 'breakStart' | 'breakEnd') => {
    setActiveTimeField(field);
    setTimePickerVisible(true);
  };

  const format12Hour = (time24: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  // 1 hr buffer lock
  const isLessThanOneHour = useMemo(() => {
    const startDateTime = new Date(date);
    const [startH, startM] = startTime.split(':').map(Number);
    startDateTime.setHours(startH, startM, 0, 0);

    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    return startDateTime < oneHourFromNow;
  }, [date, startTime]);

  useEffect(() => {
    if (isLessThanOneHour && algorithm === 'BUFFER') {
      setAlgorithm('FCFS');
    }
  }, [isLessThanOneHour, algorithm]);

  const translateX = useDerivedValue(() => {
    return withTiming(algorithm === 'FCFS' ? 0 : (segmentWidth - 8) / 2, { duration: 250 });
  }, [algorithm, segmentWidth]);

  const animatedSegmentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Workflow Graph
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: 'step-1', queues: [{ id: 'q-1', name: 'Initial Queue', staff: [] }] }
  ]);

  // Modal State for Editing a Queue
  const [editingQueue, setEditingQueue] = useState<{ stepId: string, queueId: string } | null>(null);
  const [tempQueueName, setTempQueueName] = useState('');
  const [tempStaffInput, setTempStaffInput] = useState('');
  const [tempStaffList, setTempStaffList] = useState<string[]>([]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/customer-dashboard' as any);
    }
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

  const handlePublish = () => {
    if (!workflowName.trim()) {
      Alert.alert("Missing Fields", "Please provide a name for the workflow.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Reset Form
    setWorkflowName('');
    setDescription('');
    setCoverPhotoUri(null);
    setSteps([{ id: 'step-1', queues: [{ id: 'q-1', name: 'Initial Queue', staff: [] }] }]);

    handleGoBack();
  };

  const addNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSteps(prev => [
      ...prev,
      { id: `step-${Date.now()}`, queues: [{ id: `q-${Date.now()}`, name: 'Next Queue', staff: [] }] }
    ]);
  };

  const addParallelQueue = (stepId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          queues: [...step.queues, { id: `q-${Date.now()}`, name: 'Parallel Queue', staff: [] }]
        };
      }
      return step;
    }));
  };

  const removeQueue = (stepId: string, queueId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSteps(prev => {
      let newSteps = prev.map(step => {
        if (step.id === stepId) {
          return { ...step, queues: step.queues.filter(q => q.id !== queueId) };
        }
        return step;
      });
      // Remove step entirely if it has no queues left
      return newSteps.filter(step => step.queues.length > 0);
    });
  };

  const openQueueEditor = (stepId: string, queue: WorkflowQueue) => {
    setEditingQueue({ stepId, queueId: queue.id });
    setTempQueueName(queue.name);
    setTempStaffList([...queue.staff]);
    setTempStaffInput('');
  };

  const saveQueueEditor = () => {
    if (editingQueue) {
      setSteps(prev => prev.map(step => {
        if (step.id === editingQueue.stepId) {
          return {
            ...step,
            queues: step.queues.map(q => {
              if (q.id === editingQueue.queueId) {
                return { ...q, name: tempQueueName || 'Unnamed Queue', staff: tempStaffList };
              }
              return q;
            })
          };
        }
        return step;
      }));
    }
    setEditingQueue(null);
  };

  const handleStaffInputChange = (text: string) => {
    if (text.includes(',') || text.includes('\n')) {
      const parts = text.split(/,|\n/).map(t => t.trim()).filter(t => t.length > 0 && !tempStaffList.includes(t));
      if (parts.length > 0) {
        setTempStaffList(prev => [...prev, ...parts]);
      }
      setTempStaffInput('');
    } else {
      setTempStaffInput(text);
    }
  };

  const removeStaff = (staffName: string) => {
    setTempStaffList(prev => prev.filter(s => s !== staffName));
  };

  const SectionHeader = ({ title, icon }: { title: string, icon: string }) => (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon as any} size={20} color={theme.colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Workflow</Text>
        <TouchableOpacity style={styles.headerAction} onPress={handlePublish}>
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
          
          <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage} activeOpacity={0.8}>
            {coverPhotoUri ? (
              <View style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
                <Image source={{ uri: coverPhotoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 }}>
                  <MaterialIcons name="edit" size={16} color="#fff" />
                </View>
              </View>
            ) : (
              <>
                <MaterialIcons name="add-photo-alternate" size={32} color={theme.colors.outline} />
                <Text style={styles.imagePlaceholderText}>Add Workflow Cover Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <TextInput 
              mode="outlined"
              label="Workflow Name"
              placeholder="e.g. Complete Repair Journey"
              value={workflowName}
              onChangeText={setWorkflowName}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={styles.paperInput}
            />
          </View>
          <View style={styles.inputGroup}>
            <TextInput 
              mode="outlined"
              label="Description (Optional)"
              placeholder="What is this workflow for?"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={styles.paperInput}
            />
          </View>
        </View>

        {/* Section 2: Flow Builder */}
        <View style={styles.card}>
          <SectionHeader title="Workflow Steps" icon="account-tree" />
          <Text style={styles.helperText}>
            Build the sequential journey for your users. Add parallel branches if users can be routed to different queues at the same step.
          </Text>

          <View style={styles.timelineContainer}>
            {steps.map((step, stepIndex) => (
              <Animated.View key={step.id} entering={FadeIn} layout={Layout.duration(200)}>
                
                {/* Step Connector Line (unless it's the very first node) */}
                {stepIndex > 0 && (
                  <View style={styles.timelineConnector}>
                    <View style={styles.timelineLine} />
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={theme.colors.outline} style={{ marginVertical: -4 }} />
                  </View>
                )}

                <View style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{stepIndex + 1}</Text>
                    </View>
                    <Text style={styles.stepLabel}>Step {stepIndex + 1}</Text>
                  </View>

                  <View style={styles.queuesRow}>
                    {step.queues.map((queue) => (
                      <Animated.View key={queue.id} layout={Layout.duration(200)} style={styles.queueNodeWrapper}>
                        <TouchableOpacity 
                          style={styles.queueNode} 
                          onPress={() => openQueueEditor(step.id, queue)}
                          activeOpacity={0.7}
                        >
                          <TouchableOpacity 
                            style={styles.removeQueueButton} 
                            onPress={() => removeQueue(step.id, queue.id)}
                          >
                            <MaterialIcons name="close" size={14} color="#fff" />
                          </TouchableOpacity>
                          <MaterialIcons name="groups" size={24} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                          <Text style={styles.queueNodeName} numberOfLines={2} ellipsizeMode="tail">{queue.name}</Text>
                          <View style={styles.staffBadge}>
                            <MaterialIcons name="person" size={12} color={theme.colors.onSecondaryContainer} />
                            <Text style={styles.staffBadgeText}>{queue.staff.length}</Text>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                    
                    {/* Add Parallel Queue Button */}
                    <TouchableOpacity style={styles.addParallelButton} onPress={() => addParallelQueue(step.id)}>
                      <MaterialIcons name="add" size={24} color={theme.colors.primary} />
                      <Text style={styles.addParallelText}>Branch</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ))}

            <TouchableOpacity style={styles.addStepButton} onPress={addNextStep}>
              <MaterialIcons name="add-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.addStepText}>Add Next Step</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </KeyboardAwareScrollView>

      {/* Queue Editor Bottom Sheet Modal */}
      <Modal visible={!!editingQueue} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={saveQueueEditor} />
          
          <Animated.View entering={SlideInDown.duration(250)} exiting={SlideOutDown} style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Edit Queue Step</Text>
              <TouchableOpacity onPress={saveQueueEditor} style={styles.modalCloseButton}>
                <MaterialIcons name="check" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <TextInput 
                mode="outlined"
                label="Queue Name"
                value={tempQueueName}
                onChangeText={setTempQueueName}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.paperInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput 
                mode="outlined"
                label="Assign Staff"
                placeholder="Enter names separated by comma"
                value={tempStaffInput}
                onChangeText={handleStaffInputChange}
                multiline
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.paperInput}
              />
            </View>

            {tempStaffList.length > 0 && (
              <View style={styles.chipContainer}>
                {tempStaffList.map((staff, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{staff}</Text>
                    <TouchableOpacity onPress={() => removeStaff(staff)}>
                      <MaterialIcons name="close" size={16} color={theme.colors.onSecondaryContainer} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 20 }} />
          </Animated.View>
        </View>
      </Modal>

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
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  imagePlaceholder: {
    height: 160,
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
  helperText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: -8,
    marginBottom: 20,
    lineHeight: 18,
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    height: 40,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  stepContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumberBadge: {
    backgroundColor: theme.colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepNumberText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  queuesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  queueNodeWrapper: {
    width: '48%',
  },
  queueNode: {
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  removeQueueButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  queueNodeName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  staffBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.onSecondaryContainer,
  },
  addParallelButton: {
    width: '48%',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  addParallelText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 4,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  addStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  modalCloseButton: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    padding: 8,
    borderRadius: 20,
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
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.onSecondaryContainer,
  },
});
