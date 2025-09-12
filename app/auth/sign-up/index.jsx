import Ionicons from '@expo/vector-icons/Ionicons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithCredential, updateProfile } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../../configs/FirebaseConfig';

const { width, height } = Dimensions.get('window');

const SignUp = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
    GoogleSignin.configure({
      webClientId: '911525943345-f4etjm1ng986hqie24vg8umnh5lb448c.apps.googleusercontent.com'
    });
  }, [])

  const onGoogleButtonPress = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      let idToken = signInResult.idToken || signInResult?.data?.idToken;
      if (!idToken) throw new Error('No ID token found');

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(getAuth(), googleCredential);
      const user = userCredential.user;

      console.log('Signed in user:', user);
      Alert.alert('Sign-up Success');
      router.replace('/mytrip');
    } catch (error) {
      console.error('Google Sign-Up Error:', error);
      Alert.alert('Google Sign-Up Failed', error.message || 'Something went wrong');
    }
  };

  const validateInputs = () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Info', 'Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Missing Info', 'Please enter your email address');
      return false;
    }
    if (!password) {
      Alert.alert('Missing Info', 'Please enter a password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return false;
    }
    if (!agreeToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms & Conditions');
      return false;
    }
    return true;
  };

  const onCreateAccount = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with full name
      await updateProfile(user, {
        displayName: fullName
      });

      console.log('User created:', user);
      ToastAndroid.show('Account created successfully!', ToastAndroid.SHORT);
      router.replace('/mytrip');
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log('Registration Error:', errorCode, errorMessage);

      if (errorCode === 'auth/email-already-in-use') {
        Alert.alert('Account Exists', 'This email is already registered. Please sign in instead.');
      } else if (errorCode === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
      } else if (errorCode === 'auth/weak-password') {
        Alert.alert('Weak Password', 'Password should be at least 6 characters long');
      } else {
        Alert.alert('Registration Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" translucent={false} />
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>
              </View>

              {/* Logo/Icon Section */}
              <View style={styles.logoSection}>
                <View style={styles.logoContainer}>
                  <Ionicons name="person-add" size={50} color="white" />
                </View>
                <Text style={styles.appName}>Join TripBot</Text>
                <Text style={styles.tagline}>Start your intelligent travel journey</Text>
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Create Your Account</Text>
                <Text style={styles.formSubtitle}>Fill in your details to get started</Text>

                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter your full name"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Create a password"
                      placeholderTextColor="#999"
                      style={[styles.input, styles.passwordInput]}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Confirm your password"
                      placeholderTextColor="#999"
                      style={[styles.input, styles.passwordInput]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Terms & Conditions */}
                <TouchableOpacity
                  style={styles.termsContainer}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                >
                  <View style={[styles.checkbox, agreeToTerms && styles.checkedBox]}>
                    {agreeToTerms && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and{" "}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                {/* Create Account Button */}
                <TouchableOpacity
                  style={[styles.createAccountButton, loading && styles.disabledButton]}
                  onPress={onCreateAccount}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#ccc', '#999'] : ['#10ac84', '#06d6a0']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <Text style={styles.buttonText}>Creating Account...</Text>
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Create Account</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign Up Button - Updated to match sign-in styling */}
                <TouchableOpacity
                  style={[styles.googleSignUpButton, loading && styles.disabledButton]}
                  onPress={() =>
                    onGoogleButtonPress().then(() => console.log('Signed up with Google!'))
                  }
                  disabled={loading}
                >
                  <View style={styles.googleButtonContent}>
                    <View style={styles.googleIconContainer}>
                      <Image
                        source={require('../../../assets/images/google_logo.png')}
                        style={{ width: 30, height: 30 }}
                      />
                    </View>
                    <Text style={styles.googleButtonText}>
                      {loading ? 'Signing up...' : 'Continue with Google'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={() => router.replace('auth/sign-in')}
                >
                  <Text style={styles.signInText}>
                    Already have an account? <Text style={styles.signInLink}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    </View>
  )
}

export default SignUp

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#667eea', // Fallback color
  },
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 30,
    minHeight: height - (StatusBar.currentHeight || 0),
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    marginBottom: 20,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    marginTop: 30
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  appName: {
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'poppins-Bold',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 5,
    fontFamily: 'poppins',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  formTitle: {
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'poppins-Bold',
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    fontFamily: 'poppins',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontFamily: 'poppins-Medium',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'poppins',
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'poppins',
  },
  termsLink: {
    color: '#667eea',
    fontFamily: 'poppins-Bold',
  },
  createAccountButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#10ac84',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'poppins-Bold',
  },
  buttonIcon: {
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
    fontFamily: 'poppins',
  },
  // Updated Google button styling to match sign-in
  googleSignUpButton: {
    backgroundColor: 'white',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  googleIconContainer: {
    marginRight: 15,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'poppins-Bold',
  },
  signInButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  signInText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'poppins',
  },
  signInLink: {
    color: '#667eea',
    fontFamily: 'poppins-Bold',
  },
});