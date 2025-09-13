// app/trip-details/[id].js
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { app, db } from '../../configs/FirebaseConfig.jsx';

const { width } = Dimensions.get('window');

const TripDetails = () => {
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // States
    const [tripData, setTripData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [parsedPlan, setParsedPlan] = useState(null);
    const [placeImages, setPlaceImages] = useState({});
    const [hotelImages, setHotelImages] = useState({});
    const [loadingImages, setLoadingImages] = useState(false);
    
    // New enhanced states
    const [isFavorite, setIsFavorite] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);

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
                <View style={styles.headerRightContainer}>
                    <TouchableOpacity
                        onPress={handleFavoriteToggle}
                        style={[styles.headerButton, isProcessingFavorite && styles.headerButtonDisabled]}
                        disabled={isProcessingFavorite}
                    >
                        <Ionicons 
                            name={isFavorite ? "heart" : "heart-outline"} 
                            size={24} 
                            color={isFavorite ? "#ff6b6b" : "white"} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setShowShareModal(true)}
                        style={styles.headerButton}
                    >
                        <Ionicons name="share" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [isFavorite, isProcessingFavorite, tripData]);

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

    useEffect(() => {
        if (id) {
            fetchTripDetails();
        }
    }, [id]);

    const fetchTripDetails = async () => {
        try {
            setLoading(true);
            const auth = getAuth(app);
            const user = auth.currentUser;

            if (!user) {
                setError('Please login to view trip details');
                return;
            }

            const tripRef = doc(db, 'UserTrips', id);
            const tripSnap = await getDoc(tripRef);

            if (tripSnap.exists()) {
                const data = tripSnap.data();
                setTripData({ id: tripSnap.id, ...data });
                setIsFavorite(data.isFavorite || false);
                setIsSaved(true); // Trip exists in database, so it's saved

                // Parse the travel plan
                if (data.travelPlan) {
                    await parseTravelPlanWithImages(data.travelPlan);
                }
            } else {
                setError('Trip not found');
            }
        } catch (err) {
            console.error('Error fetching trip:', err);
            setError('Failed to load trip details');
        } finally {
            setLoading(false);
        }
    };

    // Toggle favorite status
    const handleFavoriteToggle = async () => {
        if (!id || isProcessingFavorite) return;
        
        setIsProcessingFavorite(true);
        
        try {
            const newFavoriteStatus = !isFavorite;
            
            // Update in Firestore
            await updateDoc(doc(db, 'UserTrips', id), {
                isFavorite: newFavoriteStatus,
                favoriteUpdatedAt: new Date().toISOString()
            });
            
            setIsFavorite(newFavoriteStatus);
            
            // Show feedback
            Alert.alert(
                newFavoriteStatus ? "Added to Favorites" : "Removed from Favorites",
                newFavoriteStatus 
                    ? "This trip has been added to your favorites!" 
                    : "This trip has been removed from your favorites."
            );
            
        } catch (error) {
            console.error("Error toggling favorite:", error);
            Alert.alert("Error", "Failed to update favorite status. Please try again.");
        } finally {
            setIsProcessingFavorite(false);
        }
    };

    // Enhanced share functionality
    const handleShare = async (shareType = 'default') => {
        if (!tripData?.travelPlan) return;
        
        try {
            let shareContent = '';
            
            switch (shareType) {
                case 'summary':
                    shareContent = `🌟 My AI-Generated Travel Plan\n\n` +
                        `📍 Destination: ${tripData?.destination}\n` +
                        `📅 Duration: ${tripData?.totalDays} days\n` +
                        `👥 Travelers: ${tripData?.travelers}\n` +
                        `💰 Budget: ${tripData?.budget}\n\n` +
                        `✨ Created with AI Travel Planner`;
                    break;
                
                case 'full':
                    shareContent = `🌟 My Complete Travel Plan for ${tripData?.destination}\n\n${tripData.travelPlan}`;
                    break;
                
                case 'link':
                    // This would be used if you have a web version or deep linking
                    shareContent = `Check out my travel plan for ${tripData?.destination}!\n\n` +
                        `📱 View full details: [Your App Link Here]`;
                    break;
                
                default:
                    shareContent = `🌟 Check out my travel plan for ${tripData?.destination}!\n\n` +
                        `📅 ${tripData?.totalDays} days of amazing experiences\n` +
                        `👥 Perfect for ${tripData?.travelers}\n\n` +
                        `✨ Created with AI Travel Planner`;
            }

            const result = await Share.share({
                message: shareContent,
                title: `Travel Plan - ${tripData?.destination}`,
                url: '', // Add your app's deep link if available
            });

            // Track share if successful
            if (result.action === Share.sharedAction && id) {
                const currentTripRef = doc(db, 'UserTrips', id);
                const currentTripSnap = await getDoc(currentTripRef);
                const currentShareCount = currentTripSnap.data()?.shareCount || 0;
                
                await updateDoc(currentTripRef, {
                    shareCount: currentShareCount + 1,
                    lastShared: new Date().toISOString()
                });
            }

            setShowShareModal(false);

        } catch (error) {
            console.error('Error sharing:', error);
            Alert.alert("Error", "Failed to share. Please try again.");
        }
    };

    // Function to fetch images from Unsplash
    const fetchDestinationImages = async (query, type = 'places') => {
        try {
            const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // Replace with your key
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
                {
                    headers: {
                        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                return data.results.map(img => ({
                    id: img.id,
                    url: img.urls.regular,
                    thumbnail: img.urls.small,
                    description: img.description || img.alt_description,
                    photographer: img.user.name
                }));
            }
        } catch (error) {
            console.log('Error fetching images:', error);
        }

        // Fallback to placeholder images
        return getPlaceholderImages(query, type);
    };

    // Fallback placeholder images
    const getPlaceholderImages = (query, type) => {
        const placeholderImages = {
            places: [
                { id: '1', url: 'https://picsum.photos/400/300?random=1', description: `${query} landmark` },
                { id: '2', url: 'https://picsum.photos/400/300?random=2', description: `${query} attraction` },
                { id: '3', url: 'https://picsum.photos/400/300?random=3', description: `${query} scenery` },
            ],
            hotels: [
                { id: '1', url: 'https://picsum.photos/400/300?random=10', description: `Hotel in ${query}` },
                { id: '2', url: 'https://picsum.photos/400/300?random=11', description: `Accommodation in ${query}` },
                { id: '3', url: 'https://picsum.photos/400/300?random=12', description: `Resort in ${query}` },
            ],
        };

        return placeholderImages[type] || placeholderImages.places;
    };

    const parseTravelPlanWithImages = async (plan) => {
        setLoadingImages(true);

        const lines = plan.split('\n');
        const sections = [];
        let currentSection = null;

        // Extract data for image fetching
        const extractedPlaces = new Set();
        const extractedHotels = new Set();
        const extractedActivities = new Set();

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            // Extract specific information for images
            if (trimmedLine.includes('HOTEL_NAME:')) {
                const hotel = trimmedLine.replace('HOTEL_NAME:', '').trim();
                if (hotel) extractedHotels.add(hotel);
            }

            if (trimmedLine.includes('PLACE_NAME:')) {
                const place = trimmedLine.replace('PLACE_NAME:', '').trim();
                if (place) extractedPlaces.add(place);
            }

            if (trimmedLine.includes('ACTIVITY_NAME:')) {
                const activity = trimmedLine.replace('ACTIVITY_NAME:', '').trim();
                if (activity) extractedActivities.add(activity);
            }

            // Parse sections based on structure
            if (trimmedLine.includes('**SECTION_') ||
                trimmedLine.includes('**DAY') ||
                trimmedLine.includes('ITINERARY_DAY')) {

                if (currentSection) {
                    sections.push(currentSection);
                }

                const sectionTitle = trimmedLine.replace(/[*]/g, '').replace('SECTION_', '').trim();
                currentSection = {
                    title: sectionTitle,
                    content: [],
                    type: getSectionType(trimmedLine),
                    rawType: trimmedLine
                };
            } else {
                if (currentSection) {
                    currentSection.content.push(trimmedLine);
                } else if (trimmedLine) {
                    sections.push({
                        title: 'Trip Overview',
                        content: [trimmedLine],
                        type: 'overview'
                    });
                }
            }
        });

        if (currentSection) {
            sections.push(currentSection);
        }

        setParsedPlan(sections);

        // Fetch images for different categories
        try {
            const destinationName = tripData?.destination || 'travel destination';

            // Fetch place images
            const placeImagePromises = Array.from(extractedPlaces).slice(0, 8).map(async (place) => {
                const images = await fetchDestinationImages(`${place} ${destinationName}`, 'places');
                return { place, images };
            });

            // Fetch hotel images
            const hotelImagePromises = Array.from(extractedHotels).slice(0, 6).map(async (hotel) => {
                const images = await fetchDestinationImages(`${hotel} hotel ${destinationName}`, 'hotels');
                return { hotel, images };
            });

            // Add general destination images
            const generalImages = await fetchDestinationImages(destinationName, 'places');

            const placeResults = await Promise.all(placeImagePromises);
            const hotelResults = await Promise.all(hotelImagePromises);

            // Organize images
            const newPlaceImages = {
                general: generalImages,
                activities: {}
            };
            const newHotelImages = {};

            placeResults.forEach(({ place, images }) => {
                newPlaceImages[place] = images;
            });

            hotelResults.forEach(({ hotel, images }) => {
                newHotelImages[hotel] = images;
            });

            setPlaceImages(newPlaceImages);
            setHotelImages(newHotelImages);

        } catch (error) {
            console.log('Error fetching images:', error);
        }

        setLoadingImages(false);
    };

    const getSectionType = (line) => {
        if (line.includes('OVERVIEW')) return 'overview';
        if (line.includes('HOTELS')) return 'hotels';
        if (line.includes('PLACES')) return 'places';
        if (line.includes('ACTIVITIES')) return 'activities';
        if (line.includes('BUDGET')) return 'budget';
        if (line.includes('ITINERARY_DAY') || line.includes('DAY_')) return 'day';
        if (line.includes('TRAVEL_TIPS')) return 'tips';
        return 'general';
    };

    // Share Modal Component
    const ShareModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showShareModal}
            onRequestClose={() => setShowShareModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Share Your Trip</Text>
                        <TouchableOpacity
                            onPress={() => setShowShareModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.shareOptionsContainer}>
                        <TouchableOpacity
                            style={styles.shareOption}
                            onPress={() => handleShare('summary')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Ionicons name="document-text" size={24} color="#667eea" />
                            </View>
                            <View style={styles.shareOptionText}>
                                <Text style={styles.shareOptionTitle}>Quick Summary</Text>
                                <Text style={styles.shareOptionDescription}>
                                    Share trip highlights and basic details
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.shareOption}
                            onPress={() => handleShare('full')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Ionicons name="document" size={24} color="#10ac84" />
                            </View>
                            <View style={styles.shareOptionText}>
                                <Text style={styles.shareOptionTitle}>Complete Plan</Text>
                                <Text style={styles.shareOptionDescription}>
                                    Share the full detailed itinerary
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.shareOption}
                            onPress={() => handleShare('link')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Ionicons name="link" size={24} color="#ff6b6b" />
                            </View>
                            <View style={styles.shareOptionText}>
                                <Text style={styles.shareOptionTitle}>Share Link</Text>
                                <Text style={styles.shareOptionDescription}>
                                    Share a link to view the trip
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.shareOption}
                            onPress={() => handleShare('default')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Ionicons name="share-social" size={24} color="#764ba2" />
                            </View>
                            <View style={styles.shareOptionText}>
                                <Text style={styles.shareOptionTitle}>Social Media</Text>
                                <Text style={styles.shareOptionDescription}>
                                    Perfect for sharing on social platforms
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderImageGallery = (images, title) => {
        if (!images || images.length === 0) return null;

        return (
            <View style={styles.imageGallery}>
                <Text style={styles.imageGalleryTitle}>{title}</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imageScrollContainer}
                >
                    {images.slice(0, 5).map((image, index) => (
                        <View key={`${image.id || 'img'}-${index}`} style={styles.imageContainer}>
                            <Image
                                source={{ uri: image.thumbnail || image.url }}
                                style={styles.placeImage}
                                defaultSource={{ uri: 'https://picsum.photos/200/150?random=' + index }}
                            />
                            {image.description && (
                                <Text style={styles.imageDescription} numberOfLines={2}>
                                    {image.description}
                                </Text>
                            )}
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderStructuredContent = (content, sectionType) => {
        return content.map((line, lineIndex) => {
            // Handle different content types with structured formatting
            if (line.includes('HOTEL_NAME:') || line.includes('PLACE_NAME:') || line.includes('ACTIVITY_NAME:')) {
                return (
                    <View key={lineIndex} style={styles.itemHeader}>
                        <Text style={styles.itemTitle}>{line.replace(/^[A-Z_]+:/, '').trim()}</Text>
                    </View>
                );
            }

            if (line.includes('HOTEL_TYPE:') || line.includes('PLACE_TYPE:') || line.includes('ACTIVITY_TYPE:')) {
                return (
                    <View key={lineIndex} style={styles.itemTag}>
                        <Text style={styles.tagText}>{line.replace(/^[A-Z_]+:/, '').trim()}</Text>
                    </View>
                );
            }

            if (line.includes('BUDGET_')) {
                return (
                    <View key={lineIndex} style={styles.budgetItem}>
                        <Ionicons name="wallet-outline" size={16} color="#10ac84" />
                        <Text style={styles.budgetText}>{line}</Text>
                    </View>
                );
            }

            // Regular content
            return (
                <Text key={lineIndex} style={styles.planText}>{line}</Text>
            );
        });
    };

    const renderPlanSection = (section, index) => {
        const sectionImages = getSectionImages(section);
        const hasImages = sectionImages && sectionImages.length > 0;

        return (
            <Animated.View
                key={`${section.type}-${index}`}
                style={[
                    styles.planSection,
                    section.type === 'budget' && styles.budgetSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.sectionHeader}>
                    <LinearGradient
                        colors={getSectionColors(section.type, index)}
                        style={styles.sectionIconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons
                            name={getSectionIcon(section.type, index)}
                            size={20}
                            color="white"
                        />
                    </LinearGradient>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>

                {/* Show relevant images */}
                {hasImages && renderImageGallery(sectionImages, `${section.title} - Visual Guide`)}

                <View style={styles.sectionContent}>
                    {renderStructuredContent(section.content, section.type)}
                </View>
            </Animated.View>
        );
    };

    const getSectionImages = (section) => {
        switch (section.type) {
            case 'hotels':
                return Object.values(hotelImages).flat().slice(0, 5);
            case 'places':
                return Object.values(placeImages).filter(img => Array.isArray(img)).flat().slice(0, 5);
            case 'activities':
                return placeImages.activities ? Object.values(placeImages.activities).flat().slice(0, 5) : [];
            case 'overview':
                return placeImages.general || [];
            default:
                return null;
        }
    };

    const getSectionColors = (type, index) => {
        const colorSets = {
            overview: ['#667eea', '#764ba2'],
            hotels: ['#ff9a9e', '#fecfef'],
            places: ['#a8edea', '#fed6e3'],
            activities: ['#ffecd2', '#fcb69f'],
            budget: ['#10ac84', '#06d6a0'],
            day: ['#667eea', '#764ba2'],
            tips: ['#ff6b6b', '#ee5a6f'],
            general: ['#4facfe', '#00f2fe']
        };
        return colorSets[type] || colorSets.general;
    };

    const getSectionIcon = (type, index) => {
        const icons = {
            overview: 'information-circle',
            hotels: 'bed',
            places: 'location',
            activities: 'compass',
            budget: 'wallet',
            day: 'calendar',
            tips: 'bulb',
            general: 'document-text'
        };
        return icons[type] || 'document-text';
    };

    if (loading) {
        return (
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.loadingContainer}
            >
                <StatusBar barStyle="light-content" backgroundColor="#667eea" />
                <SafeAreaView style={styles.container}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="white" />
                        <Text style={styles.loadingTitle}>Loading Trip Details...</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (error) {
        return (
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.container}
            >
                <StatusBar barStyle="light-content" backgroundColor="#667eea" />
                <SafeAreaView style={styles.container}>
                    <View style={styles.errorContent}>
                        <Ionicons name="alert-circle" size={80} color="white" />
                        <Text style={styles.errorTitle}>Error</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.retryButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

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
                                <Ionicons name="map" size={35} color="white" />
                            </View>
                        </View>

                        <Text style={styles.mainTitle}>{tripData?.destination}</Text>
                        <Text style={styles.subtitle}>
                            {tripData?.totalDays} days • {tripData?.travelers}
                        </Text>
                        <Text style={styles.dateText}>
                            {moment(tripData?.startDate).format('MMM DD')} - {moment(tripData?.endDate).format('MMM DD, YYYY')}
                        </Text>

                        {/* Trip Status Indicators */}
                        <View style={styles.statusContainer}>
                            {isSaved && (
                                <View style={styles.statusBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10ac84" />
                                    <Text style={styles.statusText}>Saved</Text>
                                </View>
                            )}
                            {isFavorite && (
                                <View style={[styles.statusBadge, styles.favoriteBadge]}>
                                    <Ionicons name="heart" size={16} color="#ff6b6b" />
                                    <Text style={[styles.statusText, styles.favoriteText]}>Favorite</Text>
                                </View>
                            )}
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
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {/* Trip Summary Card */}
                            <Animated.View
                                style={[
                                    styles.summaryCard,
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ scale: scaleAnim }]
                                    }
                                ]}
                            >
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="location" size={20} color="#667eea" />
                                        <Text style={styles.summaryLabel}>Destination</Text>
                                        <Text style={styles.summaryValue}>{tripData?.destination}</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="people" size={20} color="#667eea" />
                                        <Text style={styles.summaryLabel}>Travelers</Text>
                                        <Text style={styles.summaryValue}>{tripData?.travelers}</Text>
                                    </View>
                                </View>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="calendar" size={20} color="#667eea" />
                                        <Text style={styles.summaryLabel}>Duration</Text>
                                        <Text style={styles.summaryValue}>{tripData?.totalDays} days</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="wallet" size={20} color="#667eea" />
                                        <Text style={styles.summaryLabel}>Budget</Text>
                                        <Text style={styles.summaryValue}>{tripData?.budget}</Text>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.actionButtonsContainer}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, isFavorite && styles.favoriteButton]}
                                        onPress={handleFavoriteToggle}
                                        disabled={isProcessingFavorite}
                                    >
                                        <Ionicons 
                                            name={isFavorite ? "heart" : "heart-outline"} 
                                            size={16} 
                                            color={isFavorite ? "#ff6b6b" : "#667eea"} 
                                        />
                                        <Text style={[
                                            styles.actionButtonText,
                                            isFavorite && styles.favoriteButtonText
                                        ]}>
                                            {isFavorite ? "Favorited" : "Add to Favorites"}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => setShowShareModal(true)}
                                    >
                                        <Ionicons name="share" size={16} color="#667eea" />
                                        <Text style={styles.actionButtonText}>Share Trip</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>

                            {/* Travel Plan Sections */}
                            {loadingImages && (
                                <View style={styles.loadingImagesContainer}>
                                    <ActivityIndicator size="small" color="#667eea" />
                                    <Text style={styles.loadingImagesText}>Loading destination images...</Text>
                                </View>
                            )}

                            {parsedPlan ? (
                                parsedPlan.map((section, index) => renderPlanSection(section, index))
                            ) : (
                                <View style={styles.planSection}>
                                    <Text style={styles.planText}>{tripData?.travelPlan}</Text>
                                </View>
                            )}
                        </ScrollView>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>
            <ShareModal />
        </>
    );
};

export default TripDetails;

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
    headerRightContainer: {
        flexDirection: 'row',
        marginRight: 10,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    headerButtonDisabled: {
        opacity: 0.6,
    },
    shareButton: {
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
        marginBottom: 5,
    },
    dateText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        fontFamily: 'poppins',
        marginBottom: 15,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    favoriteBadge: {
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'poppins-Medium',
        marginLeft: 6,
    },
    favoriteText: {
        color: '#ff6b6b',
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
        paddingBottom: 50,
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'poppins',
        marginTop: 5,
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'poppins-Medium',
        textAlign: 'center',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    favoriteButton: {
        backgroundColor: '#fff5f5',
        borderColor: '#fed7d7',
    },
    actionButtonText: {
        color: '#667eea',
        fontSize: 14,
        fontFamily: 'poppins-Medium',
        marginLeft: 6,
    },
    favoriteButtonText: {
        color: '#ff6b6b',
    },
    loadingImagesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
    },
    loadingImagesText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'poppins',
        marginLeft: 10,
        fontStyle: 'italic',
    },
    planSection: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    budgetSection: {
        borderLeftWidth: 4,
        borderLeftColor: '#10ac84',
        backgroundColor: '#f8fffc',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#333',
        fontFamily: 'poppins-Bold',
        flex: 1,
        textTransform: 'capitalize',
    },
    sectionContent: {
        paddingLeft: 48,
   
    },
    planText: {
        fontSize: 16,
        color: '#444',
        fontFamily: 'poppins',
        lineHeight: 24,
        marginBottom: 8,
    },
    itemHeader: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#667eea',
      
    },
    itemTitle: {
        fontSize: 17,
        color: '#333',
        fontFamily: 'poppins-Bold',
    },
    itemTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#667eea',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 15,
        marginBottom: 8,
    },
    tagText: {
        fontSize: 12,
        color: 'white',
        fontFamily: 'poppins-Medium',
        textTransform: 'uppercase',
    },
    budgetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fff4',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#10ac84',
    },
    budgetText: {
        fontSize: 15,
        color: '#2d3748',
        fontFamily: 'poppins-Medium',
        marginLeft: 8,
        flex: 1,
    },
    imageGallery: {
        marginBottom: 20,
    },
    imageGalleryTitle: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'poppins-Bold',
        marginBottom: 12,
        paddingLeft: 48,
    },
    imageScrollContainer: {
        paddingLeft: 48,
        paddingRight: 25,
    },
    imageContainer: {
        marginRight: 15,
        width: 200,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    placeImage: {
        width: '100%',
        height: 130,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        resizeMode: 'cover',
    },
    imageDescription: {
        padding: 10,
        fontSize: 14,
        color: '#333',
        fontFamily: 'poppins',
        lineHeight: 18,
        backgroundColor: '#fff',
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingTop: 20,
        paddingBottom: 40,
        minHeight: 400,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'poppins-Bold',
        color: '#333',
    },
    modalCloseButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareOptionsContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    shareOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        marginBottom: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    shareOptionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    shareOptionText: {
        flex: 1,
    },
    shareOptionTitle: {
        fontSize: 16,
        fontFamily: 'poppins-Bold',
        color: '#333',
        marginBottom: 2,
    },
    shareOptionDescription: {
        fontSize: 13,
        fontFamily: 'poppins',
        color: '#666',
        lineHeight: 18,
    },
});