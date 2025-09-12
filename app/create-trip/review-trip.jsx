// ReviewTrip.js
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import moment from 'moment';
import { useContext, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CreateTripContext } from '../../context/CreateTripContext';

const { width } = Dimensions.get('window');

const ReviewTrip = () => {
  const { tripData, setTripData } = useContext(CreateTripContext);
  const navigation = useNavigation();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

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
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    // Navigate to next step - trip generation
    router.push('/create-trip/generated-trip');
  };

  const handleEdit = (section) => {
    // Navigate back to specific section for editing
    switch(section) {
      case 'destination':
        router.push('create-trip/search-place');
        break;
      case 'travellers':
        router.push('create-trip/select-traveller');
        break;
      case 'budget':
        router.push('create-trip/select-budget');
        break;
      case 'dates':
        router.push('create-trip/select-date');
        break;
    }
  };

  const formatDateRange = () => {
    if (!tripData?.startDate || !tripData?.endDate) return 'Dates not selected';
    
    const start = moment(tripData.startDate);
    const end = moment(tripData.endDate);
    
    if (start.year() === end.year()) {
      return `${start.format('MMM DD')} - ${end.format('MMM DD, YYYY')}`;
    }
    return `${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`;
  };

  const ReviewCard = ({ icon, title, value, subtitle, onEdit, editSection }) => (
    <Animated.View
      style={[
        styles.reviewCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <View style={[styles.iconCircle, { backgroundColor: `${icon.color}15` }]}>
            <Ionicons name={icon.name} size={24} color={icon.color} />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEdit(editSection)}
        >
          <Ionicons name="pencil" size={16} color="#667eea" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardValue}>{value}</Text>
        {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      </View>
    </Animated.View>
  );

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
                <Ionicons name="checkmark-circle" size={50} color="white" />
              </View>
            </View>
            
            <Text style={styles.mainTitle}>Review Your Trip</Text>
            <Text style={styles.subtitle}>
              Almost there! Review your selections before we create your perfect itinerary
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
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Trip Summary Header */}
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Trip Summary</Text>
                <Text style={styles.summarySubtitle}>
                  Your personalized travel experience
                </Text>
              </View>

              {/* Destination Card */}
              <ReviewCard
                icon={{ name: 'location', color: '#ff6b6b' }}
                title="Destination"
                value={tripData?.locationInfo?.name || 'Not selected'}
                subtitle={tripData?.locationInfo?.description}
                editSection="destination"
              />

              {/* Travel Dates Card */}
              <ReviewCard
                icon={{ name: 'calendar', color: '#4ecdc4' }}
                title="Travel Dates"
                value={formatDateRange()}
                subtitle={`${tripData?.totalNoOfDays || 0} day${(tripData?.totalNoOfDays || 0) !== 1 ? 's' : ''} trip`}
                editSection="dates"
              />

              {/* Travellers Card */}
              <ReviewCard
                icon={{ name: 'people', color: '#45b7d1' }}
                title="Travellers"
                value={tripData?.travelCount?.title || 'Not selected'}
                subtitle={tripData?.travelCount?.desc}
                editSection="travellers"
              />

              {/* Budget Card */}
              <ReviewCard
                icon={{ name: 'wallet', color: '#96ceb4' }}
                title="Budget"
                value={tripData?.budget || 'Not selected'}
                subtitle="Per person estimated cost"
                editSection="budget"
              />

              {/* Trip Preview */}
              <Animated.View
                style={[
                  styles.previewCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.previewGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.previewContent}>
                    <Ionicons name="airplane" size={32} color="white" />
                    <Text style={styles.previewTitle}>Ready to Explore?</Text>
                    <Text style={styles.previewText}>
                      We'll create a personalized itinerary with the best places to visit, 
                      recommended hotels, and local experiences.
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Benefits List */}
              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>What's Included</Text>
                
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10ac84" />
                  <Text style={styles.benefitText}>Personalized daily itinerary</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10ac84" />
                  <Text style={styles.benefitText}>Hotel recommendations</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10ac84" />
                  <Text style={styles.benefitText}>Local attractions & activities</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10ac84" />
                  <Text style={styles.benefitText}>Budget-optimized suggestions</Text>
                </View>
              </View>
            </ScrollView>

            {/* Continue Button */}
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10ac84', '#06d6a0']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="sparkles" size={20} color="white" style={styles.buttonIconLeft} />
                  <Text style={styles.buttonText}>Generate My Trip</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}

export default ReviewTrip

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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    fontSize: 30,
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 120,
  },
  summaryHeader: {
    marginBottom: 30,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 22,
    color: '#333',
    fontFamily: 'poppins-Bold',
    marginBottom: 8,
  },
  summarySubtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'poppins',
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    color: '#333',
    fontFamily: 'poppins-Bold',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardContent: {
    paddingLeft: 52,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'poppins-Medium',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'poppins',
    lineHeight: 20,
  },
  previewCard: {
    marginVertical: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  previewGradient: {
    padding: 25,
  },
  previewContent: {
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 21,
    color: 'white',
    fontFamily: 'poppins-Bold',
    marginVertical: 15,
  },
  previewText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontFamily: 'poppins',
    lineHeight: 24,
  },
  benefitsContainer: {
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  benefitsTitle: {
    fontSize: 18,
   // fontWeight: 'bold',
    color: '#333',
    fontFamily: 'poppins-Bold',
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'poppins',
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 25,
    right: 25,
  },
  continueButton: {
    borderRadius: 20,
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
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'poppins-semiBold',
    marginHorizontal: 10,
  },
  buttonIconLeft: {
    marginRight: 5,
  },
  buttonIcon: {
    marginLeft: 5,
  },
});