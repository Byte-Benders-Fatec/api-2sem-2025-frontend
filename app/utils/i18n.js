import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import pt from "./pt.json";
import es from "./es.json";
import react from "react";
import { Picker } from "react-native-web";

i18n.use(initReactI18next).init({
    compatibilityJSON: "v3",
    lng: "pt",
    resources: {
        en: en,
        pt: pt,
        es: es
    },
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
});

export default i18n;
