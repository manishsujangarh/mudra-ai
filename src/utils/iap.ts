import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 1. Yahan apni Play Console aur App Store ki Product ID dalein
export const ONE_TIME_SKU = Platform.select({
    ios: 'com.mudralifetime',
    android: 'com.mudralifetime',
    default: 'com.mudralifetime',
}) as string;

type ExpoIapModule = typeof import('expo-iap');

let cachedIapModule: ExpoIapModule | null = null;

export const isIapRuntimeAvailable = () => {
    if (Platform.OS === 'web') return false;
    return Constants.appOwnership !== 'expo';
};

const getIapModule = async (): Promise<ExpoIapModule | null> => {
    if (!isIapRuntimeAvailable()) return null;
    if (cachedIapModule) return cachedIapModule;

    try {
        cachedIapModule = await import('expo-iap');
        return cachedIapModule;
    } catch (error) {
        console.warn('Expo IAP native module is unavailable in this runtime.', error);
        return null;
    }
};

const hasOwnedSku = (sku: string, purchase: { productId: string; ids?: string[] | null }) => {
    return purchase.productId === sku || purchase.ids?.includes(sku) === true;
};

export type PremiumOwnershipStatus = {
    hasPremium: boolean;
    latestReceipt?: string | null;
};

// Check if user already bought the lifetime premium
export const queryPremiumOwnershipStatus = async (): Promise<PremiumOwnershipStatus | null> => {
    const iap = await getIapModule();
    if (!iap) return null;

    await iap.initConnection();
    try {
        const purchases = await iap.getAvailablePurchases();

        const lifetimePurchase = purchases.find((purchase: any) => hasOwnedSku(ONE_TIME_SKU, purchase));

        if (lifetimePurchase) {
            let receipt = '';
            if (Platform.OS === 'ios') receipt = lifetimePurchase?.transactionReceipt || '';
            else receipt = lifetimePurchase?.purchaseToken || lifetimePurchase?.transactionReceipt || '';

            return {
                hasPremium: true,
                latestReceipt: receipt,
            };
        }

        return { hasPremium: false, latestReceipt: null };
    } finally {
        try {
            await iap.endConnection();
        } catch {
            // no-op
        }
    }
};

export const queryPremiumOwnership = async (): Promise<boolean | null> => {
    const ownershipStatus = await queryPremiumOwnershipStatus();
    return ownershipStatus === null ? null : ownershipStatus.hasPremium;
};

const extractDisplayPrice = (product: any): string | null => {
    const directFields = [
        product?.localizedPrice,
        product?.displayPrice,
        product?.formattedPrice,
        product?.price,
    ];

    for (const value of directFields) {
        if (typeof value === 'string' && value.trim().length > 0) return value;
    }

    const oneTimeV3 = product?.oneTimePurchaseOfferDetailsAndroid?.[0]?.formattedPrice;
    if (typeof oneTimeV3 === 'string' && oneTimeV3.trim().length > 0) return oneTimeV3;

    const oneTimeV2 = product?.oneTimePurchaseOfferDetails?.formattedPrice;
    if (typeof oneTimeV2 === 'string' && oneTimeV2.trim().length > 0) return oneTimeV2;

    return null;
};

const extractTitle = (product: any): string | null => {
    const title = typeof product?.title === 'string' ? product.title.trim() : '';
    if (!title) return null;

    const bracketIndex = title.indexOf('(');
    if (bracketIndex > 0) {
        return title.slice(0, bracketIndex).trim();
    }
    return title;
};

export type PremiumCatalogItem = {
    productId: string;
    title: string | null;
    displayPrice: string | null;
};

export type PremiumCatalogResult = {
    unavailable?: boolean;
    item?: PremiumCatalogItem | null;
};

// Fetch the single lifetime product from the store
export const fetchPremiumCatalogFromStore = async (): Promise<PremiumCatalogResult> => {
    const iap = await getIapModule();
    if (!iap) return { unavailable: true };

    await iap.initConnection();
    try {
        const products = await iap.fetchProducts({
            skus: [ONE_TIME_SKU],
            type: 'in-app', // Strictly 'in-app' for one-time purchases
        });

        if (Array.isArray(products) && products.length > 0) {
            const product = products[0];
            return {
                item: {
                    productId: product?.id || product?.productId || ONE_TIME_SKU,
                    title: extractTitle(product),
                    displayPrice: extractDisplayPrice(product),
                }
            };
        }

        return { item: null };
    } finally {
        try {
            await iap.endConnection();
        } catch {
            // no-op
        }
    }
};

// Buy the lifetime premium
export const purchasePremiumLifetime = async (): Promise<{ success: boolean; cancelled?: boolean; unavailable?: boolean; receiptToken?: string }> => {
    const iap = await getIapModule();
    if (!iap) return { success: false, unavailable: true };

    try {
        await iap.initConnection();
        await iap.fetchProducts({
            skus: [ONE_TIME_SKU],
            type: 'in-app',
        });

        const purchaseResponse = await iap.requestPurchase({
            request: {
                apple: { sku: ONE_TIME_SKU },
                google: { skus: [ONE_TIME_SKU] },
            },
            type: 'in-app',
        });

        const purchasesFromResponse = Array.isArray(purchaseResponse) ? purchaseResponse : purchaseResponse ? [purchaseResponse] : [];
        let matchedPurchase = purchasesFromResponse.find((purchase) => hasOwnedSku(ONE_TIME_SKU, purchase));

        if (!matchedPurchase) {
            const purchases = await iap.getAvailablePurchases();
            matchedPurchase = purchases.find((purchase) => hasOwnedSku(ONE_TIME_SKU, purchase));
        }

        if (!matchedPurchase) return { success: false };

        const purchaseData: any = matchedPurchase;
        let receiptToken = '';
        if (Platform.OS === 'ios') {
            receiptToken = purchaseData.transactionReceipt || '';
        } else if (Platform.OS === 'android') {
            receiptToken = purchaseData.purchaseToken || purchaseData.transactionReceipt || '';
        }

        await iap.finishTransaction({
            purchase: matchedPurchase,
            isConsumable: false, // Lifetime hai toh consumable nahi hoga
        });

        return { success: true, receiptToken };
    } catch (error: any) {
        const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
        if (message.includes('cancel')) {
            return { success: false, cancelled: true };
        }
        console.warn('Purchase flow failed:', error);
        return { success: false };
    } finally {
        try {
            await iap.endConnection();
        } catch {
            // no-op
        }
    }
};