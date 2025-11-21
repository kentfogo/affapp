buildscript {
    repositories {
        google() // Google's Maven repository
        mavenCentral()
    }
    dependencies {
        // ... other plugins like Gradle plugin for Android
        classpath 'com.google.gms:google-services:4.4.1' // Check for the latest version!
    }
}

// ... other settings like allprojects block
