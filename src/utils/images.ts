const localImages = require.context('../../assets/mudras', true, /\.(webp|jpg|jpeg|png)$/);

export function getMudraImage(imageUrl: string | null | undefined) {
  if (!imageUrl) return undefined;

  // 1. Agar image direct internet wali hai (https://...), toh wahi URL return kar do
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // 2. Agar local path hai ("../assets/mudras/adimudra.webp")
  // Toh isko require.context ke format ("./adimudra.webp") mein convert karo
  try {
    const formattedPath = imageUrl.replace('../assets/mudras/', './');
    return localImages(formattedPath);
  } catch (error) {
    console.warn(`Image load nahi hui: ${imageUrl}`);
    return undefined; // Fallback agar image folder mein na mile
  }
}