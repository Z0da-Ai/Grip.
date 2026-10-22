# Keep Room entities and budget models (accessed by reflection / Gson).
-keep class com.grip.app.data.local.entity.** { *; }
-keep class com.grip.app.budget.** { *; }
-dontwarn com.google.gson.**
# Keep line numbers so Play Console crash reports are readable.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
