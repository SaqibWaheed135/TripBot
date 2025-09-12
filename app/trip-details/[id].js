// TripDetails.js - Create this file in your app/trip-details/[id].js or similar route
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
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
    const { id } = useLocalSearchParams(); // Get trip ID from route params
    const navigation = useNavigation();
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // States
    const [tripData, setTripData] = useState(null);
    const [travelPlan, setTravelPlan] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [parsedPlan, setParsedPlan] = useState(null);

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
        if (id) {
            fetchTripDetails();
        }
    }, [id]);

    // Fetch trip details from Firestore
    const fetchTripDetails = async () => {
        try {
            setLoading(true);
            const auth = getAuth(app);
            const user = auth.currentUser;

            if (!user) {
                Alert.alert("Login Required", "Please log in to view trip details.");
                router.replace('/auth/sign-in');
                return;
            }

            // Get trip document from Firestore
            const tripDoc = await getDoc(doc(db, 'UserTrips', id));
            
            if (!tripDoc.exists()) {
                setError('Trip not found');
                return;
            }

            const tripData = tripDoc.data();
            
            // Verify the trip belongs to current user
            if (tripData.uid !== user.uid) {
                setError('You do not have permission to view this trip');
                return;
            }

            setTripData(tripData);
            setTravelPlan(tripData.travelPlan || '');
            
            // Parse the travel plan for better display
            if (tripData.travelPlan) {
                parseTravelPlan(tripData.travelPlan);
            }

        } catch (error) {
            console.error('Error fetching trip details:', error);
            setError('Failed to load trip details');
            Alert.alert("Error", `Failed to load trip details: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const parseTravelPlan = (plan) => {
        const lines = plan.split('\n');
        const sections = [];
        let currentSection = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

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
        if (travelPlan && tripData) {
            try {
                await Share.share({
                    message: `My Travel Plan for ${tripData.destination}\n\n${travelPlan}`,
                    title: 'My Saved Travel Plan'
                });
            } catch (error) {
                console.log('Error sharing:', error.message);
            }
        }
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

                <View style={styles.sectionContent}>
                    {renderStructuredContent(section.content, section.type)}
                </View>
            </Animated.View>
        );
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
                        <Text style={styles.loadingTitle}>Loading Your Trip</Text>
                        <Text style={styles.loadingSubtitle}>
                            Retrieving your saved travel plan...
                        </Text>
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
                        <Text style={styles.errorTitle}>Trip Not Found</Text>
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

    if (!tripData) {
        return null;
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

                        <Text style={styles.mainTitle}>Your Saved Trip</Text>
                        <Text style={styles.subtitle}>
                            {tripData.destination} • {tripData.totalDays} days
                        </Text>
                        <Text style={styles.dateSubtitle}>
                            Saved on {moment(tripData.createdAt).format('MMM DD, YYYY')}
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
                                        <Text style={styles.summaryValue}>{tripData.destination}</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="people" size={20} color="#667eea" />
                                        <Text style={styles.summaryLabel}>Travelers</Text>
                                        <Text style={styles.summaryValue}>{tripData.travelers}</Text>
                                    </View>
                                </View>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="calendar" size={20} color="#667eea" />
                                        <Text style={styles.summaryLabel}>Duration</Text>
                                        <Text style={styles.summaryValue}>{tripData.totalDays} days</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="wallet" size={20} color="#667eea" />
                                        <Text style={styles.summaryLabel}>Budget</Text>
                                        <Text style={styles.summaryValue}>{tripData.budget}</Text>
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
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>
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
        marginBottom: 5,
    },
    dateSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        fontFamily: 'poppins',
        fontStyle: 'italic',
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