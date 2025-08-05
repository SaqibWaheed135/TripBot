import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CreateTripContext } from '../../context/CreateTripContext';

const { width } = Dimensions.get('window');

const SearchPlace = () => {
  const { tripData, setTripData } = useContext(CreateTripContext);
  const navigation = useNavigation();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [searchText, setSearchText] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([
    'Paris, France',
    'Tokyo, Japan',
    'New York, USA',
    'London, UK',
    'Dubai, UAE'
  ]);

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
    });
  }, []);

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

  // Enhanced search with better error handling and fallback
  const searchPlacesNominatim = async (query) => {
    if (query.length < 2) {
      setPlaces([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Add proper headers and user agent to avoid blocking
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=15&addressdetails=1&extratags=1`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'TravelApp/1.0',
          },
        }
      );

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Received non-JSON response, falling back to local search');
        // Fallback to local search
        searchPlacesLocal(query);
        return;
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }

      const formattedPlaces = data
        .filter(place => place.importance > 0.3)
        .map(place => {
          const address = place.address || {};
          const displayName = place.display_name;
          
          const city = address.city || address.town || address.village || address.municipality;
          const state = address.state || address.region || address.province;
          const country = address.country;
          
          let cleanName = '';
          if (city && country) {
            cleanName = state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;
          } else if (country) {
            cleanName = displayName.split(',').slice(0, 2).join(',') + `, ${country}`;
          } else {
            cleanName = displayName.split(',').slice(0, 3).join(',');
          }

          return {
            id: place.place_id,
            name: cleanName,
            fullName: displayName,
            latitude: parseFloat(place.lat),
            longitude: parseFloat(place.lon),
            type: place.type,
            category: place.category,
            importance: place.importance,
            country: country,
            city: city,
            state: state,
            bbox: place.boundingbox,
            photoReference: null,
          };
        })
        .sort((a, b) => b.importance - a.importance);
      
      setPlaces(formattedPlaces);
    } catch (error) {
      console.error('Error searching places:', error);
      setError('Unable to search places. Please try again.');
      
      // Fallback to local/mock search
      searchPlacesLocal(query);
    }
    setLoading(false);
  };

  // Fallback local search function
  const searchPlacesLocal = (query) => {
    const mockPlaces = [
      {
        id: '1',
        name: 'Paris, France',
        fullName: 'Paris, Île-de-France, France',
        latitude: 48.8566,
        longitude: 2.3522,
        type: 'city',
        category: 'place',
        importance: 0.9,
        country: 'France',
        city: 'Paris',
        state: 'Île-de-France',
        bbox: null,
        photoReference: null,
      },
      {
        id: '2',
        name: 'London, UK',
        fullName: 'London, England, United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
        type: 'city',
        category: 'place',
        importance: 0.9,
        country: 'United Kingdom',
        city: 'London',
        state: 'England',
        bbox: null,
        photoReference: null,
      },
      {
        id: '3',
        name: 'New York, USA',
        fullName: 'New York, New York, United States',
        latitude: 40.7128,
        longitude: -74.0060,
        type: 'city',
        category: 'place',
        importance: 0.9,
        country: 'United States',
        city: 'New York',
        state: 'New York',
        bbox: null,
        photoReference: null,
      },
      {
        id: '4',
        name: 'Tokyo, Japan',
        fullName: 'Tokyo, Japan',
        latitude: 35.6762,
        longitude: 139.6503,
        type: 'city',
        category: 'place',
        importance: 0.9,
        country: 'Japan',
        city: 'Tokyo',
        state: null,
        bbox: null,
        photoReference: null,
      },
      {
        id: '5',
        name: 'Dubai, UAE',
        fullName: 'Dubai, United Arab Emirates',
        latitude: 25.2048,
        longitude: 55.2708,
        type: 'city',
        category: 'place',
        importance: 0.9,
        country: 'United Arab Emirates',
        city: 'Dubai',
        state: null,
        bbox: null,
        photoReference: null,
      },
    ];

    const filteredPlaces = mockPlaces.filter(place =>
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.fullName.toLowerCase().includes(query.toLowerCase())
    );

    setPlaces(filteredPlaces);
  };

  // Alternative API search function (you can uncomment and use this instead)
  const searchPlacesAlternative = async (query) => {
    if (query.length < 2) {
      setPlaces([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Using a different geocoding service - MapBox (requires API key)
      // Replace 'YOUR_MAPBOX_TOKEN' with your actual MapBox token
      /*
      const MAPBOX_TOKEN = 'YOUR_MAPBOX_TOKEN';
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=15&types=place,locality,region,country`
      );
      
      const data = await response.json();
      
      const formattedPlaces = data.features.map((feature, index) => ({
        id: feature.id || index,
        name: feature.place_name.split(',').slice(0, 2).join(','),
        fullName: feature.place_name,
        latitude: feature.center[1],
        longitude: feature.center[0],
        type: feature.place_type[0],
        category: 'place',
        importance: feature.relevance || 0.5,
        country: feature.context?.find(c => c.id.includes('country'))?.text,
        city: feature.context?.find(c => c.id.includes('place'))?.text,
        state: feature.context?.find(c => c.id.includes('region'))?.text,
        bbox: feature.bbox,
        photoReference: null,
      }));
      
      setPlaces(formattedPlaces);
      */
      
      // For now, fallback to local search
      searchPlacesLocal(query);
    } catch (error) {
      console.error('Error searching places:', error);
      setError('Unable to search places. Please try again.');
      searchPlacesLocal(query);
    }
    setLoading(false);
  };

  // Debounced search function
  let searchTimeout = useRef(null);
  const handleSearch = (text) => {
    setSearchText(text);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (text.trim() === '') {
      setPlaces([]);
      setError(null);
      return;
    }
    
    searchTimeout.current = setTimeout(() => {
      searchPlacesNominatim(text);
    }, 800); // Increased delay to avoid rate limiting
  };

  const handlePlaceSelect = (place) => {
    console.log('Selected place:', place);
    
    const locationInfo = {
      name: place.name,
      fullName: place.fullName,
      coordinates: {
        latitude: place.latitude,
        longitude: place.longitude,
      },
      country: place.country,
      city: place.city,
      state: place.state,
      placeId: place.id,
      bbox: place.bbox,
      photoReference: place.photoReference,
    };

    setTripData({
      ...tripData,
      locationInfo: locationInfo,
      destination: place.name,
    });

    const updatedRecentSearches = [
      place.name,
      ...recentSearches.filter(search => search !== place.name)
    ].slice(0, 5);
    setRecentSearches(updatedRecentSearches);
    
    router.push('./select-traveller');
  };

  const handleRecentSearchSelect = (searchTerm) => {
    setSearchText(searchTerm);
    searchPlacesNominatim(searchTerm);
  };

  const getPlaceIcon = (type, category) => {
    if (category === 'place' || type === 'city') return 'location-outline';
    if (category === 'tourism' || type === 'attraction') return 'camera-outline';
    if (type === 'country') return 'flag-outline';
    if (type === 'state' || type === 'administrative') return 'business-outline';
    return 'location-outline';
  };

  const renderPlaceItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.placeItemContainer,
        {
          opacity: fadeAnim,
          transform: [{
            translateX: slideAnim
          }]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.placeItem} 
        onPress={() => handlePlaceSelect(item)}
        activeOpacity={0.8}
      >
        <View style={styles.placeIconContainer}>
          <Ionicons 
            name={getPlaceIcon(item.type, item.category)} 
            size={22} 
            color="#667eea" 
          />
        </View>
        
        <View style={styles.placeContent}>
          <Text style={styles.placeName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.placeDetailsContainer}>
            {item.type && (
              <View style={styles.placeTypeTag}>
                <Text style={styles.placeTypeText}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              </View>
            )}
            <Text style={styles.placeDetails} numberOfLines={1}>
              {item.fullName}
            </Text>
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderRecentSearchItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchSelect(item)}
      activeOpacity={0.7}
    >
      <Ionicons name="time-outline" size={18} color="#999" />
      <Text style={styles.recentSearchText}>{item}</Text>
      <Ionicons name="arrow-up-outline" size={16} color="#999" />
    </TouchableOpacity>
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
                <Ionicons name="search" size={40} color="white" />
              </View>
            </View>
            
            <Text style={styles.mainTitle}>Where to?</Text>
            <Text style={styles.subtitle}>
              Search for your dream destination
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
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search destinations..."
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={handleSearch}
                returnKeyType="search"
                autoFocus={true}
              />
              {loading && (
                <ActivityIndicator 
                  style={styles.loadingIndicator} 
                  size="small" 
                  color="#667eea" 
                />
              )}
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchText('');
                    setPlaces([]);
                    setError(null);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Recent Searches - Show when no search text */}
            {searchText.length === 0 && (
              <Animated.View
                style={[
                  styles.recentSection,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <FlatList
                  data={recentSearches}
                  renderItem={renderRecentSearchItem}
                  keyExtractor={(item, index) => `recent-${index}`}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.recentList}
                />
              </Animated.View>
            )}

            {/* Search Results */}
            {places.length > 0 && (
              <Animated.View
                style={[
                  styles.resultsSection,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <Text style={styles.sectionTitle}>
                  Found {places.length} destination{places.length !== 1 ? 's' : ''}
                </Text>
                <FlatList
                  data={places}
                  renderItem={renderPlaceItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.placesList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.placesListContainer}
                />
              </Animated.View>
            )}

            {/* No Results */}
            {searchText.length > 0 && places.length === 0 && !loading && !error && (
              <Animated.View
                style={[
                  styles.noResultsContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <Ionicons name="location-outline" size={60} color="#ddd" />
                <Text style={styles.noResultsTitle}>No destinations found</Text>
                <Text style={styles.noResultsText}>
                  Try searching for cities, countries, or famous landmarks
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default SearchPlace;

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
    paddingTop: 80,
    paddingHorizontal: 25,
    paddingBottom: 30,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'poppins-Bold',
    marginBottom: 8,
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
    paddingTop: 25,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: 'poppins',
    color: '#333',
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  clearButton: {
    marginLeft: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    fontFamily: 'poppins',
    marginLeft: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'poppins-Bold',
    marginBottom: 15,
  },
  recentSection: {
    marginBottom: 20,
  },
  recentList: {
    paddingBottom: 10,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 8,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'poppins',
    color: '#666',
    marginLeft: 10,
  },
  resultsSection: {
    flex: 1,
  },
  placesList: {
    flex: 1,
  },
  placesListContainer: {
    paddingBottom: 20,
  },
  placeItemContainer: {
    marginBottom: 12,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeContent: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontFamily: 'poppins-Medium',
    color: '#333',
    marginBottom: 4,
  },
  placeDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  placeTypeTag: {
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 2,
  },
  placeTypeText: {
    fontSize: 10,
    fontFamily: 'poppins-Medium',
    color: 'white',
    textTransform: 'capitalize',
  },
  placeDetails: {
    fontSize: 12,
    fontFamily: 'poppins',
    color: '#666',
    flex: 1,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsTitle: {
    fontSize: 18,
    fontFamily: 'poppins-Bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: 'poppins',
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});