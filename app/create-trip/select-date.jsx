import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import moment from 'moment';
import { useContext, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { CreateTripContext } from '../../context/CreateTripContext';

const { width } = Dimensions.get('window');

const SelectDate = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { tripData, setTripData } = useContext(CreateTripContext);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalDays, setTotalDays] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: '',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      ),
    })
  }, [])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  
 const onDateChange = (date, type) => {
  if (type === 'END_DATE') {
    const endMoment = moment(date);
    setEndDate(endMoment);
    
    if (!startDate) {
      ToastAndroid.show('Please Select Start Date First');
      Alert.alert('Please Select Start Date First');
      return;
    }
    
    // Fix: Use moment objects for diff calculation
    const days = endMoment.diff(startDate, 'days') + 1;
    setTotalDays(days);
    
    // Update context
    setTripData({
      ...tripData,
      startDate: startDate,
      endDate: endMoment,
      totalNoOfDays: days
    });
  } else {
    setStartDate(moment(date));
    setEndDate(null);
    setTotalDays(0);
  }
};

  const handleContinue = () => {
    if (startDate && endDate) {
      router.push('create-trip/select-budget');
    }
  };

 const formatDate = (date) => {
  if (!date) return '';
  return moment(date).format('MMM DD, YYYY');
};

  const getQuickDateOptions = () => [
    { label: 'Weekend (2 days)', days: 2 },
    { label: 'Long Weekend (3 days)', days: 3 },
    { label: 'Week (7 days)', days: 7 },
    { label: '2 Weeks (14 days)', days: 14 }
  ];

const handleQuickSelect = (days) => {
  const start = moment(); // Use moment for consistency
  const end = moment().add(days - 1, 'days'); // Use moment for consistency
  
  setStartDate(start);
  setEndDate(end);
  setTotalDays(days);
  
  setTripData({
    ...tripData,
    startDate: start,
    endDate: end,
    totalNoOfDays: days
  });
};
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          {/* Header Section */}
          <Animated.View 
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons name="calendar" size={50} color="white" />
              </View>
            </View>
            
            <Text style={styles.mainTitle}>When's Your Trip?</Text>
            <Text style={styles.subtitle}>
              Select your travel dates to get the best recommendations
            </Text>
          </Animated.View>

          {/* Content Section */}
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date Summary */}
              <View style={styles.dateSummary}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <View style={styles.dateValue}>
                    <Ionicons name="calendar-outline" size={16} color="#667eea" />
                    <Text style={styles.dateText}>
                      {startDate ? formatDate(startDate) : 'Select date'}
                    </Text>
                  </View>
                </View>

                <View style={styles.dateDivider}>
                  <Ionicons name="arrow-forward" size={20} color="#ccc" />
                </View>

                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <View style={styles.dateValue}>
                    <Ionicons name="calendar-outline" size={16} color="#667eea" />
                    <Text style={styles.dateText}>
                      {endDate ? formatDate(endDate) : 'Select date'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Total Days */}
              {totalDays > 0 && (
                <View style={styles.totalDaysContainer}>
                  <View style={styles.totalDaysCard}>
                    <Ionicons name="time-outline" size={24} color="#10ac84" />
                    <Text style={styles.totalDaysText}>
                      {totalDays} day{totalDays !== 1 ? 's' : ''} trip
                    </Text>
                  </View>
                </View>
              )}

              {/* Quick Select Options */}
              <View style={styles.quickSelectSection}>
                <Text style={styles.quickSelectTitle}>Quick Select</Text>
                <View style={styles.quickSelectGrid}>
                  {getQuickDateOptions().map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.quickSelectButton,
                        totalDays === option.days && styles.selectedQuickSelect
                      ]}
                      onPress={() => handleQuickSelect(option.days)}
                    >
                      <Text style={[
                        styles.quickSelectText,
                        totalDays === option.days && styles.selectedQuickSelectText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Calendar */}
              <View style={styles.calendarContainer}>
                <Text style={styles.calendarTitle}>Select Custom Dates</Text>
                <View style={styles.calendarWrapper}>
                  <CalendarPicker
                    onDateChange={onDateChange}
                    allowRangeSelection={true}
                    minDate={new Date()}
                    selectedDayColor="#667eea"
                    selectedDayTextColor="#FFFFFF"
                    selectedRangeStyle={{
                      backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    }}
                    todayBackgroundColor="rgba(102, 126, 234, 0.1)"
                    textStyle={{
                      fontFamily: 'poppins',
                      color: '#333',
                    }}
                    monthTitleStyle={{
                      fontFamily: 'poppins-Bold',
                      fontSize: 18,
                      color: '#333',
                    }}
                    yearTitleStyle={{
                      fontFamily: 'poppins-Bold',
                      fontSize: 18,
                      color: '#333',
                    }}
                    previousTitleStyle={{
                      fontFamily: 'poppins',
                      color: '#667eea',
                    }}
                    nextTitleStyle={{
                      fontFamily: 'poppins',
                      color: '#667eea',
                    }}
                    dayLabelsWrapper={{
                      borderTopWidth: 0,
                      borderBottomWidth: 0,
                    }}
                    customDatesStyles={[]}
                    scaleFactor={375}
                    width={width - 60}
                  />
                </View>
              </View>

              {/* Travel Tips */}
              <View style={styles.tipsContainer}>
                <View style={styles.tipItem}>
                  <Ionicons name="bulb-outline" size={20} color="#ff6b6b" />
                  <Text style={styles.tipText}>
                    Book flights 2-3 months in advance for better deals
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="trending-down-outline" size={20} color="#10ac84" />
                  <Text style={styles.tipText}>
                    Travel on weekdays to save up to 30% on accommodation
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Continue Button */}
            {startDate && endDate && (
              <Animated.View
                style={[
                  styles.buttonContainer,
                  {
                    opacity: fadeAnim,
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinue}
                >
                  <LinearGradient
                    colors={['#10ac84', '#06d6a0']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}

export default SelectDate

const styles = StyleSheet.create({
  headerGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 25,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  mainTitle: {
    fontSize: 32,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'poppins-Bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontFamily: 'poppins',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 30,
    paddingHorizontal: 25,
  },
  dateSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'poppins',
    marginBottom: 8,
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'poppins',
    marginLeft: 6,
  },
  dateDivider: {
    marginHorizontal: 15,
  },
  totalDaysContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  totalDaysCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#10ac84',
  },
  totalDaysText: {
    fontSize: 16,
    color: '#10ac84',
    fontFamily: 'poppins-Bold',
    marginLeft: 8,
  },
  quickSelectSection: {
    marginBottom: 30,
  },
  quickSelectTitle: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'poppins-Bold',
    marginBottom: 15,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickSelectButton: {
    width: '48%',
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedQuickSelect: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  quickSelectText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'poppins',
    textAlign: 'center',
  },
  selectedQuickSelectText: {
    color: 'white',
    fontFamily: 'poppins-Bold',
  },
  calendarContainer: {
    marginBottom: 25,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'poppins-Bold',
    marginBottom: 15,
  },
  calendarWrapper: {
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tipsContainer: {
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 100,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontFamily: 'poppins',
    marginLeft: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 25,
    right: 25,
  },
  continueButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#10ac84',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'poppins-Bold',
  },
  buttonIcon: {
    marginLeft: 10,
  },
});