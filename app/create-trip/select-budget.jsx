// SelectTraveller.js
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import OptionCard from '../../components/CreateTrip/OptionCard';
import { SelectBudgetList } from '../../constants/Options';
import { CreateTripContext } from '../../context/CreateTripContext';

const { width } = Dimensions.get('window');

const SelectBudget = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const { tripData, setTripData } = useContext(CreateTripContext);
  const navigation = useNavigation();
  const router = useRouter();
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

  useEffect(() => {
    if (selectedOption) {
      setTripData({ ...tripData, budget: selectedOption?.title})
    }
  }, [selectedOption])

  const handleContinue = () => {
    if (selectedOption) {
      // Navigate to next step
      router.push('create-trip/review-trip');
    }
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
                <Ionicons name="people" size={50} color="white" />
              </View>
            </View>
            
            <Text style={styles.mainTitle}>What's your budget?</Text>
            <Text style={styles.subtitle}>
              Choose spending habits for your trip
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Budget</Text>
              <Text style={styles.sectionSubtitle}>
                This helps us customize your itinerary and recommendations
              </Text>
            </View>

            <FlatList
              data={SelectBudgetList}
              renderItem={({ item, index }) => (
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{
                      translateY: slideAnim
                    }]
                  }}
                >
                  <TouchableOpacity
                    style={styles.optionContainer}
                    onPress={() => setSelectedOption(item)}
                    activeOpacity={0.7}
                  >
                    <OptionCard 
                      option={item} 
                      selectedOption={selectedOption} 
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />

            {/* Continue Button */}
            {selectedOption && (
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

export default SelectBudget

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
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 30,
    paddingHorizontal: 25,
  },
  sectionHeader: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#333',
    fontFamily: 'poppins-Bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'poppins',
    lineHeight: 22,
  },
  listContainer: {
    paddingBottom: 100,
  },
  optionContainer: {
    marginBottom: 15,
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
    fontSize: 18,
    fontFamily: 'poppins-Bold',
  },
  buttonIcon: {
    marginLeft: 10,
  },
});

