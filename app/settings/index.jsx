// app/settings/index.js
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { app, db } from '../../configs/FirebaseConfig.jsx';

const { width } = Dimensions.get('window');

const Settings = () => {
    const navigation = useNavigation();
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const auth = getAuth(app);
    const user = auth.currentUser;

    // States
    const [userSettings, setUserSettings] = useState({
        theme: 'auto',
        currency: 'USD',
        language: 'en',
        units: 'metric',
        pushNotifications: true,
        emailNotifications: true,
        tripReminders: true,
        offlineMode: false,
        defaultBudget: 'moderate',
        defaultTripDays: '3',
        aiCreativity: 'balanced',
        familyFriendly: false,
        dataUsage: true,
        locationServices: true,
    });
    
    const [loading, setLoading] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: user?.displayName || '',
        email: user?.email || '',
    });

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

        // Load user settings
        loadUserSettings();
    }, []);

    const loadUserSettings = async () => {
        if (!user) return;
        
        try {
            const userDoc = await getDoc(doc(db, 'UserSettings', user.uid));
            if (userDoc.exists()) {
                setUserSettings(prev => ({
                    ...prev,
                    ...userDoc.data()
                }));
            }
        } catch (error) {
            console.log('Error loading settings:', error);
        }
    };

    const updateSetting = async (key, value) => {
        const newSettings = { ...userSettings, [key]: value };
        setUserSettings(newSettings);
        
        if (user) {
            try {
                await updateDoc(doc(db, 'UserSettings', user.uid), {
                    [key]: value,
                    updatedAt: new Date().toISOString()
                });
            } catch (error) {
                console.log('Error updating setting:', error);
            }
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            router.replace('/login');
                        } catch (error) {
                            Alert.alert("Error", "Failed to sign out");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action cannot be undone. All your trips and data will be permanently deleted.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => setShowDeleteConfirm(true)
                }
            ]
        );
    };

    const confirmDeleteAccount = async () => {
        setLoading(true);
        try {
            // In a real app, you'd call your backend to delete user data
            // Then delete the Firebase auth account
            await user.delete();
            router.replace('/login');
        } catch (error) {
            Alert.alert("Error", "Failed to delete account");
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const clearCache = () => {
        Alert.alert(
            "Clear Cache",
            "This will clear all cached data and may slow down the app temporarily.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    onPress: () => {
                        // Implement cache clearing logic
                        Alert.alert("Success", "Cache cleared successfully");
                    }
                }
            ]
        );
    };

    const openURL = (url) => {
        Linking.openURL(url).catch(err => {
            Alert.alert("Error", "Could not open link");
        });
    };

    // Settings Sections Data
    const settingsSections = [
        {
            title: "Account",
            items: [
                {
                    icon: "person-circle",
                    title: "Profile Information",
                    subtitle: user?.displayName || user?.email || "Update your details",
                    type: "navigation",
                    onPress: () => setShowProfileModal(true)
                },
                {
                    icon: "log-out",
                    title: "Sign Out",
                    subtitle: "Sign out of your account",
                    type: "navigation",
                    onPress: handleSignOut,
                    destructive: true
                }
            ]
        },
        {
            title: "Trip Preferences",
            items: [
                {
                    icon: "wallet",
                    title: "Default Budget",
                    subtitle: userSettings.defaultBudget,
                    type: "picker",
                    options: ["budget", "moderate", "luxury"],
                    value: userSettings.defaultBudget,
                    onchange: (value) => updateSetting('defaultBudget', value)
                },
                {
                    icon: "calendar",
                    title: "Default Trip Duration",
                    subtitle: `${userSettings.defaultTripDays} days`,
                    type: "picker",
                    options: ["1", "2", "3", "4", "5", "7", "10", "14"],
                    value: userSettings.defaultTripDays,
                    onchange: (value) => updateSetting('defaultTripDays', value)
                },
                {
                    icon: "sparkles",
                    title: "AI Creativity Level",
                    subtitle: userSettings.aiCreativity,
                    type: "picker",
                    options: ["conservative", "balanced", "creative"],
                    value: userSettings.aiCreativity,
                    onchange: (value) => updateSetting('aiCreativity', value)
                },
                {
                    icon: "people",
                    title: "Family-Friendly Mode",
                    subtitle: "Filter content for families",
                    type: "switch",
                    value: userSettings.familyFriendly,
                    onchange: (value) => updateSetting('familyFriendly', value)
                }
            ]
        },
        {
            title: "App Preferences",
            items: [
                {
                    icon: "moon",
                    title: "Theme",
                    subtitle: userSettings.theme,
                    type: "picker",
                    options: ["light", "dark", "auto"],
                    value: userSettings.theme,
                    onchange: (value) => updateSetting('theme', value)
                },
                {
                    icon: "cash",
                    title: "Currency",
                    subtitle: userSettings.currency,
                    type: "picker",
                    options: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"],
                    value: userSettings.currency,
                    onchange: (value) => updateSetting('currency', value)
                },
                {
                    icon: "language",
                    title: "Language",
                    subtitle: "English",
                    type: "picker",
                    options: ["en", "es", "fr", "de"],
                    value: userSettings.language,
                    onchange: (value) => updateSetting('language', value)
                },
                {
                    icon: "speedometer",
                    title: "Units",
                    subtitle: userSettings.units === 'metric' ? 'Metric' : 'Imperial',
                    type: "picker",
                    options: ["metric", "imperial"],
                    value: userSettings.units,
                    onchange: (value) => updateSetting('units', value)
                }
            ]
        },
        {
            title: "Notifications",
            items: [
                {
                    icon: "notifications",
                    title: "Push Notifications",
                    subtitle: "Trip reminders and updates",
                    type: "switch",
                    value: userSettings.pushNotifications,
                    onchange: (value) => updateSetting('pushNotifications', value)
                },
                {
                    icon: "mail",
                    title: "Email Notifications",
                    subtitle: "Weekly inspiration and updates",
                    type: "switch",
                    value: userSettings.emailNotifications,
                    onchange: (value) => updateSetting('emailNotifications', value)
                },
                {
                    icon: "alarm",
                    title: "Trip Reminders",
                    subtitle: "Upcoming trip notifications",
                    type: "switch",
                    value: userSettings.tripReminders,
                    onchange: (value) => updateSetting('tripReminders', value)
                }
            ]
        },
        {
            title: "Privacy & Data",
            items: [
                {
                    icon: "analytics",
                    title: "Usage Analytics",
                    subtitle: "Help improve the app",
                    type: "switch",
                    value: userSettings.dataUsage,
                    onchange: (value) => updateSetting('dataUsage', value)
                },
                {
                    icon: "location",
                    title: "Location Services",
                    subtitle: "For local recommendations",
                    type: "switch",
                    value: userSettings.locationServices,
                    onchange: (value) => updateSetting('locationServices', value)
                },
                {
                    icon: "download",
                    title: "Export Trip Data",
                    subtitle: "Download your personal data",
                    type: "navigation",
                    onPress: () => Alert.alert("Feature Coming Soon", "Data export will be available in a future update")
                }
            ]
        },
        {
            title: "Support",
            items: [
                {
                    icon: "help-circle",
                    title: "Help & Support",
                    subtitle: "FAQs and contact support",
                    type: "navigation",
                    onPress: () => router.push('/help-support')
                },
                {
                    icon: "star",
                    title: "Rate TripBot",
                    subtitle: "Leave a review on the app store",
                    type: "navigation",
                    onPress: () => openURL('https://apps.apple.com/app/tripbot')
                },
                {
                    icon: "chatbubble",
                    title: "Send Feedback",
                    subtitle: "Share your thoughts and ideas",
                    type: "navigation",
                    onPress: () => Alert.alert("Feedback", "Thank you for wanting to share feedback! Please use the contact form in Help & Support.")
                }
            ]
        },
        {
            title: "Advanced",
            items: [
                {
                    icon: "refresh",
                    title: "Clear Cache",
                    subtitle: "Free up storage space",
                    type: "navigation",
                    onPress: clearCache
                },
                {
                    icon: "trash",
                    title: "Delete Account",
                    subtitle: "Permanently delete your account",
                    type: "navigation",
                    onPress: handleDeleteAccount,
                    destructive: true
                }
            ]
        },
        {
            title: "About",
            items: [
                {
                    icon: "information-circle",
                    title: "Version",
                    subtitle: "1.0.0",
                    type: "info"
                },
                {
                    icon: "document-text",
                    title: "Privacy Policy",
                    subtitle: "How we handle your data",
                    type: "navigation",
                    onPress: () => openURL('https://tripbot.com/privacy')
                },
                {
                    icon: "document",
                    title: "Terms of Service",
                    subtitle: "App usage terms",
                    type: "navigation",
                    onPress: () => openURL('https://tripbot.com/terms')
                }
            ]
        }
    ];

    const ProfileModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showProfileModal}
            onRequestClose={() => setShowProfileModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <TouchableOpacity
                            onPress={() => setShowProfileModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.profileForm}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Display Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={profileForm.name}
                                onChangeText={(text) => setProfileForm({...profileForm, name: text})}
                                placeholder="Your display name"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={[styles.textInput, styles.disabledInput]}
                                value={profileForm.email}
                                editable={false}
                                placeholderTextColor="#999"
                            />
                            <Text style={styles.inputNote}>Email cannot be changed</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => {
                                // Save profile changes
                                setShowProfileModal(false);
                                Alert.alert("Success", "Profile updated successfully");
                            }}
                        >
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const DeleteConfirmModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={showDeleteConfirm}
            onRequestClose={() => setShowDeleteConfirm(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.deleteModalContent}>
                    <Ionicons name="warning" size={60} color="#ff6b6b" />
                    <Text style={styles.deleteModalTitle}>Delete Account?</Text>
                    <Text style={styles.deleteModalText}>
                        This will permanently delete your account and all trip data. This action cannot be undone.
                    </Text>
                    <View style={styles.deleteModalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowDeleteConfirm(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={confirmDeleteAccount}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderSettingItem = (item) => {
        switch (item.type) {
            case 'switch':
                return (
                    <View key={item.title} style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name={item.icon} size={20} color="#667eea" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>{item.title}</Text>
                                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                            </View>
                        </View>
                        <Switch
                            value={item.value}
                            onValueChange={item.onchange}
                            trackColor={{ false: '#ddd', true: '#667eea' }}
                            thumbColor={item.value ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                );
            
            case 'picker':
                return (
                    <TouchableOpacity
                        key={item.title}
                        style={styles.settingItem}
                        onPress={() => {
                            Alert.alert(
                                item.title,
                                "Select an option:",
                                item.options.map(option => ({
                                    text: option.charAt(0).toUpperCase() + option.slice(1),
                                    onPress: () => item.onchange(option)
                                })).concat([{ text: "Cancel", style: "cancel" }])
                            );
                        }}
                    >
                        <View style={styles.settingInfo}>
                            <Ionicons name={item.icon} size={20} color="#667eea" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>{item.title}</Text>
                                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                );
            
            case 'navigation':
                return (
                    <TouchableOpacity
                        key={item.title}
                        style={styles.settingItem}
                        onPress={item.onPress}
                    >
                        <View style={styles.settingInfo}>
                            <Ionicons 
                                name={item.icon} 
                                size={20} 
                                color={item.destructive ? "#ff6b6b" : "#667eea"} 
                            />
                            <View style={styles.settingText}>
                                <Text style={[
                                    styles.settingTitle, 
                                    item.destructive && styles.destructiveText
                                ]}>
                                    {item.title}
                                </Text>
                                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                );
            
            case 'info':
                return (
                    <View key={item.title} style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name={item.icon} size={20} color="#667eea" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>{item.title}</Text>
                                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                            </View>
                        </View>
                    </View>
                );
            
            default:
                return null;
        }
    };

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
                                <Ionicons name="settings" size={35} color="white" />
                            </View>
                        </View>
                        <Text style={styles.mainTitle}>Settings</Text>
                        <Text style={styles.subtitle}>
                            Customize your TripBot experience
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
                            {settingsSections.map((section, index) => (
                                <View key={section.title} style={styles.section}>
                                    <Text style={styles.sectionTitle}>{section.title}</Text>
                                    <View style={styles.sectionContent}>
                                        {section.items.map(renderSettingItem)}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>
            <ProfileModal />
            <DeleteConfirmModal />
        </>
    );
};

export default Settings;

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
        fontSize: 18,
        color: '#333',
        fontFamily: 'poppins-Bold',
        marginBottom: 15,
        marginLeft: 5,
    },
    sectionContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingText: {
        marginLeft: 15,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'poppins-Medium',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'poppins',
    },
    destructiveText: {
        color: '#ff6b6b',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 25,
        width: width - 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
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
    profileForm: {
        padding: 20,
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
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: '#999',
    },
    inputNote: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'poppins',
        marginTop: 5,
        fontStyle: 'italic',
    },
    saveButton: {
        backgroundColor: '#667eea',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'poppins-Medium',
    },
    // Delete Modal
    deleteModalContent: {
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        width: width - 60,
    },
    deleteModalTitle: {
        fontSize: 22,
        fontFamily: 'poppins-Bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 15,
    },
    deleteModalText: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'poppins',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    deleteModalButtons: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontFamily: 'poppins-Medium',
    },
    deleteButton: {
        flex: 1,
        backgroundColor: '#ff6b6b',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'poppins-Medium',
    },
});