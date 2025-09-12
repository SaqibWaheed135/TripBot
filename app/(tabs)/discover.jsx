// app/trip-ideas/index.js
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { app, db } from '../../configs/FirebaseConfig.jsx';

const { width } = Dimensions.get('window');

const Discover = () => {
    const navigation = useNavigation();
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // States
    const [activeCategory, setActiveCategory] = useState('trending');
    const [tripIdeas, setTripIdeas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const categories = [
        { id: 'trending', name: 'Trending', icon: 'trending-up', color: '#ff6b6b' },
        { id: 'adventure', name: 'Adventure', icon: 'mountain', color: '#4ecdc4' },
        { id: 'relaxation', name: 'Relaxation', icon: 'leaf', color: '#45b7d1' },
        { id: 'cultural', name: 'Cultural', icon: 'library', color: '#f39c12' },
        { id: 'romantic', name: 'Romantic', icon: 'heart', color: '#e74c3c' },
        { id: 'family', name: 'Family', icon: 'people', color: '#9b59b6' },
        { id: 'budget', name: 'Budget', icon: 'wallet', color: '#27ae60' },
        { id: 'luxury', name: 'Luxury', icon: 'diamond', color: '#8e44ad' }
    ];

    // Sample trip ideas data - In real app, this would come from Gemini API
    const sampleTripIdeas = {
        trending: [
            {
                id: '1',
                destination: 'Bali, Indonesia',
                title: 'Tropical Paradise Escape',
                description: 'Experience stunning beaches, ancient temples, and vibrant culture',
                duration: '7-10 days',
                budget: '$800-1500',
                rating: 4.8,
                imageUrl: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=250&fit=crop',
                highlights: ['Beach resorts', 'Temple tours', 'Rice terraces', 'Balinese cuisine'],
                bestTime: 'Apr-Oct'
            },
            {
                id: '2',
                destination: 'Istanbul, Turkey',
                title: 'Where Europe Meets Asia',
                description: 'Rich history, stunning architecture, and amazing street food',
                duration: '5-7 days',
                budget: '$600-1200',
                rating: 4.7,
                imageUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&h=250&fit=crop',
                highlights: ['Hagia Sophia', 'Grand Bazaar', 'Bosphorus cruise', 'Turkish baths'],
                bestTime: 'Mar-May, Sep-Nov'
            },
            {
                id: '3',
                destination: 'Cape Town, South Africa',
                title: 'Adventure at the Tip of Africa',
                description: 'Stunning landscapes, wine tours, and wildlife experiences',
                duration: '8-12 days',
                budget: '$900-1800',
                rating: 4.9,
                imageUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=250&fit=crop',
                highlights: ['Table Mountain', 'Wine regions', 'Penguin colonies', 'Safari tours'],
                bestTime: 'Nov-Mar'
            }
        ],
        adventure: [
            {
                id: '4',
                destination: 'Nepal Himalayas',
                title: 'Everest Base Camp Trek',
                description: 'Challenge yourself with the world\'s most famous trek',
                duration: '12-16 days',
                budget: '$1200-2500',
                rating: 4.8,
                imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=250&fit=crop',
                highlights: ['Mountain views', 'Sherpa culture', 'Base camp', 'Buddhist monasteries'],
                bestTime: 'Mar-May, Sep-Nov'
            },
            {
                id: '5',
                destination: 'Patagonia, Chile',
                title: 'Wild Landscapes Adventure',
                description: 'Glaciers, mountains, and pristine wilderness',
                duration: '10-14 days',
                budget: '$1500-3000',
                rating: 4.9,
                imageUrl: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&h=250&fit=crop',
                highlights: ['Torres del Paine', 'Glacier hiking', 'Wildlife spotting', 'Camping'],
                bestTime: 'Nov-Mar'
            }
        ],
        relaxation: [
            {
                id: '6',
                destination: 'Maldives',
                title: 'Overwater Villa Paradise',
                description: 'Crystal clear waters and luxury resorts',
                duration: '5-8 days',
                budget: '$2000-5000',
                rating: 4.9,
                imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
                highlights: ['Overwater villas', 'Spa treatments', 'Snorkeling', 'Sunset cruises'],
                bestTime: 'Nov-Apr'
            }
        ],
        cultural: [
            {
                id: '7',
                destination: 'Kyoto, Japan',
                title: 'Ancient Temples & Modern Culture',
                description: 'Traditional architecture, gardens, and Japanese culture',
                duration: '6-9 days',
                budget: '$1000-2200',
                rating: 4.8,
                imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=250&fit=crop',
                highlights: ['Bamboo forests', 'Temple visits', 'Tea ceremonies', 'Cherry blossoms'],
                bestTime: 'Mar-May, Sep-Nov'
            }
        ],
        romantic: [
            {
                id: '8',
                destination: 'Santorini, Greece',
                title: 'Sunset Romance',
                description: 'White-washed buildings and stunning sunsets',
                duration: '4-7 days',
                budget: '$1200-2500',
                rating: 4.9,
                imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop',
                highlights: ['Sunset views', 'Wine tasting', 'Beach clubs', 'Luxury hotels'],
                bestTime: 'Apr-Oct'
            }
        ],
        family: [
            {
                id: '9',
                destination: 'Orlando, Florida',
                title: 'Theme Park Capital',
                description: 'Magic and adventure for the whole family',
                duration: '5-8 days',
                budget: '$1500-3500',
                rating: 4.7,
                imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
                highlights: ['Disney World', 'Universal Studios', 'Water parks', 'Family resorts'],
                bestTime: 'Sep-Nov, Jan-Apr'
            }
        ],
        budget: [
            {
                id: '10',
                destination: 'Vietnam',
                title: 'Southeast Asia on a Budget',
                description: 'Amazing food, culture, and landscapes for less',
                duration: '10-15 days',
                budget: '$400-800',
                rating: 4.6,
                imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=250&fit=crop',
                highlights: ['Street food', 'Ha Long Bay', 'Ancient towns', 'Motorbike tours'],
                bestTime: 'Mar-May, Sep-Nov'
            }
        ],
        luxury: [
            {
                id: '11',
                destination: 'Dubai, UAE',
                title: 'Opulent Desert Oasis',
                description: 'Ultra-luxury experiences in a modern wonderland',
                duration: '4-7 days',
                budget: '$2500-6000',
                rating: 4.8,
                imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=250&fit=crop',
                highlights: ['Burj Khalifa', 'Luxury shopping', 'Desert safari', '7-star hotels'],
                bestTime: 'Nov-Mar'
            }
        ]
    };

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
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => setShowSearch(!showSearch)}
                    style={styles.searchButton}
                >
                    <Ionicons name={showSearch ? "close" : "search"} size={24} color="white" />
                </TouchableOpacity>
            ),
        });
    }, [showSearch]);

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
        ]).start();
    }, []);

    useEffect(() => {
        loadTripIdeas();
    }, [activeCategory]);

    const loadTripIdeas = () => {
        setLoading(true);
        // Simulate API call delay
        setTimeout(() => {
            setTripIdeas(sampleTripIdeas[activeCategory] || []);
            setLoading(false);
        }, 500);
    };

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            loadTripIdeas();
            setRefreshing(false);
        }, 1000);
    }, [activeCategory]);

    const handleCreateTripFromIdea = async (idea) => {
        try {
            const auth = getAuth(app);
            const user = auth.currentUser;

            if (!user) {
                Alert.alert('Login Required', 'Please login to create a trip from this idea.');
                return;
            }

            setLoading(true);

            // Create a trip based on the idea
            const tripData = {
                uid: user.uid,
                destination: idea.destination,
                title: idea.title,
                description: idea.description,
                estimatedBudget: idea.budget,
                estimatedDuration: idea.duration,
                category: activeCategory,
                isFromIdea: true,
                ideaId: idea.id,
                createdAt: new Date().toISOString(),
                status: 'draft'
            };

            const docRef = await addDoc(collection(db, 'UserTrips'), tripData);
            
            Alert.alert(
                'Trip Created!',
                'Would you like to customize this trip now?',
                [
                    { text: 'Later', style: 'cancel' },
                    {
                        text: 'Customize Now',
                        onPress: () => router.push(`/create-trip/trip-details/${docRef.id}`)
                    }
                ]
            );

        } catch (error) {
            console.error('Error creating trip from idea:', error);
            Alert.alert('Error', 'Failed to create trip. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderCategoryTab = ({ item }) => {
        const isActive = activeCategory === item.id;
        return (
            <TouchableOpacity
                style={[
                    styles.categoryTab,
                    isActive && styles.activeCategoryTab
                ]}
                onPress={() => setActiveCategory(item.id)}
                activeOpacity={0.8}
            >
                <View style={[
                    styles.categoryIcon,
                    isActive && { backgroundColor: item.color }
                ]}>
                    <Ionicons 
                        name={item.icon} 
                        size={18} 
                        color={isActive ? 'white' : item.color} 
                    />
                </View>
                <Text style={[
                    styles.categoryText,
                    isActive && styles.activeCategoryText
                ]}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderTripIdea = ({ item, index }) => {
        return (
            <Animated.View
                style={[
                    styles.ideaCard,
                    {
                        opacity: fadeAnim,
                        transform: [{
                            translateY: slideAnim.interpolate({
                                inputRange: [0, 30],
                                outputRange: [0, 30 + (index * 10)],
                            })
                        }]
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.cardContent}
                    activeOpacity={0.9}
                    onPress={() => handleCreateTripFromIdea(item)}
                >
                    {/* Image Section */}
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.ideaImage}
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.7)']}
                            style={styles.imageOverlay}
                        />
                        
                        {/* Rating Badge */}
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#ffd700" />
                            <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>

                        {/* Duration Badge */}
                        <View style={styles.durationBadge}>
                            <Ionicons name="time" size={12} color="white" />
                            <Text style={styles.durationText}>{item.duration}</Text>
                        </View>
                    </View>

                    {/* Content Section */}
                    <View style={styles.ideaContent}>
                        <Text style={styles.ideaDestination}>{item.destination}</Text>
                        <Text style={styles.ideaTitle}>{item.title}</Text>
                        <Text style={styles.ideaDescription} numberOfLines={2}>
                            {item.description}
                        </Text>

                        {/* Highlights */}
                        <View style={styles.highlightsContainer}>
                            {item.highlights.slice(0, 3).map((highlight, idx) => (
                                <View key={idx} style={styles.highlightTag}>
                                    <Text style={styles.highlightText}>{highlight}</Text>
                                </View>
                            ))}
                            {item.highlights.length > 3 && (
                                <View style={styles.highlightTag}>
                                    <Text style={styles.highlightText}>+{item.highlights.length - 3}</Text>
                                </View>
                            )}
                        </View>

                        {/* Trip Details */}
                        <View style={styles.tripDetails}>
                            <View style={styles.detailItem}>
                                <Ionicons name="wallet" size={14} color="#667eea" />
                                <Text style={styles.detailText}>{item.budget}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Ionicons name="sunny" size={14} color="#f39c12" />
                                <Text style={styles.detailText}>{item.bestTime}</Text>
                            </View>
                        </View>

                        {/* Action Button */}
                        <TouchableOpacity
                            style={styles.createTripButton}
                            onPress={() => handleCreateTripFromIdea(item)}
                        >
                            <Ionicons name="add-circle" size={20} color="white" />
                            <Text style={styles.createTripText}>Create This Trip</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="bulb-outline" size={80} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No Ideas Found</Text>
            <Text style={styles.emptyMessage}>
                Try selecting a different category or refresh to get new suggestions
            </Text>
            <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
            >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.refreshButtonText}>Refresh Ideas</Text>
            </TouchableOpacity>
        </View>
    );

    const filteredIdeas = tripIdeas.filter(idea =>
        idea.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()))
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
                                <Ionicons name="bulb" size={30} color="white" />
                            </View>
                        </View>

                        <Text style={styles.mainTitle}>Trip Ideas</Text>
                        <Text style={styles.subtitle}>
                            AI-powered suggestions for your next adventure
                        </Text>

                        {/* Search Bar */}
                        {showSearch && (
                            <Animated.View
                                style={[
                                    styles.searchContainer,
                                    {
                                        opacity: fadeAnim,
                                    }
                                ]}
                            >
                                <View style={styles.searchInputContainer}>
                                    <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Search destinations, activities..."
                                        placeholderTextColor="rgba(255,255,255,0.7)"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        autoFocus={true}
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </Animated.View>
                        )}

                        {/* Category Tabs */}
                        <View style={styles.categoriesContainer}>
                            <FlatList
                                data={categories}
                                renderItem={renderCategoryTab}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.categoriesList}
                            />
                        </View>
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
                        <View style={styles.contentHeader}>
                            <Text style={styles.contentTitle}>
                                {categories.find(c => c.id === activeCategory)?.name} Trips
                            </Text>
                            <Text style={styles.contentSubtitle}>
                                {filteredIdeas.length} destinations found
                            </Text>
                        </View>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#667eea" />
                                <Text style={styles.loadingText}>Finding amazing destinations...</Text>
                            </View>
                        ) : filteredIdeas.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <FlatList
                                data={filteredIdeas}
                                renderItem={renderTripIdea}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContainer}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={handleRefresh}
                                        colors={['#667eea']}
                                        tintColor="#667eea"
                                    />
                                }
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                            />
                        )}
                    </Animated.View>

                    {/* Loading Overlay */}
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#667eea" />
                        </View>
                    )}
                </SafeAreaView>
            </LinearGradient>
        </>
    );
};

export default Discover;

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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: 25,
        paddingBottom: 20,
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
        shadowOffset: { width: 0, height: 10 },
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
        marginBottom: 25,
    },
    searchContainer: {
        width: '100%',
        marginBottom: 20,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: 'white',
        fontFamily: 'poppins',
        marginLeft: 10,
        marginRight: 10,
    },
    categoriesContainer: {
        width: '100%',
    },
    categoriesList: {
        paddingHorizontal: 10,
    },
    categoryTab: {
        alignItems: 'center',
        marginHorizontal: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        minWidth: 80,
    },
    activeCategoryTab: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    categoryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'poppins-Medium',
        textAlign: 'center',
    },
    activeCategoryText: {
        color: 'white',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 25,
    },
    contentHeader: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    contentTitle: {
        fontSize: 24,
        color: '#333',
        fontFamily: 'poppins-Bold',
        marginBottom: 5,
    },
    contentSubtitle: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'poppins',
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    separator: {
        height: 20,
    },
    ideaCard: {
        backgroundColor: 'white',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardContent: {
        flex: 1,
    },
    imageContainer: {
        position: 'relative',
        height: 200,
    },
    ideaImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    ratingBadge: {
        position: 'absolute',
        top: 15,
        left: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 15,
    },
    ratingText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'poppins-Bold',
        marginLeft: 4,
    },
    durationBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(102, 126, 234, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 15,
    },
    durationText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'poppins-Bold',
        marginLeft: 4,
    },
    ideaContent: {
        padding: 25,
    },
    ideaDestination: {
        fontSize: 14,
        color: '#667eea',
        fontFamily: 'poppins-Bold',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    ideaTitle: {
        fontSize: 20,
        color: '#333',
        fontFamily: 'poppins-Bold',
        marginBottom: 8,
        lineHeight: 26,
    },
    ideaDescription: {
        fontSize: 15,
        color: '#666',
        fontFamily: 'poppins',
        lineHeight: 22,
        marginBottom: 15,
    },
    highlightsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    highlightTag: {
        backgroundColor: '#f8f9fb',
        borderWidth: 1,
        borderColor: '#e3e8ff',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    highlightText: {
        fontSize: 12,
        color: '#667eea',
        fontFamily: 'poppins-Medium',
    },
    tripDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'poppins-Medium',
        marginLeft: 8,
    },
    createTripButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#667eea',
        paddingVertical: 15,
        borderRadius: 20,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    createTripText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'poppins-Bold',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyIconContainer: {
        marginBottom: 30,
    },
    emptyTitle: {
        fontSize: 24,
        color: '#333',
        fontFamily: 'poppins-Bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    emptyMessage: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'poppins',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#667eea',
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 25,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    refreshButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'poppins-Bold',
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#667eea',
        fontFamily: 'poppins-Medium',
        marginTop: 15,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
});