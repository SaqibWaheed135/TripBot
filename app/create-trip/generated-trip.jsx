// GeneratedTravelPlan.js
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import moment from 'moment';
import { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
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
import { CreateTripContext } from '../../context/CreateTripContext';

const { width } = Dimensions.get('window');

const GeneratedTravelPlan = () => {
    const { tripData } = useContext(CreateTripContext);
    const navigation = useNavigation();
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // States for AI generation
    const [travelPlan, setTravelPlan] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tripId, setTripId] = useState(null);
    
    // New states for enhanced features
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
    }, [isFavorite, isProcessingFavorite]);

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
        if (tripData) {
            generateTravelPlan();
        }
    }, [tripData]);

    // Check if trip is already favorited when tripId is set
    useEffect(() => {
        if (tripId) {
            checkIfFavorite();
        }
    }, [tripId]);

    const generateTravelPlan = async () => {
        setLoading(true);
        setTravelPlan('');
        setError('');

        // Format dates for better context
        const formatDateRange = () => {
            if (!tripData?.startDate || !tripData?.endDate) return 'flexible dates';

            const start = moment(tripData.startDate);
            const end = moment(tripData.endDate);

            if (start.year() === end.year()) {
                return `${start.format('MMM DD')} - ${end.format('MMM DD, YYYY')}`;
            }
            return `${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`;
        };

        // Enhanced structured prompt for better parsing
        const prompt = `Create a comprehensive ${tripData?.totalNoOfDays || 'multi'}-day travel itinerary for ${tripData?.locationInfo?.name || 'the destination'}. 

        Trip Details:
        - Destination: ${tripData?.locationInfo?.name || 'Not specified'}
        - Duration: ${tripData?.totalNoOfDays || 'Multiple'} days
        - Travel Dates: ${formatDateRange()}
        - Travelers: ${tripData?.travelCount?.title || 'Not specified'} (${tripData?.travelCount?.desc || ''})
        - Budget: ${tripData?.budget || 'Moderate budget'}

        Please provide a detailed travel plan with EXACTLY the following structure (use these exact section headers):

        **SECTION_OVERVIEW**
        Brief introduction to the destination, best time to visit, and general travel tips for ${tripData?.locationInfo?.name}.

        **SECTION_HOTELS**
        Recommend 5-7 hotels with different budget ranges:
        - HOTEL_NAME: [Hotel Name]
        - HOTEL_TYPE: [Luxury/Mid-range/Budget/Boutique]
        - HOTEL_LOCATION: [Specific area/neighborhood]
        - HOTEL_PRICE: [Price range per night]
        - HOTEL_AMENITIES: [Key features and amenities]
        - HOTEL_RATING: [Star rating or review score]
        - HOTEL_HIGHLIGHTS: [What makes this hotel special]

        **SECTION_PLACES**
        List 8-10 must-visit places and attractions:
        - PLACE_NAME: [Place/Attraction name]
        - PLACE_TYPE: [Historical/Natural/Cultural/Religious/Entertainment]
        - PLACE_LOCATION: [Specific address or area]
        - PLACE_TIMING: [Best time to visit and duration]
        - PLACE_COST: [Entry fees if applicable]
        - PLACE_HIGHLIGHTS: [What to see/do there]
        - PLACE_TIPS: [Insider tips for visiting]

        **SECTION_ACTIVITIES**
        List 10-12 activities and experiences:
        - ACTIVITY_NAME: [Activity name]
        - ACTIVITY_TYPE: [Adventure/Cultural/Food/Shopping/Relaxation]
        - ACTIVITY_LOCATION: [Where to do this activity]
        - ACTIVITY_DURATION: [Time needed]
        - ACTIVITY_COST: [Estimated cost]
        - ACTIVITY_SEASON: [Best season/time]
        - ACTIVITY_DESCRIPTION: [Detailed description]

        **SECTION_BUDGET**
        Provide detailed budget breakdown:
        - BUDGET_ACCOMMODATION: [Hotels cost breakdown by category]
        - BUDGET_FOOD: [Daily food expenses - breakfast, lunch, dinner]
        - BUDGET_TRANSPORT: [Local transport and airport transfers]
        - BUDGET_ACTIVITIES: [Entry fees and activity costs]
        - BUDGET_SHOPPING: [Estimated shopping budget]
        - BUDGET_MISCELLANEOUS: [Tips, emergency fund, etc.]
        - BUDGET_TOTAL_PER_DAY: [Daily total per person]
        - BUDGET_TOTAL_TRIP: [Total trip cost per person]
        - BUDGET_SAVING_TIPS: [How to save money]

        **SECTION_ITINERARY_DAY_1**
        **Morning (9:00 AM - 12:00 PM):**
        - ACTIVITY: [Specific activity]
        - LOCATION: [Exact location]
        - DURATION: [Time needed]
        - COST: [Estimated cost]

        **Afternoon (12:00 PM - 5:00 PM):**
        - ACTIVITY: [Specific activity]
        - LOCATION: [Exact location]
        - DURATION: [Time needed]
        - COST: [Estimated cost]

        **Evening (5:00 PM - 9:00 PM):**
        - ACTIVITY: [Specific activity]
        - LOCATION: [Exact location]
        - DURATION: [Time needed]
        - COST: [Estimated cost]

        Continue this day-by-day format for all ${tripData?.totalNoOfDays || ''} days.

        **SECTION_TRAVEL_TIPS**
        - Local customs and etiquette
        - Weather and packing suggestions
        - Currency and payment methods
        - Transportation tips
        - Safety and emergency contacts
        - Language basics
        - Cultural do's and don'ts

        Please ensure all recommendations are specific with actual names of places, hotels, and activities where possible.`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
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
                setTravelPlan(generatedText);

                // Save to Firestore and get trip ID
                const savedTripId = await savePlanToFirestore(generatedText);
                
                if (savedTripId) {
                    setTripId(savedTripId);
                    setIsSaved(true); // Mark as saved since we just saved it
                    // Navigate to trip details after a short delay
                    setTimeout(() => {
                        router.push(`/create-trip/trip-details/${savedTripId}`);
                    }, 2000);
                }
            } else {
                setError('No travel plan generated. Please try again.');
            }
        } catch (err) {
            console.error('Error generating travel plan:', err);
            setError(`Failed to generate travel plan: ${err.message}`);
            Alert.alert("Error", `Failed to generate travel plan: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const savePlanToFirestore = async (planText) => {
        try {
            const auth = getAuth(app);
            const user = auth.currentUser;

            if (!user) {
                Alert.alert("Login Required", "Please log in to save your travel plan.");
                return null;
            }

            if (!tripData) {
                Alert.alert("Error", "Missing trip data. Please try again.");
                return null;
            }

            // Helper function to clean undefined values
            const cleanObject = (obj) => {
                if (obj === null || obj === undefined) return null;
                if (typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(cleanObject);
                
                const cleaned = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (value !== undefined) {
                        cleaned[key] = cleanObject(value);
                    }
                }
                return cleaned;
            };

            // Clean and prepare the data
            const tripDocData = {
                uid: user.uid,
                destination: tripData?.locationInfo?.name || '',
                travelPlan: planText || '',
                createdAt: new Date().toISOString(),
                totalDays: tripData?.totalNoOfDays || 0,
                budget: tripData?.budget || '',
                travelers: tripData?.travelCount?.title || '',
                startDate: tripData?.startDate ? moment(tripData.startDate).format('YYYY-MM-DD') : null,
                endDate: tripData?.endDate ? moment(tripData.endDate).format('YYYY-MM-DD') : null,
                status: 'active',
                isFavorite: false, // Default to false
                shareCount: 0, // Track how many times shared
                lastShared: null
            };

            // Only add locationInfo if it exists and has valid data
            if (tripData?.locationInfo) {
                const cleanedLocationInfo = cleanObject(tripData.locationInfo);
                if (cleanedLocationInfo && Object.keys(cleanedLocationInfo).length > 0) {
                    tripDocData.locationInfo = cleanedLocationInfo;
                }
            }

            // Only add travelCount if it exists and has valid data
            if (tripData?.travelCount) {
                const cleanedTravelCount = cleanObject(tripData.travelCount);
                if (cleanedTravelCount && Object.keys(cleanedTravelCount).length > 0) {
                    tripDocData.travelCount = cleanedTravelCount;
                }
            }

            console.log("📝 Saving trip data:", JSON.stringify(tripDocData, null, 2));

            const tripDoc = await addDoc(collection(db, 'UserTrips'), tripDocData);

            console.log("✅ Trip saved successfully with ID:", tripDoc.id);
            return tripDoc.id;

        } catch (error) {
            console.error("🔥 Firestore error:", error);
            Alert.alert("Error", `Failed to save trip: ${error.message}`);
            return null;
        }
    };

    // Check if trip is favorited
    const checkIfFavorite = async () => {
        if (!tripId) return;
        
        try {
            const tripDoc = await getDoc(doc(db, 'UserTrips', tripId));
            if (tripDoc.exists()) {
                const data = tripDoc.data();
                setIsFavorite(data.isFavorite || false);
            }
        } catch (error) {
            console.error("Error checking favorite status:", error);
        }
    };

    // Toggle favorite status
    const handleFavoriteToggle = async () => {
        if (!tripId || isProcessingFavorite) return;
        
        setIsProcessingFavorite(true);
        
        try {
            const newFavoriteStatus = !isFavorite;
            
            // Update in Firestore
            await updateDoc(doc(db, 'UserTrips', tripId), {
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
        if (!travelPlan || !tripData) return;
        
        try {
            let shareContent = '';
            
            switch (shareType) {
                case 'summary':
                    shareContent = `🌟 My AI-Generated Travel Plan\n\n` +
                        `📍 Destination: ${tripData?.locationInfo?.name}\n` +
                        `📅 Duration: ${tripData?.totalNoOfDays} days\n` +
                        `👥 Travelers: ${tripData?.travelCount?.title}\n` +
                        `💰 Budget: ${tripData?.budget}\n\n` +
                        `✨ Created with AI Travel Planner`;
                    break;
                
                case 'full':
                    shareContent = `🌟 My Complete Travel Plan for ${tripData?.locationInfo?.name}\n\n${travelPlan}`;
                    break;
                
                case 'link':
                    // This would be used if you have a web version or deep linking
                    shareContent = `Check out my travel plan for ${tripData?.locationInfo?.name}!\n\n` +
                        `📱 View full details: [Your App Link Here]`;
                    break;
                
                default:
                    shareContent = `🌟 Check out my travel plan for ${tripData?.locationInfo?.name}!\n\n` +
                        `📅 ${tripData?.totalNoOfDays} days of amazing experiences\n` +
                        `👥 Perfect for ${tripData?.travelCount?.title}\n\n` +
                        `✨ Created with AI Travel Planner`;
            }

            const result = await Share.share({
                message: shareContent,
                title: `Travel Plan - ${tripData?.locationInfo?.name}`,
                url: '', // Add your app's deep link if available
            });

            // Track share if successful
            if (result.action === Share.sharedAction && tripId) {
                await updateDoc(doc(db, 'UserTrips', tripId), {
                    shareCount: (await getDoc(doc(db, 'UserTrips', tripId))).data()?.shareCount + 1 || 1,
                    lastShared: new Date().toISOString()
                });
            }

            setShowShareModal(false);

        } catch (error) {
            console.error('Error sharing:', error);
            Alert.alert("Error", "Failed to share. Please try again.");
        }
    };

    const handleRegeneratePlan = () => {
        generateTravelPlan();
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

    if (loading) {
        return (
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.loadingContainer}
            >
                <StatusBar barStyle="light-content" backgroundColor="#667eea" />
                <SafeAreaView style={styles.container}>
                    <View style={styles.loadingContent}>
                        <View style={styles.loadingIconContainer}>
                            <Ionicons name="airplane" size={50} color="white" />
                        </View>
                        <ActivityIndicator size="large" color="white" style={styles.loadingIndicator} />
                        <Text style={styles.loadingTitle}>Creating Your Perfect Trip</Text>
                        <Text style={styles.loadingSubtitle}>
                            Our AI is crafting a personalized itinerary...
                        </Text>
                        <View style={styles.loadingSteps}>
                            <Text style={styles.loadingStep}>🏨 Finding the best hotels</Text>
                            <Text style={styles.loadingStep}>📍 Discovering amazing places</Text>
                            <Text style={styles.loadingStep}>🎯 Planning exciting activities</Text>
                            <Text style={styles.loadingStep}>💰 Calculating budget breakdown</Text>
                            <Text style={styles.loadingStep}>💾 Saving your travel plan</Text>
                        </View>
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
                        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={handleRegeneratePlan}
                        >
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // Success screen - shows briefly before navigation
    return (
        <>
            <LinearGradient
                colors={['#10ac84', '#06d6a0']}
                style={styles.container}
            >
                <StatusBar barStyle="light-content" backgroundColor="#10ac84" />
                <SafeAreaView style={styles.container}>
                    <Animated.View
                        style={[
                            styles.successContent,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        <View style={styles.successIconContainer}>
                            <Ionicons name="checkmark-circle" size={100} color="white" />
                        </View>
                        <Text style={styles.successTitle}>Travel Plan Created!</Text>
                        <Text style={styles.successSubtitle}>
                            Your personalized itinerary for {tripData?.locationInfo?.name} is ready
                        </Text>
                        <Text style={styles.successMessage}>
                            Redirecting to your trip details...
                        </Text>
                        
                        <View style={styles.tripSummary}>
                            <View style={styles.summaryItem}>
                                <Ionicons name="location" size={20} color="white" />
                                <Text style={styles.summaryText}>{tripData?.locationInfo?.name}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Ionicons name="calendar" size={20} color="white" />
                                <Text style={styles.summaryText}>{tripData?.totalNoOfDays} days</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Ionicons name="people" size={20} color="white" />
                                <Text style={styles.summaryText}>{tripData?.travelCount?.title}</Text>
                            </View>
                            {isSaved && (
                                <View style={styles.summaryItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="white" />
                                    <Text style={styles.summaryText}>Saved Successfully</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleFavoriteToggle}
                                disabled={isProcessingFavorite}
                            >
                                <Ionicons 
                                    name={isFavorite ? "heart" : "heart-outline"} 
                                    size={20} 
                                    color={isFavorite ? "#ff6b6b" : "white"} 
                                />
                                <Text style={[
                                    styles.actionButtonText,
                                    isFavorite && { color: "#ff6b6b" }
                                ]}>
                                    {isFavorite ? "Favorited" : "Add to Favorites"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setShowShareModal(true)}
                            >
                                <Ionicons name="share" size={20} color="white" />
                                <Text style={styles.actionButtonText}>Share</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.viewPlanButton}
                            onPress={() => tripId && router.push(`/trip-details/${tripId}`)}
                        >
                            <Text style={styles.viewPlanButtonText}>View Trip Details</Text>
                            <Ionicons name="arrow-forward" size={20} color="#10ac84" />
                        </TouchableOpacity>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>
            <ShareModal />
        </>
    );
};

export default GeneratedTravelPlan;

const styles = StyleSheet.create({
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
    loadingIconContainer: {
        marginBottom: 30,
    },
    loadingIndicator: {
        marginBottom: 30,
    },
    loadingTitle: {
        fontSize: 24,
        color: 'white',
        fontFamily: 'poppins-Bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    loadingSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'poppins',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 22,
    },
    loadingSteps: {
        alignItems: 'flex-start',
    },
    loadingStep: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'poppins',
        marginBottom: 10,
        textAlign: 'left',
    },
    // Success states
    successContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    successIconContainer: {
        marginBottom: 30,
    },
    successTitle: {
        fontSize: 28,
        color: 'white',
        fontFamily: 'poppins-Bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    successSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'poppins',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    successMessage: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'poppins',
        textAlign: 'center',
        marginBottom: 40,
        fontStyle: 'italic',
    },
    tripSummary: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        width: '100%',
        maxWidth: 300,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 16,
        color: 'white',
        fontFamily: 'poppins-Medium',
        marginLeft: 12,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        maxWidth: 300,
        marginBottom: 30,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        minWidth: 120,
        justifyContent: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'poppins-Medium',
        marginLeft: 8,
    },
    viewPlanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    viewPlanButtonText: {
        color: '#10ac84',
        fontSize: 16,
        fontFamily: 'poppins-Bold',
        marginRight: 8,
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