// GeneratedTravelPlan.js
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import moment from 'moment';
import { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
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
    const [parsedPlan, setParsedPlan] = useState(null);
    const [placeImages, setPlaceImages] = useState({});
    const [hotelImages, setHotelImages] = useState({});
    const [loadingImages, setLoadingImages] = useState(false);

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
                    onPress={handleShare}
                    style={styles.shareButton}
                >
                    <Ionicons name="share" size={24} color="white" />
                </TouchableOpacity>
            ),
        });
    }, [travelPlan]);

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
            restaurants: [
                { id: '1', url: 'https://picsum.photos/400/300?random=20', description: `Restaurant in ${query}` },
                { id: '2', url: 'https://picsum.photos/400/300?random=21', description: `Local cuisine ${query}` },
                { id: '3', url: 'https://picsum.photos/400/300?random=22', description: `Dining in ${query}` },
            ]
        };
        
        return placeholderImages[type] || placeholderImages.places;
    };

    const generateTravelPlan = async () => {
        setLoading(true);
        setTravelPlan('');
        setError('');
        setPlaceImages({});
        setHotelImages({});

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
                
                // Parse the plan and fetch images
                await parseTravelPlanWithImages(generatedText);
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

            // Parse sections based on new structure
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
                    // Handle content before first section
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
            const destinationName = tripData?.locationInfo?.name || 'travel destination';
            
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

            // Fetch activity images
            const activityImagePromises = Array.from(extractedActivities).slice(0, 6).map(async (activity) => {
                const images = await fetchDestinationImages(`${activity} ${destinationName}`, 'places');
                return { activity, images };
            });

            // Add general destination images
            const generalImages = await fetchDestinationImages(destinationName, 'places');
            
            const placeResults = await Promise.all(placeImagePromises);
            const hotelResults = await Promise.all(hotelImagePromises);
            const activityResults = await Promise.all(activityImagePromises);

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

            activityResults.forEach(({ activity, images }) => {
                newPlaceImages.activities[activity] = images;
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

    const handleShare = async () => {
        if (travelPlan) {
            try {
                await Share.share({
                    message: `My Travel Plan for ${tripData?.locationInfo?.name}\n\n${travelPlan}`,
                    title: 'My AI Generated Travel Plan'
                });
            } catch (error) {
                console.log('Error sharing:', error.message);
            }
        }
    };

    const handleRegeneratePlan = () => {
        generateTravelPlan();
    };

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
                        <View key={image.id || index} style={styles.imageContainer}>
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
                        <View style={styles.loadingIconContainer}>
                            <Ionicons name="airplane" size={50} color="white" />
                        </View>
                        <ActivityIndicator size="large" color="white" style={styles.loadingIndicator} />
                        <Text style={styles.loadingTitle}>Creating Your Perfect Trip</Text>
                        <Text style={styles.loadingSubtitle}>
                            Our AI is crafting a personalized itinerary with stunning visuals...
                        </Text>
                        <View style={styles.loadingSteps}>
                            <Text style={styles.loadingStep}>🏨 Finding the best hotels</Text>
                            <Text style={styles.loadingStep}>📍 Discovering amazing places</Text>
                            <Text style={styles.loadingStep}>🎯 Planning exciting activities</Text>
                            <Text style={styles.loadingStep}>💰 Calculating budget breakdown</Text>
                            <Text style={styles.loadingStep}>📸 Gathering destination photos</Text>
                        </View>
                        {loadingImages && (
                            <Text style={styles.loadingImages}>Loading destination images...</Text>
                        )}
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
                                <Ionicons name="map" size={50} color="white" />
                            </View>
                        </View>
                        
                        <Text style={styles.mainTitle}>Your Travel Plan</Text>
                        <Text style={styles.subtitle}>
                            {tripData?.locationInfo?.name} • {tripData?.totalNoOfDays} days
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
                                        <Text style={styles.summaryValue}>{tripData?.locationInfo?.name}</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="people" size={20} color="#667eea" />
                                        <Text style={styles.summaryLabel}>Travelers</Text>
                                        <Text style={styles.summaryValue}>{tripData?.travelCount?.title}</Text>
                                    </View>
                                </View>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="calendar" size={20} color="#667eea" />
                                        <Text style={styles.summaryLabel}>Duration</Text>
                                        <Text style={styles.summaryValue}>{tripData?.totalNoOfDays} days</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="wallet" size={20} color="#667eea" />
                                        <Text style={styles.summaryLabel}>Budget</Text>
                                        <Text style={styles.summaryValue}>{tripData?.budget}</Text>
                                    </View>
                                </View>
                            </Animated.View>

                            {/* Travel Plan Sections */}
                            {parsedPlan ? (
                                parsedPlan.map((section, index) => renderPlanSection(section, index))
                            ) : (
                                <View style={styles.planSection}>
                                    <Text style={styles.planText}>{travelPlan}</Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Action Buttons */}
                        <Animated.View
                            style={[
                                styles.actionButtonsContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.regenerateButton}
                                onPress={handleRegeneratePlan}
                            >
                                <Ionicons name="refresh" size={20} color="#667eea" />
                                <Text style={styles.regenerateButtonText}>Regenerate</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={() => {
                                    Alert.alert("Success", "Travel plan saved successfully!");
                                }}
                            >
                                <LinearGradient
                                    colors={['#10ac84', '#06d6a0']}
                                    style={styles.saveButtonGradient}
                                >
                                    <Ionicons name="bookmark" size={20} color="white" />
                                    <Text style={styles.saveButtonText}>Save Plan</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>
        </>
    );
};

export default GeneratedTravelPlan;

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
    scrollContent: {
        paddingHorizontal: 25,
        paddingBottom: 120,
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
    actionButtonsContainer: {
        position: 'absolute',
        bottom: 30,
        left: 25,
        right: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    regenerateButton: {
        flex: 0.4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 15,
        paddingVertical: 15,
        borderWidth: 2,
        borderColor: '#667eea',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    regenerateButtonText: {
        color: '#667eea',
        fontSize: 16,
        fontFamily: 'poppins-Medium',
        marginLeft: 8,
    },
    saveButton: {
        flex: 0.55,
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#10ac84',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
    },
    saveButtonText: {
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
    loadingImages: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'poppins',
        marginTop: 20,
        fontStyle: 'italic',
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