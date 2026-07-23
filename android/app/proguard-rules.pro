# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# 1. R8 ki strict warnings aur errors ko ignore karne ke liye
-ignorewarnings

# 2. Missing Java annotation classes (javapoet / autovalue) ko bypass karne ke liye
-dontwarn javax.lang.model.**
-dontwarn autovalue.shaded.com.squareup.javapoet.**
-dontwarn com.google.auto.value.**

# 3. Amazon Appstore SDK ki stack map warnings hatane ke liye
-dontwarn com.amazon.device.**

# ---------------------------------------------------------
# EXTREME AI / MEDIAPIPE RULES FOR RELEASE BUILD
# ---------------------------------------------------------

# 1. Keep all MediaPipe code
-keep class com.google.mediapipe.** { *; }
-keepclassmembers class com.google.mediapipe.** { *; }

# 2. Keep AutoValue (Used heavily by MediaPipe Builders)
-keep class com.google.auto.value.** { *; }
-keep class * extends com.google.auto.value.AutoValue { *; }

# 3. Keep Protobuf (MediaPipe tasks use Protobuf for model definitions)
-keep class com.google.protobuf.** { *; }
-keep class * extends com.google.protobuf.GeneratedMessageLite { *; }

# 4. Keep Flogger (MediaPipe internal logging which crashes if missing)
-keep class com.google.flogger.** { *; }

# 5. Keep JNI Native Methods (C++ engine needs these)
-keepclasseswithmembernames class * {
    native <methods>;
}
-keepclassmembers class * {
    native <methods>;
}

# 6. Protect your custom module from being minified
-keep class expo.modules.mudracamera.** { *; }