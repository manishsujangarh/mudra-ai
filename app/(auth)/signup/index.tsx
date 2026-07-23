import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../../../src/lib/api';
import { Button } from "@/components/ui";
import WebView from 'react-native-webview';
import { useTranslation } from 'react-i18next';

export default function SignupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [legalUrl, setLegalUrl] = useState('');
    const [legalTitle, setLegalTitle] = useState('');
    const [isLegalLoading, setIsLegalLoading] = useState(true);

    const COUNTRIES = [
        { name: "Afghanistan", code: "AF", dialCode: "+93", flag: "🇦🇫" },
        { name: "Albania", code: "AL", dialCode: "+355", flag: "🇦🇱" },
        { name: "Algeria", code: "DZ", dialCode: "+213", flag: "🇩🇿" },
        { name: "Andorra", code: "AD", dialCode: "+376", flag: "🇦🇩" },
        { name: "Angola", code: "AO", dialCode: "+244", flag: "🇦🇴" },
        { name: "Argentina", code: "AR", dialCode: "+54", flag: "🇦🇷" },
        { name: "Armenia", code: "AM", dialCode: "+374", flag: "🇦🇲" },
        { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
        { name: "Austria", code: "AT", dialCode: "+43", flag: "🇦🇹" },
        { name: "Azerbaijan", code: "AZ", dialCode: "+994", flag: "🇦🇿" },
        { name: "Bahrain", code: "BH", dialCode: "+973", flag: "🇧🇭" },
        { name: "Bangladesh", code: "BD", dialCode: "+880", flag: "🇧🇩" },
        { name: "Belgium", code: "BE", dialCode: "+32", flag: "🇧🇪" },
        { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
        { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
        { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
        { name: "Denmark", code: "DK", dialCode: "+45", flag: "🇩🇰" },
        { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
        { name: "Finland", code: "FI", dialCode: "+358", flag: "🇫🇮" },
        { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
        { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
        { name: "Greece", code: "GR", dialCode: "+30", flag: "🇬🇷" },
        { name: "Hungary", code: "HU", dialCode: "+36", flag: "🇭🇺" },
        { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
        { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩" },
        { name: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪" },
        { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
        { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
        { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
        { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾" },
        { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽" },
        { name: "Nepal", code: "NP", dialCode: "+977", flag: "🇳🇵" },
        { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
        { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
        { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
        { name: "Pakistan", code: "PK", dialCode: "+92", flag: "🇵🇰" },
        { name: "Philippines", code: "PH", dialCode: "+63", flag: "🇵🇭" },
        { name: "Poland", code: "PL", dialCode: "+48", flag: "🇵🇱" },
        { name: "Qatar", code: "QA", dialCode: "+974", flag: "🇶🇦" },
        { name: "Russia", code: "RU", dialCode: "+7", flag: "🇷🇺" },
        { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
        { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬" },
        { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
        { name: "South Korea", code: "KR", dialCode: "+82", flag: "🇰🇷" },
        { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
        { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪" },
        { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭" },
        { name: "Thailand", code: "TH", dialCode: "+66", flag: "🇹🇭" },
        { name: "Turkey", code: "TR", dialCode: "+90", flag: "🇹🇷" },
        { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
        { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
        { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
        { name: "Vietnam", code: "VN", dialCode: "+84", flag: "🇻🇳" },
        { name: "Zimbabwe", code: "ZW", dialCode: "+263", flag: "🇿🇼" },
        { name: "Bolivia", code: "BO", dialCode: "+591", flag: "🇧🇴" },
        { name: "Bulgaria", code: "BG", dialCode: "+359", flag: "🇧🇬" },
        { name: "Chile", code: "CL", dialCode: "+56", flag: "🇨🇱" },
        { name: "Colombia", code: "CO", dialCode: "+57", flag: "🇨🇴" },
        { name: "Costa Rica", code: "CR", dialCode: "+506", flag: "🇨🇷" },
        { name: "Croatia", code: "HR", dialCode: "+385", flag: "🇭🇷" },
        { name: "Cuba", code: "CU", dialCode: "+53", flag: "🇨🇺" },
        { name: "Cyprus", code: "CY", dialCode: "+357", flag: "🇨🇾" },
        { name: "Czechia", code: "CZ", dialCode: "+420", flag: "🇨🇿" },
        { name: "Ecuador", code: "EC", dialCode: "+593", flag: "🇪🇨" },
        { name: "Estonia", code: "EE", dialCode: "+372", flag: "🇪🇪" },
        { name: "Georgia", code: "GE", dialCode: "+995", flag: "🇬🇪" },
        { name: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
        { name: "Guatemala", code: "GT", dialCode: "+502", flag: "🇬🇹" },
        { name: "Hong Kong", code: "HK", dialCode: "+852", flag: "🇭🇰" },
        { name: "Iran", code: "IR", dialCode: "+98", flag: "🇮🇷" },
        { name: "Iraq", code: "IQ", dialCode: "+964", flag: "🇮🇶" },
        { name: "Israel", code: "IL", dialCode: "+972", flag: "🇮🇱" },
        { name: "Jamaica", code: "JM", dialCode: "+1-876", flag: "🇯🇲" },
        { name: "Jordan", code: "JO", dialCode: "+962", flag: "🇯🇴" },
        { name: "Kazakhstan", code: "KZ", dialCode: "+7", flag: "🇰🇿" },
        { name: "Kuwait", code: "KW", dialCode: "+965", flag: "🇰🇼" },
        { name: "Latvia", code: "LV", dialCode: "+371", flag: "🇱🇻" },
        { name: "Lebanon", code: "LB", dialCode: "+961", flag: "🇱🇧" },
        { name: "Lithuania", code: "LT", dialCode: "+370", flag: "🇱🇹" },
        { name: "Luxembourg", code: "LU", dialCode: "+352", flag: "🇱🇺" },
        { name: "Morocco", code: "MA", dialCode: "+212", flag: "🇲🇦" },
        { name: "Norway", code: "NO", dialCode: "+47", flag: "🇳🇴" },
        { name: "Oman", code: "OM", dialCode: "+968", flag: "🇴🇲" },
        { name: "Panama", code: "PA", dialCode: "+507", flag: "🇵🇦" },
        { name: "Peru", code: "PE", dialCode: "+51", flag: "🇵🇪" },
        { name: "Portugal", code: "PT", dialCode: "+351", flag: "🇵🇹" },
        { name: "Romania", code: "RO", dialCode: "+40", flag: "🇷🇴" },
        { name: "Serbia", code: "RS", dialCode: "+381", flag: "🇷🇸" },
        { name: "Slovakia", code: "SK", dialCode: "+421", flag: "🇸🇰" },
        { name: "Slovenia", code: "SI", dialCode: "+386", flag: "🇸🇮" },
        { name: "Sri Lanka", code: "LK", dialCode: "+94", flag: "🇱🇰" },
        { name: "Taiwan", code: "TW", dialCode: "+886", flag: "🇹🇼" },
        { name: "Tanzania", code: "TZ", dialCode: "+255", flag: "🇹🇿" },
        { name: "Tunisia", code: "TN", dialCode: "+216", flag: "🇹🇳" },
        { name: "Ukraine", code: "UA", dialCode: "+380", flag: "🇺🇦" },
        { name: "Uruguay", code: "UY", dialCode: "+598", flag: "🇺🇾" },
        { name: "Venezuela", code: "VE", dialCode: "+58", flag: "🇻🇪" },
        { name: "Bahamas", code: "BS", dialCode: "+1-242", flag: "🇧🇸" },
        { name: "Barbados", code: "BB", dialCode: "+1-246", flag: "🇧🇧" },
        { name: "Belize", code: "BZ", dialCode: "+501", flag: "🇧🇿" },
        { name: "Benin", code: "BJ", dialCode: "+229", flag: "🇧🇯" },
        { name: "Botswana", code: "BW", dialCode: "+267", flag: "🇧🇼" },
        { name: "Burkina Faso", code: "BF", dialCode: "+226", flag: "🇧🇫" },
        { name: "Burundi", code: "BI", dialCode: "+257", flag: "🇧🇮" },
        { name: "Cambodia", code: "KH", dialCode: "+855", flag: "🇰🇭" },
        { name: "Cameroon", code: "CM", dialCode: "+237", flag: "🇨🇲" },
        { name: "Chad", code: "TD", dialCode: "+235", flag: "🇹🇩" },
        { name: "Congo", code: "CG", dialCode: "+242", flag: "🇨🇬" },
        { name: "Djibouti", code: "DJ", dialCode: "+253", flag: "🇩🇯" },
        { name: "Dominica", code: "DM", dialCode: "+1-767", flag: "🇩🇲" },
        { name: "El Salvador", code: "SV", dialCode: "+503", flag: "🇸🇻" },
        { name: "Eritrea", code: "ER", dialCode: "+291", flag: "🇪🇷" },
        { name: "Fiji", code: "FJ", dialCode: "+679", flag: "🇫🇯" },
        { name: "Gabon", code: "GA", dialCode: "+241", flag: "🇬🇦" },
        { name: "Gambia", code: "GM", dialCode: "+220", flag: "🇬🇲" },
        { name: "Guinea", code: "GN", dialCode: "+224", flag: "🇬🇳" },
        { name: "Guyana", code: "GY", dialCode: "+592", flag: "🇬🇾" },
        { name: "Haiti", code: "HT", dialCode: "+509", flag: "🇭🇹" },
        { name: "Honduras", code: "HN", dialCode: "+504", flag: "🇭🇳" },
        { name: "Laos", code: "LA", dialCode: "+856", flag: "🇱🇦" },
        { name: "Libya", code: "LY", dialCode: "+218", flag: "🇱🇾" },
        { name: "Madagascar", code: "MG", dialCode: "+261", flag: "🇲🇬" },
        { name: "Maldives", code: "MV", dialCode: "+960", flag: "🇲🇻" },
        { name: "Mali", code: "ML", dialCode: "+223", flag: "🇲🇱" },
        { name: "Malta", code: "MT", dialCode: "+356", flag: "🇲🇹" },
        { name: "Mauritius", code: "MU", dialCode: "+230", flag: "🇲🇺" },
        { name: "Moldova", code: "MD", dialCode: "+373", flag: "🇲🇩" },
        { name: "Mongolia", code: "MN", dialCode: "+976", flag: "🇲🇳" },
        { name: "Montenegro", code: "ME", dialCode: "+382", flag: "🇲🇪" },
        { name: "Mozambique", code: "MZ", dialCode: "+258", flag: "🇲🇿" },
        { name: "Namibia", code: "NA", dialCode: "+264", flag: "🇳🇦" },
        { name: "Nicaragua", code: "NI", dialCode: "+505", flag: "🇳🇮" },
        { name: "Niger", code: "NE", dialCode: "+227", flag: "🇳🇪" },
        { name: "North Macedonia", code: "MK", dialCode: "+389", flag: "🇲🇰" },
        { name: "Paraguay", code: "PY", dialCode: "+595", flag: "🇵🇾" },
        { name: "Rwanda", code: "RW", dialCode: "+250", flag: "🇷🇼" },
        { name: "Senegal", code: "SN", dialCode: "+221", flag: "🇸🇳" },
        { name: "Somalia", code: "SO", dialCode: "+252", flag: "🇸🇴" },
        { name: "Sudan", code: "SD", dialCode: "+249", flag: "🇸🇩" },
        { name: "Syria", code: "SY", dialCode: "+963", flag: "🇸🇾" },
        { name: "Tajikistan", code: "TJ", dialCode: "+992", flag: "🇹🇯" },
        { name: "Togo", code: "TG", dialCode: "+228", flag: "🇹🇬" },
        { name: "Uganda", code: "UG", dialCode: "+256", flag: "🇺🇬" },
        { name: "Uzbekistan", code: "UZ", dialCode: "+998", flag: "🇺🇿" },
        { name: "Yemen", code: "YE", dialCode: "+967", flag: "🇾🇪" },
        { name: "Zambia", code: "ZM", dialCode: "+260", flag: "🇿🇲" },
        { name: "Antigua and Barbuda", code: "AG", dialCode: "+1-268", flag: "🇦🇬" },
        { name: "Brunei", code: "BN", dialCode: "+673", flag: "🇧🇳" },
        { name: "Cabo Verde", code: "CV", dialCode: "+238", flag: "🇨🇻" },
        { name: "Central African Republic", code: "CF", dialCode: "+236", flag: "🇨🇫" },
        { name: "Comoros", code: "KM", dialCode: "+269", flag: "🇰🇲" },
        { name: "Congo (DRC)", code: "CD", dialCode: "+243", flag: "🇨🇩" },
        { name: "Equatorial Guinea", code: "GQ", dialCode: "+240", flag: "🇬🇶" },
        { name: "Eswatini", code: "SZ", dialCode: "+268", flag: "🇸🇿" },
        { name: "Grenada", code: "GD", dialCode: "+1-473", flag: "🇬🇩" },
        { name: "Guinea-Bissau", code: "GW", dialCode: "+245", flag: "🇬🇼" },
        { name: "Kiribati", code: "KI", dialCode: "+686", flag: "🇰🇮" },
        { name: "Kyrgyzstan", code: "KG", dialCode: "+996", flag: "🇰🇬" },
        { name: "Lesotho", code: "LS", dialCode: "+266", flag: "🇱🇸" },
        { name: "Liberia", code: "LR", dialCode: "+231", flag: "🇱🇷" },
        { name: "Liechtenstein", code: "LI", dialCode: "+423", flag: "🇱🇮" },
        { name: "Malawi", code: "MW", dialCode: "+265", flag: "🇲🇼" },
        { name: "Marshall Islands", code: "MH", dialCode: "+692", flag: "🇲🇭" },
        { name: "Mauritania", code: "MR", dialCode: "+222", flag: "🇲🇷" },
        { name: "Micronesia", code: "FM", dialCode: "+691", flag: "🇫🇲" },
        { name: "Monaco", code: "MC", dialCode: "+377", flag: "🇲🇨" },
        { name: "Myanmar", code: "MM", dialCode: "+95", flag: "🇲🇲" },
        { name: "Nauru", code: "NR", dialCode: "+674", flag: "🇳🇷" },
        { name: "Palau", code: "PW", dialCode: "+680", flag: "🇵🇼" },
        { name: "Saint Kitts and Nevis", code: "KN", dialCode: "+1-869", flag: "🇰🇳" },
        { name: "Saint Lucia", code: "LC", dialCode: "+1-758", flag: "🇱🇨" },
        { name: "Saint Vincent and the Grenadines", code: "VC", dialCode: "+1-784", flag: "🇻🇨" },
        { name: "Samoa", code: "WS", dialCode: "+685", flag: "🇼🇸" },
        { name: "San Marino", code: "SM", dialCode: "+378", flag: "🇸🇲" },
        { name: "Sao Tome and Principe", code: "ST", dialCode: "+239", flag: "🇸🇹" },
        { name: "Seychelles", code: "SC", dialCode: "+248", flag: "🇸🇨" },
        { name: "Sierra Leone", code: "SL", dialCode: "+232", flag: "🇸🇱" },
        { name: "Solomon Islands", code: "SB", dialCode: "+677", flag: "🇸🇧" },
        { name: "Suriname", code: "SR", dialCode: "+597", flag: "🇸🇷" },
        { name: "Timor-Leste", code: "TL", dialCode: "+670", flag: "🇹🇱" },
        { name: "Tonga", code: "TO", dialCode: "+676", flag: "🇹🇴" },
        { name: "Trinidad and Tobago", code: "TT", dialCode: "+1-868", flag: "🇹🇹" },
        { name: "Turkmenistan", code: "TM", dialCode: "+993", flag: "🇹🇲" },
        { name: "Tuvalu", code: "TV", dialCode: "+688", flag: "🇹🇻" },
        { name: "Vanuatu", code: "VU", dialCode: "+678", flag: "🇻🇺" },
        { name: "Vatican City", code: "VA", dialCode: "+39", flag: "🇻🇦" },
        { name: "Bhutan", code: "BT", dialCode: "+975", flag: "🇧🇹" },
        { name: "Cook Islands", code: "CK", dialCode: "+682", flag: "🇨🇰" },
        { name: "Falkland Islands", code: "FK", dialCode: "+500", flag: "🇫🇰" },
        { name: "Faroe Islands", code: "FO", dialCode: "+298", flag: "🇫🇴" },
        { name: "French Guiana", code: "GF", dialCode: "+594", flag: "🇬🇫" },
        { name: "Greenland", code: "GL", dialCode: "+299", flag: "🇬🇱" },
        { name: "Guadeloupe", code: "GP", dialCode: "+590", flag: "🇬🇵" },
        { name: "Guam", code: "GU", dialCode: "+1-671", flag: "🇬🇺" },
        { name: "Martinique", code: "MQ", dialCode: "+596", flag: "🇲🇶" },
        { name: "Mayotte", code: "YT", dialCode: "+262", flag: "🇾🇹" },
        { name: "New Caledonia", code: "NC", dialCode: "+687", flag: "🇳🇨" },
        { name: "Niue", code: "NU", dialCode: "+683", flag: "🇳🇺" },
        { name: "Norfolk Island", code: "NF", dialCode: "+672", flag: "🇳🇫" },
        { name: "Northern Mariana Islands", code: "MP", dialCode: "+1-670", flag: "🇲🇵" },
        { name: "Pitcairn", code: "PN", dialCode: "+64", flag: "🇵🇳" },
        { name: "Puerto Rico", code: "PR", dialCode: "+1-787", flag: "🇵🇷" },
        { name: "Réunion", code: "RE", dialCode: "+262", flag: "🇷🇪" },
        { name: "Saint Barthélemy", code: "BL", dialCode: "+590", flag: "🇧🇱" },
        { name: "Saint Helena", code: "SH", dialCode: "+290", flag: "🇸🇭" },
        { name: "Saint Martin", code: "MF", dialCode: "+590", flag: "🇲🇫" },
        { name: "Saint Pierre and Miquelon", code: "PM", dialCode: "+508", flag: "🇵🇲" },
        { name: "Tokelau", code: "TK", dialCode: "+690", flag: "🇹🇰" },
        { name: "Wallis and Futuna", code: "WF", dialCode: "+681", flag: "🇼🇫" },
        { name: "Palestine", code: "PS", dialCode: "+970", flag: "🇵🇸" },
        { name: "Kosovo", code: "XK", dialCode: "+383", flag: "🇽🇰" }
    ];

    const { t } = useTranslation();
    const nameInputRef = useRef<TextInput>(null);
    const phoneInputRef = useRef<TextInput>(null);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSecure, setIsSecure] = useState(true);
    const [emailExists, setEmailExists] = useState(false);
    const [phoneExists, setPhoneExists] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === "IN") || COUNTRIES[0]);
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [legalModalVisible, setLegalModalVisible] = useState(false);

    const filteredCountries = COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery)
    );

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
        ]).start();
    }, []);

    const [toastConfig, setToastConfig] = useState({ visible: false, message: '', description: '', type: 'success' });
    const toastAnimY = useRef(new Animated.Value(-100)).current;

    const showToast = ({ message, description, type = 'success' }: { message: string, description: string, type: 'success' | 'danger' | 'warning' }) => {
        setToastConfig({ visible: true, message, description, type });
        Animated.sequence([
            Animated.timing(toastAnimY, { toValue: insets.top + 10, duration: 300, useNativeDriver: true }),
            Animated.delay(3000),
            Animated.timing(toastAnimY, { toValue: -100, duration: 300, useNativeDriver: true })
        ]).start(() => setToastConfig(prev => ({ ...prev, visible: false })));
    };

    const getToastColor = () => {
        if (toastConfig.type === 'danger') return 'bg-red-500 border-red-700';
        if (toastConfig.type === 'warning') return 'bg-brand border-orange-700';
        return 'bg-green-500 border-green-700';
    };

    const handleSignup = async () => {
        if (!name.trim()) { nameInputRef.current?.focus(); return showToast({ message: t('alert'), description: t('please_enter_your_name'), type: "warning" }); }
        if (!phoneNumber) { phoneInputRef.current?.focus(); return showToast({ message: t('alert'), description: t('phone_number'), type: "warning" }); }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { emailInputRef.current?.focus(); return showToast({ message: t('alert'), description: t('please_enter_valid_email'), type: 'warning' }); }
        if (!password) { passwordInputRef.current?.focus(); return showToast({ message: t('alert'), description: t('please_enter_your_password'), type: 'warning' }); }
        if (!isChecked) return showToast({ message: t('alert'), description: 'Please accept terms', type: 'warning' });

        setLoading(true);
        try {
            const fullPhone = `${selectedCountry.dialCode}${phoneNumber}`;
            const phoneData = await apiFetch('/check-phone', { method: 'POST', body: JSON.stringify({ phone: fullPhone }) }).catch(() => ({ status: false }));
            if (phoneData?.exists || phoneData?.status === false) {
                setPhoneExists(true); phoneInputRef.current?.focus();
                showToast({ message: 'Alert', description: 'Phone number registered.', type: 'danger' });
                setLoading(false); return;
            }
            const emailData = await apiFetch('/check-email', { method: 'POST', body: JSON.stringify({ email }) }).catch(() => ({ status: false }));
            if (emailData?.exists || emailData?.status === false) {
                setEmailExists(true); emailInputRef.current?.focus();
                showToast({ message: 'Alert', description: 'Email registered.', type: 'danger' });
                setLoading(false); return;
            }

            const otpData = await apiFetch('/send-email-otp', {
                method: 'POST',
                body: JSON.stringify({ email, type: 'signup', app_source: 'mudra' })
            });

            if (otpData.success) {
                showToast({ message: t('success'), description: t('otp_sent_to_email'), type: 'success' });
                setTimeout(() => {
                    router.push({
                        pathname: '/(auth)/otp',
                        params: { email, flow: 'signup', signupData: JSON.stringify({ name, phone: fullPhone, email, password }) }
                    });
                }, 1000);
            }
        } catch (error) { showToast({ message: 'Error', description: 'Network error.', type: 'danger' }); } finally { setLoading(false); }
    };

    const hideHeaderScript = `
      setTimeout(function() {
          let headers = document.getElementsByTagName('header');
          for(let i=0; i<headers.length; i++) { headers[i].style.display = 'none'; }
          let footers = document.getElementsByTagName('footer');
          for(let i=0; i<footers.length; i++) { footers[i].style.display = 'none'; }
      }, 100);
      true;
  `;
    const openLegalWebView = (url: string, title: string) => {
        setLegalUrl(url);
        setLegalTitle(title);
        setIsLegalLoading(true);
        setLegalModalVisible(true);
    };



    return (
        <SafeAreaView style={{ flex: 1 }} className="bg-sand" edges={['bottom', 'top']}>
            <Animated.View className={`absolute w-[90%] self-center p-4 rounded-xl border z-50 shadow-lg ${getToastColor()}`} style={{ transform: [{ translateY: toastAnimY }] }}>
                <Text className="text-white font-bold text-base">{toastConfig.message}</Text>
                {toastConfig.description && <Text className="text-white font-medium text-sm mt-1">{toastConfig.description}</Text>}
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Animated.View className="w-full px-6 py-5 max-w-lg self-center" style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                    <View className="mb-8">
                        <Text className="text-ink text-3xl font-bold mb-2">{t('join')}</Text>
                        <Text className="text-muted text-base">{t('start_experience')}</Text>
                    </View>

                    <View className="mb-5">
                        <Text className="text-ink text-sm font-medium mb-2">{t('name')}</Text>
                        <TextInput ref={nameInputRef} className="w-full h-14 bg-surface text-ink border border-ink/10 rounded-2xl px-4 text-base" placeholder={t('enter_your_name')} placeholderTextColor="#888" value={name} onChangeText={setName} />
                    </View>

                    <View className="mb-5">
                        <Text className="text-ink text-sm font-medium mb-2">{t('phone_number')}</Text>
                        <View className={`flex-row items-center w-full h-14 bg-surface border rounded-2xl px-4 ${phoneExists ? 'border-red-500' : 'border-ink/10'}`}>
                            <TouchableOpacity className="flex-row items-center pr-3 border-r border-ink/20 mr-3" onPress={() => setIsCountryModalVisible(true)}>
                                {Platform.OS === 'android' && <Text className="text-base mr-1">{selectedCountry.flag}</Text>}
                                <Text className="text-ink text-base">{selectedCountry.dialCode}</Text>
                            </TouchableOpacity>
                            <TextInput className="flex-1 text-ink text-base" placeholder="0000000000" placeholderTextColor="#888" value={phoneNumber} keyboardType="phone-pad" onChangeText={v => setPhoneNumber(v.replace(/[^0-9]/g, ''))} />
                        </View>
                    </View>

                    <View className="mb-5">
                        <Text className="text-ink text-sm font-medium mb-2">{t('email_address')}</Text>
                        <TextInput ref={emailInputRef} className={`w-full h-14 bg-surface text-ink border rounded-2xl px-4 text-base ${emailExists ? 'border-red-500' : 'border-ink/10'}`} placeholder="hello@example.com" placeholderTextColor="#888" value={email} keyboardType="email-address" onChangeText={setEmail} />
                    </View>

                    <View className="mb-5">
                        <Text className="text-ink text-sm font-medium mb-2">{t('password')}</Text>
                        <View className="relative justify-center">
                            <TextInput ref={passwordInputRef} className="w-full h-14 bg-surface text-ink border border-ink/10 rounded-2xl px-4 text-base pr-12" placeholder={t('password')} placeholderTextColor="#888" secureTextEntry={isSecure} value={password} onChangeText={setPassword} />
                            <TouchableOpacity onPress={() => setIsSecure(!isSecure)} className="absolute right-4"><MaterialIcons name={isSecure ? 'visibility-off' : 'visibility'} size={24} color="#888" /></TouchableOpacity>
                        </View>
                    </View>

                    <View className="flex-row items-center mb-8 pr-4">
                        <TouchableOpacity onPress={() => setIsChecked(!isChecked)} className={`w-6 h-6 border rounded-lg mr-3 items-center justify-center ${isChecked ? 'bg-brand border-brand' : 'bg-surface border-ink/20'}`}>
                            {isChecked && <MaterialIcons name="check" size={16} color="white" />}
                        </TouchableOpacity>
                        <View className="flex-row flex-wrap flex-1">
                            <Text className="text-muted text-sm">{t('i_agree_to_mudra')} </Text>
                            <TouchableOpacity onPress={() => openLegalWebView("https://7pranayama.com/terms", 'Terms & Conditions')}>
                                <Text className="text-brand text-sm font-medium underline" numberOfLines={1}>
                                    {t('terms_conditions')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Button label={t('sign_up')} onPress={handleSignup} loading={loading} disabled={loading} />

                    <View className="flex-row justify-center mt-8">
                        <Text className="text-muted text-base">{t('already_have_account')} </Text>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}><Text className="text-brand font-bold text-base ml-1" numberOfLines={1}>{t('login')}</Text></TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>

            <Modal
                visible={isCountryModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setIsCountryModalVisible(false);
                    setSearchQuery('');
                }}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View className="bg-surface rounded-t-[28px] h-[85%] px-5 pt-5 pb-8">

                        {/* Modal Header */}
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold text-ink">{t('select_country') || 'Select Country'}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsCountryModalVisible(false);
                                    setSearchQuery('');
                                }}
                                className="p-2 bg-sand rounded-full"
                            >
                                <MaterialIcons name="close" size={24} color="#FF9500" />
                            </TouchableOpacity>
                        </View>

                        {/* 🔥 SEARCH BAR */}
                        <View className="mb-4 flex-row items-center bg-sand rounded-2xl px-4 h-12 border border-ink/10">
                            <MaterialIcons name="search" size={20} color="#888" />
                            <TextInput
                                className="flex-1 ml-2 text-ink text-base h-full"
                                placeholder={t('search_number') || "Search country or code..."}
                                placeholderTextColor="#888"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                            {/* Clear Search Button */}
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                                    <MaterialIcons name="cancel" size={20} color="#888" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Country List */}
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {filteredCountries.length > 0 ? (
                                filteredCountries.map((country, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                            setSelectedCountry(country);
                                            setIsCountryModalVisible(false);
                                            setSearchQuery(''); // Select hone par reset
                                        }}
                                        className="flex-row items-center justify-between py-4 border-b border-ink/5"
                                    >
                                        <View className="flex-row items-center">
                                            <Text className="text-2xl mr-4">{country.flag}</Text>
                                            <Text className="text-base text-ink font-medium">{country.name}</Text>
                                        </View>
                                        <Text className="text-base text-muted">{country.dialCode}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                /* Agar search me kuch nahi mila */
                                <View className="items-center justify-center py-10">
                                    <Text className="text-muted text-base">{t('no_results_found') || "No country found"}</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={legalModalVisible} animationType="slide" onRequestClose={() => setLegalModalVisible(false)}>
                <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'bottom']}>
                    <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                        <TouchableOpacity onPress={() => setLegalModalVisible(false)} className="p-1">
                            <MaterialIcons name="close" size={28} color="#FF9500" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-black dark:text-white">{legalTitle}</Text>
                        <View className="w-7" />
                    </View>

                    <View className="flex-1 bg-white dark:bg-zinc-950">
                        {isLegalLoading && (
                            <View className="absolute inset-0 items-center justify-center z-10 bg-white dark:bg-zinc-950">
                                <ActivityIndicator size="large" color="#FF9500" />
                            </View>
                        )}
                        <WebView
                            source={{ uri: legalUrl }}
                            onLoadEnd={() => setIsLegalLoading(false)}
                            injectedJavaScript={hideHeaderScript}
                            javaScriptEnabled={true}
                            showsVerticalScrollIndicator={false}
                            className="flex-1"
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView >
    );
}