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
    const [error, setError] = useState('');

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

    // Unsplash image categories for different trip types
    const getImageQuery = (category, destination) => {
        const queries = {
            trending: `${destination} travel destination`,
            adventure: `${destination} adventure outdoor`,
            relaxation: `${destination} beach resort spa`,
            cultural: `${destination} culture heritage temple`,
            romantic: `${destination} romantic sunset`,
            family: `${destination} family vacation`,
            budget: `${destination} backpacker travel`,
            luxury: `${destination} luxury hotel resort`
        };
        return queries[category] || `${destination} travel`;
    };

    // Generate random Unsplash image URL
    const generateImageUrl = (category, destination, index) => {
        const query = getImageQuery(category, destination).replace(/\s+/g, '%20');
        const seed = `${category}-${destination}-${index}`.replace(/\s+/g, '');
        return `https://source.unsplash.com/400x250/?${query}&sig=${seed}`;
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

    const generateTripIdeas = async () => {
        const categoryDescriptions = {
            trending: 'currently popular and trending destinations that are getting a lot of attention from travelers',
            adventure: 'exciting outdoor activities, extreme sports, hiking, mountaineering, and thrill-seeking experiences',
            relaxation: 'peaceful, spa-focused, beach resorts, wellness retreats, and stress-relief destinations',
            cultural: 'rich history, museums, local traditions, heritage sites, and authentic cultural experiences',
            romantic: 'perfect for couples, honeymoons, romantic getaways, and intimate experiences',
            family: 'kid-friendly activities, family resorts, educational experiences, and multi-generational travel',
            budget: 'affordable destinations, backpacking, hostels, street food, and cost-effective travel',
            luxury: 'high-end resorts, premium experiences, five-star accommodations, and exclusive services'
        };

        const prompt = `Generate 6 diverse and specific travel destination ideas for ${activeCategory} travel (${categoryDescriptions[activeCategory]}). 

        For each destination, provide EXACTLY this JSON structure:
        {
            "destinations": [
                {
                    "destination": "City, Country",
                    "title": "Compelling 4-6 word title",
                    "description": "Engaging 1-sentence description (15-25 words)",
                    "duration": "X-Y days",
                    "budget": "$XXX-XXXX",
                    "rating": 4.X,
                    "highlights": ["highlight1", "highlight2", "highlight3", "highlight4"],
                    "bestTime": "Month-Month or Season"
                }
            ]
        }

        Requirements:
        - Include a mix of popular and lesser-known destinations
        - Vary the continents and regions
        - Make budgets realistic for ${activeCategory} travel
        - Ratings should be between 4.5-4.9
        - Duration should vary from 3-15 days
        - Highlights should be specific to each destination
        - Descriptions must be compelling and unique

        Return ONLY valid JSON without any additional text or formatting.`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            },
        };

        const apiKey = "AIzaSyDs_Z-o02L9FwIXjGqLGqCNpDMDOe4xLVw";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

        try {
            let response;
            let retryCount = 0;
            const maxRetries = 3;
            const baseDelay = 1000;

            while (retryCount < maxRetries) {
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    break;
                } else if (response.status === 429) {
                    const delay = baseDelay * Math.pow(2, retryCount);
                    console.warn(`Rate limit hit. Retrying in ${delay / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retryCount++;
                } else {
                    const errorData = await response.json();
                    throw new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
                }
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch after ${maxRetries} retries.`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                
                const generatedText = result.candidates[0].content.parts[0].text;
                
                try {
                    // Clean the response to extract JSON
                    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        throw new Error('No JSON found in response');
                    }
                    
                    const parsedData = JSON.parse(jsonMatch[0]);
                    
                    if (parsedData.destinations && Array.isArray(parsedData.destinations)) {
                        // Add IDs and image URLs to each destination
                        const destinationsWithIds = parsedData.destinations.map((dest, index) => ({
                            ...dest,
                            id: `${activeCategory}-${Date.now()}-${index}`,
                            imageUrl: generateImageUrl(activeCategory, dest.destination, index)
                        }));
                        
                        return destinationsWithIds;
                    } else {
                        throw new Error('Invalid JSON structure');
                    }
                } catch (parseError) {
                    console.error('JSON parsing error:', parseError);
                    console.log('Raw response:', generatedText);
                    throw new Error('Failed to parse destination data');
                }
            } else {
                throw new Error('No destinations generated. Please try again.');
            }
        } catch (err) {
            console.error('Error generating trip ideas:', err);
            throw err;
        }
    };

    const loadTripIdeas = async () => {
        setLoading(true);
        setError('');
        
        try {
            const ideas = await generateTripIdeas();
            setTripIdeas(ideas);
        } catch (error) {
            console.error('Error loading trip ideas:', error);
            setError(`Failed to load trip ideas: ${error.message}`);
            
            // Fallback to a basic set if API fails
            setTripIdeas([
                {
                    id: `fallback-${Date.now()}`,
                    destination: 'Paris, France',
                    title: 'City of Light Adventure',
                    description: 'Discover iconic landmarks, world-class museums, and romantic atmosphere',
                    duration: '5-7 days',
                    budget: '$1200-2500',
                    rating: 4.7,
                    imageUrl: generateImageUrl(activeCategory, 'Paris France', 0),
                    highlights: ['Eiffel Tower', 'Louvre Museum', 'Seine River', 'French Cuisine'],
                    bestTime: 'Apr-Oct'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const ideas = await generateTripIdeas();
            setTripIdeas(ideas);
            setError('');
        } catch (error) {
            setError(`Failed to refresh: ${error.message}`);
        } finally {
            setRefreshing(false);
        }
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
                imageUrl: idea.imageUrl,
                highlights: idea.highlights,
                rating: idea.rating,
                bestTime: idea.bestTime,
                createdAt: new Date().toISOString(),
                status: 'draft',
                isFavorite: false
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
                            defaultSource={{ uri: 'https://source.unsplash.com/400x250/?travel' }}
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
                {error ? error : "Try selecting a different category or refresh to get new suggestions"}
            </Text>
            <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
            >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.refreshButtonText}>Get New Ideas</Text>
            </TouchableOpacity>
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>AI is crafting amazing destinations...</Text>
            <Text style={styles.loadingSubtext}>Finding the perfect {activeCategory} experiences for you</Text>
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

                        <Text style={styles.mainTitle}>AI Trip Ideas</Text>
                        <Text style={styles.subtitle}>
                            Personalized suggestions powered by Gemini AI
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
                                {loading ? 'Generating ideas...' : `${filteredIdeas.length} AI-generated destinations`}
                            </Text>
                        </View>

                        {loading ? (
                            renderLoadingState()
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
                    {loading && !refreshing && (
                        <View style={styles.loadingOverlay}>
                            <View style={styles.loadingCard}>
                                <ActivityIndicator size="large" color="#667eea" />
                                <Text style={styles.loadingOverlayText}>AI is working its magic...</Text>
                            </View>
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
        paddingHorizontal: 30,
    },
    loadingText: {
        fontSize: 18,
        color: '#667eea',
        fontFamily: 'poppins-Bold',
        marginTop: 20,
        textAlign: 'center',
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#999',
        fontFamily: 'poppins',
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingCard: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 15,
    },
    loadingOverlayText: {
        fontSize: 16,
        color: '#667eea',
        fontFamily: 'poppins-Medium',
        marginTop: 15,
        textAlign: 'center',
    },
});