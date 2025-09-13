// app/help-support/index.js
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Linking,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

const HelpAndSupport = () => {
    const navigation = useNavigation();
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // States
    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [showTutorialModal, setShowTutorialModal] = useState(false);

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

        // Start animations
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

    // FAQ Data
    const faqData = [
        {
            id: 1,
            question: "How does TripBot generate travel plans?",
            answer: "TripBot uses Google's Gemini AI to create personalized travel itineraries. Simply provide your destination, budget, travel dates, and preferences, and our AI will generate a detailed plan including places to visit, hotels, activities, and budget breakdown."
        },
        {
            id: 2,
            question: "Can I modify the generated trip plans?",
            answer: "Currently, TripBot generates complete trip plans based on your inputs. While direct editing isn't available in this version, you can regenerate plans with different parameters or save multiple versions for comparison."
        },
        {
            id: 3,
            question: "How accurate are the budget estimates?",
            answer: "Budget estimates are based on current market data and typical costs for your selected destination and travel style. Actual costs may vary depending on seasonal pricing, specific choices, and local conditions. We recommend using our estimates as a starting point."
        },
        {
            id: 4,
            question: "Can I use TripBot offline?",
            answer: "TripBot requires an internet connection to generate new trips using the Gemini AI. However, you can view previously saved trips offline. We recommend saving your favorite plans before traveling."
        },
        {
            id: 5,
            question: "How do I save and organize my trips?",
            answer: "Tap the heart icon on any trip to add it to your favorites. You can access all your saved trips from the 'My Trips' section and organize them by destination, date, or favorites."
        },
        {
            id: 6,
            question: "What information do I need to provide?",
            answer: "To generate the best trip plan, provide: destination, travel dates, number of travelers, budget range, travel style (luxury, budget, mid-range), and any specific interests or requirements."
        },
        {
            id: 7,
            question: "Does TripBot work for international destinations?",
            answer: "Yes! TripBot can generate plans for destinations worldwide. The AI considers local customs, visa requirements, best travel times, and regional attractions for international trips."
        },
        {
            id: 8,
            question: "How do I share my trip plans?",
            answer: "Use the share button on any trip to share via messaging apps, email, or social media. You can share quick summaries or complete detailed itineraries."
        }
    ];

    // Quick Help Categories
    const helpCategories = [
        {
            id: 1,
            title: "Getting Started",
            icon: "play-circle",
            description: "Learn how to create your first trip",
            color: ["#667eea", "#764ba2"],
            action: () => setShowTutorialModal(true)
        },
        {
            id: 2,
            title: "Trip Planning Tips",
            icon: "bulb",
            description: "Best practices for better results",
            color: ["#ffecd2", "#fcb69f"],
            action: () => showTipsAlert()
        },
        {
            id: 3,
            title: "Account & Data",
            icon: "person-circle",
            description: "Manage your account and trips",
            color: ["#a8edea", "#fed6e3"],
            action: () => showAccountInfoAlert()
        },
        {
            id: 4,
            title: "Technical Issues",
            icon: "construct",
            description: "Troubleshooting and bug reports",
            color: ["#ff9a9e", "#fecfef"],
            action: () => setShowContactModal(true)
        }
    ];

    const handleFAQToggle = (faqId) => {
        setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
    };

    const handleContactSubmit = async () => {
        if (!contactForm.name || !contactForm.email || !contactForm.message) {
            Alert.alert("Missing Information", "Please fill in all required fields.");
            return;
        }

        setSubmittingFeedback(true);
        
        // Simulate API call - Replace with your actual backend
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            Alert.alert(
                "Message Sent!",
                "Thank you for your feedback. We'll get back to you within 24-48 hours.",
                [{ text: "OK", onPress: () => {
                    setShowContactModal(false);
                    setContactForm({ name: '', email: '', subject: '', message: '' });
                }}]
            );
        } catch (error) {
            Alert.alert("Error", "Failed to send message. Please try again.");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const showTipsAlert = () => {
        Alert.alert(
            "Trip Planning Tips",
            "• Be specific about your interests\n• Include your travel style preference\n• Mention any dietary restrictions\n• Specify if you need family-friendly options\n• Consider mentioning preferred activities\n• Include any accessibility needs",
            [{ text: "Got it!" }]
        );
    };

    const showAccountInfoAlert = () => {
        Alert.alert(
            "Account Information",
            "Your trips are automatically saved to your account. You can:\n• View all trips in 'My Trips'\n• Mark favorites with the heart icon\n• Share trips with friends\n• Access trips offline once saved",
            [{ text: "Understood" }]
        );
    };

    const openExternalLink = (url) => {
        Linking.openURL(url).catch(err => {
            Alert.alert("Error", "Could not open link");
        });
    };

    // Contact Modal Component
    const ContactModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showContactModal}
            onRequestClose={() => setShowContactModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Contact Support</Text>
                        <TouchableOpacity
                            onPress={() => setShowContactModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.contactForm}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={contactForm.name}
                                onChangeText={(text) => setContactForm({...contactForm, name: text})}
                                placeholder="Your name"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={contactForm.email}
                                onChangeText={(text) => setContactForm({...contactForm, email: text})}
                                placeholder="your.email@example.com"
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Subject</Text>
                            <TextInput
                                style={styles.textInput}
                                value={contactForm.subject}
                                onChangeText={(text) => setContactForm({...contactForm, subject: text})}
                                placeholder="Brief description of your issue"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Message *</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={contactForm.message}
                                onChangeText={(text) => setContactForm({...contactForm, message: text})}
                                placeholder="Describe your issue or feedback in detail..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, submittingFeedback && styles.submitButtonDisabled]}
                            onPress={handleContactSubmit}
                            disabled={submittingFeedback}
                        >
                            {submittingFeedback ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="send" size={18} color="white" />
                                    <Text style={styles.submitButtonText}>Send Message</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // Tutorial Modal Component
    const TutorialModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showTutorialModal}
            onRequestClose={() => setShowTutorialModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>How to Use TripBot</Text>
                        <TouchableOpacity
                            onPress={() => setShowTutorialModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.tutorialContent}>
                        <View style={styles.tutorialStep}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Choose Your Destination</Text>
                                <Text style={styles.stepDescription}>
                                    Enter the city or country you want to visit. Be specific for better results.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.tutorialStep}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Set Your Preferences</Text>
                                <Text style={styles.stepDescription}>
                                    Select your travel dates, number of travelers, budget, and travel style.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.tutorialStep}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Generate Your Plan</Text>
                                <Text style={styles.stepDescription}>
                                    TripBot's AI will create a personalized itinerary with places, hotels, and activities.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.tutorialStep}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>4</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Save & Share</Text>
                                <Text style={styles.stepDescription}>
                                    Save your favorite trips and share them with friends and family.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#4facfe" />
            <LinearGradient
                colors={['#4facfe', '#00f2fe']}
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
                                <Ionicons name="help-circle" size={35} color="white" />
                            </View>
                        </View>
                        <Text style={styles.mainTitle}>Help & Support</Text>
                        <Text style={styles.subtitle}>
                            We're here to help you plan amazing trips
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
                            {/* Quick Help Categories */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Quick Help</Text>
                                <View style={styles.categoriesGrid}>
                                    {helpCategories.map((category) => (
                                        <TouchableOpacity
                                            key={category.id}
                                            style={styles.categoryCard}
                                            onPress={category.action}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={category.color}
                                                style={styles.categoryIcon}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <Ionicons name={category.icon} size={24} color="white" />
                                            </LinearGradient>
                                            <Text style={styles.categoryTitle}>{category.title}</Text>
                                            <Text style={styles.categoryDescription} numberOfLines={2}>
                                                {category.description}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* FAQ Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                                {faqData.map((faq) => (
                                    <View key={faq.id} style={styles.faqItem}>
                                        <TouchableOpacity
                                            style={styles.faqQuestion}
                                            onPress={() => handleFAQToggle(faq.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.faqQuestionText}>{faq.question}</Text>
                                            <Ionicons
                                                name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"}
                                                size={20}
                                                color="#4facfe"
                                            />
                                        </TouchableOpacity>
                                        {expandedFAQ === faq.id && (
                                            <View style={styles.faqAnswer}>
                                                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>

                            {/* Contact Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Still Need Help?</Text>
                                <View style={styles.contactOptions}>
                                    <TouchableOpacity
                                        style={styles.contactButton}
                                        onPress={() => setShowContactModal(true)}
                                    >
                                        <Ionicons name="mail" size={20} color="#4facfe" />
                                        <Text style={styles.contactButtonText}>Send us a message</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.contactButton}
                                        onPress={() => openExternalLink('mailto:support@tripbot.com')}
                                    >
                                        <Ionicons name="at" size={20} color="#4facfe" />
                                        <Text style={styles.contactButtonText}>support@tripbot.com</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* App Info */}
                            <View style={styles.section}>
                                <View style={styles.appInfo}>
                                    <Text style={styles.appInfoTitle}>TripBot</Text>
                                    <Text style={styles.appInfoText}>Version 1.0.0</Text>
                                    <Text style={styles.appInfoText}>Powered by Google Gemini AI</Text>
                                    <TouchableOpacity
                                        style={styles.linkButton}
                                        onPress={() => openExternalLink('https://tripbot.com/privacy')}
                                    >
                                        <Text style={styles.linkButtonText}>Privacy Policy</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.linkButton}
                                        onPress={() => openExternalLink('https://tripbot.com/terms')}
                                    >
                                        <Text style={styles.linkButtonText}>Terms of Service</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>
            <ContactModal />
            <TutorialModal />
        </>
    );
};

export default HelpAndSupport;

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
    scrollContent: {
        paddingHorizontal: 25,
        paddingBottom: 50,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 22,
        color: '#333',
        fontFamily: 'poppins-Bold',
        marginBottom: 20,
    },
    // Quick Help Categories
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: (width - 70) / 2,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    categoryIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    categoryTitle: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'poppins-Bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    categoryDescription: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'poppins',
        textAlign: 'center',
        lineHeight: 18,
    },
    // FAQ Section
    faqItem: {
        backgroundColor: 'white',
        borderRadius: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    faqQuestionText: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'poppins-Medium',
        flex: 1,
        marginRight: 10,
    },
    faqAnswer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
        backgroundColor: '#fafafa',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    faqAnswerText: {
        fontSize: 15,
        color: '#666',
        fontFamily: 'poppins',
        lineHeight: 22,
        paddingTop: 15,
    },
    // Contact Section
    contactOptions: {
        gap: 15,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    contactButtonText: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'poppins-Medium',
        marginLeft: 15,
    },
    // App Info
    appInfo: {
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 25,
        borderRadius: 20,
    },
    appInfoTitle: {
        fontSize: 20,
        color: '#333',
        fontFamily: 'poppins-Bold',
        marginBottom: 10,
    },
    appInfoText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'poppins',
        marginBottom: 5,
    },
    linkButton: {
        marginTop: 10,
    },
    linkButtonText: {
        fontSize: 14,
        color: '#4facfe',
        fontFamily: 'poppins-Medium',
        textDecorationLine: 'underline',
    },
    // Modal Styles
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
        maxHeight: '85%',
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
    // Contact Form
    contactForm: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'poppins-Medium',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'poppins',
        backgroundColor: '#fafafa',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4facfe',
        paddingVertical: 15,
        borderRadius: 15,
        marginBottom: 20,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'poppins-Medium',
        marginLeft: 8,
    },
    // Tutorial Styles
    tutorialContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    tutorialStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 25,
    },
    stepNumber: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#4facfe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    stepNumberText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'poppins-Bold',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 18,
        color: '#333',
        fontFamily: 'poppins-Bold',
        marginBottom: 8,
    },
    stepDescription: {
        fontSize: 15,
        color: '#666',
        fontFamily: 'poppins',
        lineHeight: 22,
    },
});