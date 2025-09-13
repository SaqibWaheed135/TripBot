// app/favorite-places/index.js
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import moment from 'moment';
import { useCallback, useRef, useState } from 'react';
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
    TouchableOpacity,
    View
} from 'react-native';
import { app, db } from '../../configs/FirebaseConfig.jsx';

const { width } = Dimensions.get('window');

const FavoritePlaces = () => {
    const navigation = useNavigation();
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // States
    const [favoriteTrips, setFavoriteTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [removingFavorite, setRemovingFavorite] = useState(null);

    // Focus effect to reload data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchFavoriteTrips();
            
            // Start animations when screen is focused
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
        }, [])
    );

    // Set navigation options
    useState(() => {
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

    const fetchFavoriteTrips = async () => {
        try {
            setLoading(true);
            setError('');
            const auth = getAuth(app);
            const user = auth.currentUser;

            if (!user) {
                setError('Please login to view favorite trips');
                return;
            }

            // Query for trips where isFavorite is true
            const tripsRef = collection(db, 'UserTrips');
            const favoritesQuery = query(
                tripsRef,
                where('userEmail', '==', user.email),
                where('isFavorite', '==', true)
            );

            const querySnapshot = await getDocs(favoritesQuery);
            const trips = [];

            querySnapshot.forEach((doc) => {
                trips.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Sort by favoriteUpdatedAt or creation date
            trips.sort((a, b) => {
                const dateA = new Date(a.favoriteUpdatedAt || a.createdAt || 0);
                const dateB = new Date(b.favoriteUpdatedAt || b.createdAt || 0);
                return dateB - dateA; // Most recent first
            });

            setFavoriteTrips(trips);

        } catch (err) {
            console.error('Error fetching favorite trips:', err);
            setError('Failed to load favorite trips');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchFavoriteTrips();
        setRefreshing(false);
    };

    const removeFavorite = async (tripId) => {
        setRemovingFavorite(tripId);
        
        try {
            await updateDoc(doc(db, 'UserTrips', tripId), {
                isFavorite: false,
                favoriteUpdatedAt: new Date().toISOString()
            });

            // Remove from local state
            setFavoriteTrips(prev => prev.filter(trip => trip.id !== tripId));
            
            // Show feedback
            Alert.alert("Removed", "Trip removed from favorites");

        } catch (error) {
            console.error("Error removing favorite:", error);
            Alert.alert("Error", "Failed to remove from favorites. Please try again.");
        } finally {
            setRemovingFavorite(null);
        }
    };

    const navigateToTripDetails = (tripId) => {
        router.push(`/trip-details/${tripId}`);
    };

    const getRandomImage = (destination) => {
        // Generate a consistent random number based on destination name
        const hash = destination.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const imageIndex = Math.abs(hash) % 20 + 1;
        return `https://picsum.photos/300/200?random=${imageIndex}`;
    };

    const renderTripCard = ({ item, index }) => {
        const cardAnim = useRef(new Animated.Value(0)).current;
        
        // Animate card appearance
        useState(() => {
            Animated.timing(cardAnim, {
                toValue: 1,
                duration: 500 + (index * 100), // Stagger animation
                useNativeDriver: true,
            }).start();
        }, []);

        return (
            <Animated.View
                style={[
                    styles.tripCard,
                    {
                        opacity: cardAnim,
                        transform: [
                            {
                                translateY: cardAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                })
                            }
                        ]
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.cardContent}
                    onPress={() => navigateToTripDetails(item.id)}
                    activeOpacity={0.8}
                >
                    {/* Trip Image */}
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: getRandomImage(item.destination) }}
                            style={styles.tripImage}
                            defaultSource={{ uri: 'https://picsum.photos/300/200?random=1' }}
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
                            style={styles.imageOverlay}
                        />
                        
                        {/* Favorite Heart */}
                        <View style={styles.favoriteIndicator}>
                            <Ionicons name="heart" size={20} color="#ff6b6b" />
                        </View>

                        {/* Remove Favorite Button */}
                        <TouchableOpacity
                            style={styles.removeFavoriteButton}
                            onPress={() => {
                                Alert.alert(
                                    "Remove Favorite",
                                    `Remove "${item.destination}" from favorites?`,
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Remove", onPress: () => removeFavorite(item.id), style: "destructive" }
                                    ]
                                );
                            }}
                            disabled={removingFavorite === item.id}
                        >
                            {removingFavorite === item.id ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Ionicons name="close" size={18} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Trip Details */}
                    <View style={styles.cardDetails}>
                        <Text style={styles.destinationTitle} numberOfLines={1}>
                            {item.destination}
                        </Text>
                        
                        <View style={styles.tripInfo}>
                            <View style={styles.infoItem}>
                                <Ionicons name="calendar-outline" size={14} color="#666" />
                                <Text style={styles.infoText}>
                                    {item.totalDays} days
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="people-outline" size={14} color="#666" />
                                <Text style={styles.infoText}>
                                    {item.travelers}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.tripInfo}>
                            <View style={styles.infoItem}>
                                <Ionicons name="wallet-outline" size={14} color="#666" />
                                <Text style={styles.infoText}>
                                    {item.budget}
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="time-outline" size={14} color="#666" />
                                <Text style={styles.infoText}>
                                    {moment(item.favoriteUpdatedAt || item.createdAt).fromNow()}
                                </Text>
                            </View>
                        </View>

                        {/* Date Range */}
                        {item.startDate && item.endDate && (
                            <Text style={styles.dateRange}>
                                {moment(item.startDate).format('MMM DD')} - {moment(item.endDate).format('MMM DD, YYYY')}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderEmptyState = () => (
        <Animated.View
            style={[
                styles.emptyContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-outline" size={80} color="rgba(255, 255, 255, 0.6)" />
            </View>
            <Text style={styles.emptyTitle}>No Favorite Trips Yet</Text>
            <Text style={styles.emptySubtitle}>
                Start exploring and mark your favorite destinations to see them here
            </Text>
            <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push('/my-trips')}
            >
                <Ionicons name="compass" size={20} color="white" />
                <Text style={styles.exploreButtonText}>Explore Trips</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderHeader = () => (
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
                    <Ionicons name="heart" size={35} color="white" />
                </View>
            </View>
            <Text style={styles.mainTitle}>Favorite Places</Text>
            <Text style={styles.subtitle}>
                {favoriteTrips.length} {favoriteTrips.length === 1 ? 'destination' : 'destinations'}
            </Text>
        </Animated.View>
    );

    if (loading) {
        return (
            <LinearGradient
                colors={['#ff6b6b', '#ee5a6f']}
                style={styles.loadingContainer}
            >
                <StatusBar barStyle="light-content" backgroundColor="#ff6b6b" />
                <SafeAreaView style={styles.container}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="white" />
                        <Text style={styles.loadingTitle}>Loading Favorites...</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (error) {
        return (
            <LinearGradient
                colors={['#ff6b6b', '#ee5a6f']}
                style={styles.container}
            >
                <StatusBar barStyle="light-content" backgroundColor="#ff6b6b" />
                <SafeAreaView style={styles.container}>
                    <View style={styles.errorContent}>
                        <Ionicons name="alert-circle" size={80} color="white" />
                        <Text style={styles.errorTitle}>Error</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={fetchFavoriteTrips}
                        >
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#ff6b6b" />
            <LinearGradient
                colors={['#ff6b6b', '#ee5a6f']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.container}>
                    {renderHeader()}
                    
                    <View style={styles.contentContainer}>
                        <FlatList
                            data={favoriteTrips}
                            renderItem={renderTripCard}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContainer}
                            ListEmptyComponent={renderEmptyState}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    colors={['#ff6b6b']}
                                    tintColor="#ff6b6b"
                                />
                            }
                            numColumns={1}
                            initialNumToRender={6}
                            maxToRenderPerBatch={6}
                            windowSize={10}
                            getItemLayout={(data, index) => (
                                { length: 280, offset: 280 * index, index }
                            )}
                        />
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </>
    );
};

export default FavoritePlaces;

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
    headerSection: {
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: 25,
        paddingBottom: 30,
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
    },
    contentContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 30,
    },
    listContainer: {
        paddingHorizontal: 25,
        paddingBottom: 50,
    },
    tripCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden',
    },
    cardContent: {
        flex: 1,
    },
    imageContainer: {
        position: 'relative',
        height: 180,
    },
    tripImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    favoriteIndicator: {
        position: 'absolute',
        top: 15,
        left: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    removeFavoriteButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 15,
        padding: 8,
        width: 34,
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardDetails: {
        padding: 20,
    },
    destinationTitle: {
        fontSize: 20,
        color: '#333',
        fontFamily: 'poppins-Bold',
        marginBottom: 12,
    },
    tripInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'poppins',
        marginLeft: 6,
    },
    dateRange: {
        fontSize: 13,
        color: '#888',
        fontFamily: 'poppins',
        marginTop: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Empty state
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        marginBottom: 30,
        opacity: 0.8,
    },
    emptyTitle: {
        fontSize: 24,
        color: '#333',
        fontFamily: 'poppins-Bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'poppins',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    exploreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff6b6b',
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 25,
        shadowColor: '#ff6b6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    exploreButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'poppins-Medium',
        marginLeft: 8,
    },
    // Loading states
    loadingContainer: {
        flex: 1,
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingTitle: {
        fontSize: 24,
        color: 'white',
        fontFamily: 'poppins-Bold',
        textAlign: 'center',
        marginTop: 20,
    },
    // Error states
    errorContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorTitle: {
        fontSize: 24,
        color: 'white',
        fontFamily: 'poppins-Bold',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 15,
    },
    errorText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'poppins',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'poppins-Medium',
    },
});