import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const StartNewTrip = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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

  const tripIdeas = [
    {
      icon: 'umbrella-beach',
      title: 'Beach Getaway',
      subtitle: 'Relax by the ocean'
    },
    {
      icon: 'mountain',
      title: 'Adventure Trek',
      subtitle: 'Explore the mountains'
    },
    {
      icon: 'city',
      title: 'City Explorer',
      subtitle: 'Urban discoveries'
    }
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <ScrollView>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.container}>
          {/* Header Section */}
          <Animated.View 
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.iconContainer}>
              <View style={styles.mainIconBackground}>
                <Entypo name="location" size={60} color="white" />
              </View>
              <View style={styles.sparkleIcon1}>
                <Ionicons name="sparkles" size={20} color="#ffd700" />
              </View>
              <View style={styles.sparkleIcon2}>
                <Ionicons name="star" size={16} color="#ff6b6b" />
              </View>
            </View>

            <Text style={styles.mainTitle}>Ready for Adventure?</Text>
            <Text style={styles.subtitle}>No trips planned yet</Text>
          </Animated.View>

          {/* Content Card */}
          <Animated.View 
            style={[
              styles.contentCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>
                Let's Plan Your Perfect Journey
              </Text>
              <Text style={styles.welcomeDescription}>
                Looks like it's time to plan a new travel experience! Our AI will help you 
                discover amazing destinations and create personalized itineraries just for you.
              </Text>
            </View>

            {/* Trip Ideas */}
            <View style={styles.ideasContainer}>
              <Text style={styles.ideasTitle}>Popular Trip Types</Text>
              <View style={styles.ideasGrid}>
                {tripIdeas.map((idea, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.ideaCard}
                    onPress={() => router.push('create-trip/search-place')}
                  >
                    <View style={styles.ideaIcon}>
                      <FontAwesome5 name={idea.icon} size={24} color="#667eea" />
                    </View>
                    <Text style={styles.ideaTitle}>{idea.title}</Text>
                    <Text style={styles.ideaSubtitle}>{idea.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Features Preview */}
            <View style={styles.featuresPreview}>
              <Text style={styles.featuresTitle}>What You'll Get</Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10ac84" />
                  <Text style={styles.featureText}>AI-curated destinations</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10ac84" />
                  <Text style={styles.featureText}>Personalized itineraries</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10ac84" />
                  <Text style={styles.featureText}>Budget optimization</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10ac84" />
                  <Text style={styles.featureText}>Real-time recommendations</Text>
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('create-trip/search-place')}
              >
                <LinearGradient
                  colors={['#ff6b6b', '#ee5a24']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="rocket" size={24} color="white" style={styles.rocketIcon} />
                  <Text style={styles.primaryButtonText}>Start Planning My Trip</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => {/* Add browse trips functionality */}}
              >
                <Text style={styles.secondaryButtonText}>
                  <Ionicons name="compass-outline" size={16} color="#667eea" /> Browse Trip Ideas
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>2 min</Text>
                <Text style={styles.statLabel}>Setup Time</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>AI-Powered</Text>
                <Text style={styles.statLabel}>Smart Planning</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>Free</Text>
                <Text style={styles.statLabel}>To Start</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
      </ScrollView>
    </>
  )
}

export default StartNewTrip

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  mainIconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  sparkleIcon1: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleIcon2: {
    position: 'absolute',
    bottom: 15,
    left: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 30,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'poppins-Bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontFamily: 'poppins',
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 25,
    padding: 25,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'poppins-Bold',
    marginBottom: 12,
    lineHeight: 30,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'poppins',
    lineHeight: 24,
    paddingHorizontal: 5,
  },
  ideasContainer: {
    marginBottom: 30,
  },
  ideasTitle: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'poppins-Bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  ideasGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ideaCard: {
    flex: 1,
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  ideaIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ideaTitle: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'poppins-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  ideaSubtitle: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'poppins',
    textAlign: 'center',
  },
  featuresPreview: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'poppins-Bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  featuresList: {
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'poppins',
    marginLeft: 12,
  },
  buttonContainer: {
    marginBottom: 25,
  },
  primaryButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#ff6b6b',
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
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'poppins-Bold',
    marginHorizontal: 8,
  },
  rocketIcon: {
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'poppins-Bold',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,

  },
  statNumber: {
    fontSize: 12,
    color: '#667eea',
    fontFamily: 'poppins-Bold',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'poppins',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: '#ddd',
  },
});