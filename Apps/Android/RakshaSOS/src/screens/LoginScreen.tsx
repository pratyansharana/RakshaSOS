import React, { useState } from 'react';
import { 
    Text, 
    View, 
    TouchableOpacity, 
    StyleSheet, 
    TextInput, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseconfig';
import { useApp } from '../context/AppContext';
import { ensureUserDocument } from '../services/firestoreProfile';
import { resolveNextSetupRoute } from '../services/onboardingFlow';

export default function LoginScreen({ navigation }: { navigation: any }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { hydrateUserSetup, t } = useApp();

    const handleLogin = async () => {
        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }
        
        Keyboard.dismiss(); 
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await ensureUserDocument(userCredential.user.uid, userCredential.user.email);
            const setup = await hydrateUserSetup(userCredential.user.uid);
            navigation.replace(resolveNextSetupRoute(setup)); 
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please check your credentials and try again.');
        } finally {
            setLoading(false); 
        }
    }

    return (
        <View style={styles.mainContainer}>
            {/* Background Decorative Shapes */}
            <View style={styles.topSemicircle} />
            <View style={styles.circleOne} />
            <View style={styles.circleTwo} />

            <SafeAreaView style={styles.safeArea}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.container}
                    >
                        {/* Header Section */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>{t('loginTitle')}</Text>
                            <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
                        </View>

                        {/* Input Section */}
                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput 
                                    placeholder='yourname@example.com' 
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input} 
                                    value={email} 
                                    onChangeText={setEmail} 
                                    autoCapitalize='none' 
                                    keyboardType='email-address' 
                                    editable={!loading} 
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput 
                                        placeholder='********' 
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showPassword} 
                                        style={styles.passwordInput} 
                                        value={password} 
                                        onChangeText={setPassword} 
                                        editable={!loading} 
                                    />
                                    <TouchableOpacity 
                                        style={styles.eyeButton} 
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Text style={styles.eyeText}>
                                            {showPassword ? 'Hide' : 'Show'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.forgotPasswordButton}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Action Section */}
                        <View style={styles.actionContainer}>
                            <TouchableOpacity 
                                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Sign in</Text>
                                )}
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity 
                                style={styles.secondaryButton} 
                                onPress={() => alert('Google Auth to be implemented!')}
                                disabled={loading}
                            >
                                <Text style={styles.secondaryButtonText}>Continue with Google</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.footerLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        overflow: 'hidden', // Keeps the background shapes from breaking the layout
    },
    // --- Decorative Background Shapes ---
    topSemicircle: {
        position: 'absolute',
        top: -300, 
        left: -100,
        right: -100,
        height: 600,
        borderRadius: 300, 
        backgroundColor: '#DC2626',
        opacity: 0.1,
    },
    circleOne: {
        position: 'absolute',
        top: 150,
        right: -60,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#F87171',
        opacity: 0.15,
    },
    circleTwo: {
        position: 'absolute',
        bottom: 100,
        left: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FECACA',
        opacity: 0.2,
    },
    // ------------------------------------
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        marginTop: 100, 
    },
    headerContainer: {
        marginBottom: 40,
        marginTop: 50,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    formContainer: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        fontSize: 16,
        color: '#111827',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        height: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
    },
    eyeButton: {
        paddingHorizontal: 16,
        justifyContent: 'center',
        height: '100%',
    },
    eyeText: {
        color: '#DC2626',
        fontWeight: '600',
        fontSize: 14,
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
    },
    forgotPasswordText: {
        color: '#DC2626',
        fontWeight: '600',
        fontSize: 14,
    },
    actionContainer: {
        marginBottom: 30,
    },
    primaryButton: {
        backgroundColor: '#DC2626', 
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonDisabled: {
        backgroundColor: '#F87171',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        color: '#6B7280',
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: '500',
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    footerText: {
        color: '#6B7280',
        fontSize: 15,
    },
    footerLink: {
        color: '#DC2626',
        fontSize: 15,
        fontWeight: '700',
    },
});
