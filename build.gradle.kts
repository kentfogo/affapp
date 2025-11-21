plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android' // If you're using Kotlin
    id 'com.google.gms.google-services' // Apply the Google Services plugin
}

android {
    // ... your android block settings (compileSdk, defaultConfig, etc.)
}

dependencies {
    // ... your other dependencies (e.g., androidx.appcompat, material, etc.)

    // Import the Firebase BoM
    // This ensures all Firebase library versions are compatible
    implementation platform('com.google.firebase:firebase-bom:32.7.0') // Check for the latest version!

    // Firebase Authentication for Kotlin
    implementation 'com.google.firebase:firebase-auth-ktx'

    // If you prefer Java without the Kotlin extensions, use this instead:
    // implementation 'com.google.firebase:firebase-auth'
}
