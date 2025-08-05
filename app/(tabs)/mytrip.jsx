import Ionicons from '@expo/vector-icons/Ionicons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
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
import StartNewTrip from '../../components/MyTrips/StartNewTrip';


const { width } = Dimensions.get('window');

const MyTrip = () => {
  const [userTrips, setUserTrips] = useState([]);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  const handleLogout = async () => {
    try {
      // Firebase sign out
      await signOut(getAuth());

      // Google sign out
      await GoogleSignin.signOut();

      // Navigate to login screen
      router.replace('/auth/sign-in');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Logout Failed', error.message || 'Something went wrong');
    }
  };

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



  // Mock trip data for when user has trips
  const mockTrips = [
    {
      id: 1,
      destination: 'Paris, France',
      dates: 'Dec 15-22, 2024',
      image: '🇫🇷',
      status: 'upcoming',
      days: 7
    },
    {
      id: 2,
      destination: 'Tokyo, Japan',
      dates: 'Jan 10-17, 2025',
      image: '🇯🇵',
      status: 'planning',
      days: 8
    }
  ];

  const renderTripCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.tripCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim
            }
          ]
        }
      ]}
    >
      <TouchableOpacity style={styles.tripCardContent}>
        <View style={styles.tripImageContainer}>
          <Text style={styles.tripEmoji}>{item.image}</Text>
          <View style={[styles.statusBadge,
          item.status === 'upcoming' ? styles.upcomingBadge : styles.planningBadge
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'upcoming' ? 'Upcoming' : 'Planning'}
            </Text>
          </View>
        </View>

        <View style={styles.tripInfo}>
          <Text style={styles.tripDestination}>{item.destination}</Text>
          <Text style={styles.tripDates}>{item.dates}</Text>
          <View style={styles.tripMeta}>
            <View style={styles.daysInfo}>
              <Ionicons name="calendar-outline" size={14} color="#667eea" />
              <Text style={styles.daysText}>{item.days} days</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="chevron-forward" size={20} color="#667eea" />
        </TouchableOpacity>
      </TouchableOpacity>
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
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>My Trips</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.headerSubtitle}>
                  {userTrips.length === 0
                    ? 'Ready to explore the world?'
                    : `${userTrips.length} trip${userTrips.length !== 1 ? 's' : ''} planned`
                  }
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('create-trip/search-place')}
              >
                <LinearGradient
                  colors={['#ff6b6b', '#ee5a24']}
                  style={styles.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="add" size={28} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            {userTrips.length > 0 && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userTrips.length}</Text>
                  <Text style={styles.statLabel}>Total Trips</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>2</Text>
                  <Text style={styles.statLabel}>Countries</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>15</Text>
                  <Text style={styles.statLabel}>Days</Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Content Section */}
          <View style={styles.contentContainer}>
            {userTrips?.length === 0 ? (
              <StartNewTrip />
            ) : (
              <View style={styles.tripsContainer}>
                {/* Filter/Sort Header */}
                <View style={styles.tripsHeader}>
                  <Text style={styles.tripsHeaderTitle}>Your Adventures</Text>
                  <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="filter-outline" size={20} color="#667eea" />
                    <Text style={styles.filterText}>Filter</Text>
                  </TouchableOpacity>
                </View>

                {/* Trips List */}
                <FlatList
                  data={userTrips}
                  renderItem={renderTripCard}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.tripsList}
                />

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => router.push('create-trip/search-place')}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="add-circle" size={24} color="#667eea" />
                    </View>
                    <Text style={styles.quickActionText}>Plan New Trip</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.quickActionButton}>
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="compass" size={24} color="#10ac84" />
                    </View>
                    <Text style={styles.quickActionText}>Explore Ideas</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.quickActionButton}>
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="bookmark" size={24} color="#ff6b6b" />
                    </View>
                    <Text style={styles.quickActionText}>Saved Places</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}

export default MyTrip

const styles = StyleSheet.create({
  headerGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 30,
    color: 'white',
    fontFamily: 'poppins-Bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'poppins',
  },
  addButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#ff6b6b',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  addButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'poppins-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'poppins',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -10,
  },
  tripsContainer: {
    flex: 1,
    padding: 20,
  },
  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tripsHeaderTitle: {
    fontSize: 24,
    color: '#333',
    fontFamily: 'poppins-Bold',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterText: {
    fontSize: 14,
    color: '#667eea',
    fontFamily: 'poppins',
    marginLeft: 5,
  },
  tripsList: {
    paddingBottom: 20,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  tripCardContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  tripImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  tripEmoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 60,
  },
  upcomingBadge: {
    backgroundColor: '#10ac84',
  },
  planningBadge: {
    backgroundColor: '#ff6b6b',
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'poppins-Bold',
  },
  tripInfo: {
    flex: 1,
  },
  tripDestination: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'poppins-Bold',
    marginBottom: 4,
  },
  tripDates: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'poppins',
    marginBottom: 8,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysText: {
    fontSize: 12,
    color: '#667eea',
    fontFamily: 'poppins',
    marginLeft: 4,
  },
  moreButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'poppins',
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

});