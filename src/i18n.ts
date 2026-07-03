import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { en, hi, } from './translations';

export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    // { code: 'mr', label: 'मराठी (Marathi)' },
    // { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    // { code: 'ta', label: 'தமிழ் (Tamil)' },
    // { code: 'te', label: 'తెలుగు (Telugu)' },
    // { code: 'ja', label: '日本語 (Japanese)' },
    // { code: 'zh', label: '简体中文 (Simplified Chinese)' },
];

const resources = {
    en: { translation: en },
    hi: { translation: hi },
    //     mr: { translation: mr },
    //     gu: { translation: gu },
    //     ta: { translation: ta },
    //     te: { translation: te },
    //     ja: { translation: ja },
    //     zh: { translation: zh },
};

i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v4',
        resources,
        lng: 'en',
        fallbackLng: 'en',

        interpolation: {
            escapeValue: false,
        },
    });

const loadSavedLanguage = async () => {
    try {
        const savedLang = await AsyncStorage.getItem('language');
        if (savedLang) {
            i18n.changeLanguage(savedLang);
        }
    } catch (error) {
        console.error(error);
    }
};

loadSavedLanguage();

export default i18n;
