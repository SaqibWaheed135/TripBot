import Ionicons from '@expo/vector-icons/Ionicons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
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

const SignIn = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);




  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '911525943345-f4etjm1ng986hqie24vg8umnh5lb448c.apps.googleusercontent.com'
    }
    )
  }, [])

  async function onGoogleButtonPress() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      let idToken = signInResult.idToken || signInResult?.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found');
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(getAuth(), googleCredential);
      const user = userCredential.user;

      console.log('Signed in user:', user);
      Alert.alert('Sign-in Success');

      // ✅ Navigate to /mytrip after successful sign-in
      router.replace('/mytrip');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Google Sign-In Failed', error.message || 'Something went wrong');
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    })
  }, [])

  const onSignInAccount = async () => {
    if (!email || !password) {
      ToastAndroid.show('Please enter all details', ToastAndroid.SHORT);
      Alert.alert('Missing Info', 'Please enter all details');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log(user);
      router.replace('/mytrip');
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log('Login Error:', errorCode, errorMessage);

      if (errorCode === 'auth/user-not-found') {
        Alert.alert('Error', 'User not found');
      } else if (errorCode === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect password');
      } else if (errorCode === 'auth/invalid-email') {
        Alert.alert('Error', 'Please enter a valid email address');
      } else {
        Alert.alert('Login Failed', 'Please check your credentials and try again');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
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
                  <Ionicons name="airplane" size={60} color="white" />
                </View>
                <Text style={styles.appName}>AI TripBot</Text>
                <Text style={styles.tagline}>Your Intelligent Travel Companion</Text>
              </View>

              {/* Welcome Section */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>Welcome Back!</Text>
                <Text style={styles.welcomeSubtitle}>
                  Sign in to continue your journey
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
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

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter your password"
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

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[styles.signInButton, loading && styles.disabledButton]}
                  onPress={onSignInAccount}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#ccc', '#999'] : ['#ff6b6b', '#ee5a24']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <Text style={styles.buttonText}>Signing In...</Text>
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Sign In</Text>
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

                <TouchableOpacity
                  style={[styles.googleSignInButton, loading && styles.disabledButton]}
                  onPress={() => onGoogleButtonPress().then(() => console.log('Signed in with Google!'))}
                  disabled={loading}
                >
                  <View style={styles.googleButtonContent}>
                    <View style={styles.googleIconContainer}>
                      <Ionicons name="logo-google" size={20} color="#4285f4" />
                    </View>
                    <Text style={styles.googleButtonText}>
                      {loading ? 'Signing in...' : 'Continue with Google'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Create Account Button */}
                <TouchableOpacity
                  style={styles.createAccountButton}
                  onPress={() => router.replace('auth/sign-up')}
                >
                  <Text style={styles.createAccountText}>
                    Don't have an account? <Text style={styles.createAccountLink}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>


              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}

export default SignIn

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 25,
  },
  header: {
    paddingTop: 20,
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
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 30,
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
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'poppins-Bold',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'poppins',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    padding: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
    marginTop: -10,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    fontFamily: 'poppins',
  },
  signInButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#ff6b6b',
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
  createAccountButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  createAccountText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'poppins',
  },
  createAccountLink: {
    color: '#667eea',
    fontFamily: 'poppins-Bold',
  },

  googleSignInButton: {
    backgroundColor: 'white',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 10,
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
});