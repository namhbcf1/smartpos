# 📱 Hướng Dẫn Build App Android - TPCOMHB Smart POS

## 🎯 Yêu Cầu Hệ Thống

### 1. **Java Development Kit (JDK)**
- Tải JDK 17: https://adoptium.net/temurin/releases/?version=17
- Sau khi cài, kiểm tra:
  ```bash
  java -version
  ```
  Phải hiển thị: `java version "17.x.x"`

### 2. **Android Studio**
- Tải Android Studio: https://developer.android.com/studio
- Cài đặt với các component:
  - ✅ Android SDK
  - ✅ Android SDK Platform 34
  - ✅ Android Build Tools
  - ✅ Android Emulator (tùy chọn - để test)

### 3. **Thiết lập Environment Variables**

#### Windows:
1. Mở **System Environment Variables** (Search "env" trong Start menu)
2. Thêm/cập nhật các biến sau:

```
ANDROID_HOME = C:\Users\<YourUsername>\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
```

3. Thêm vào PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%JAVA_HOME%\bin
```

4. Kiểm tra:
```bash
echo %ANDROID_HOME%
echo %JAVA_HOME%
adb version
```

---

## 🔧 Chuẩn Bị Project

### 1. Cài đặt dependencies
```bash
cd frontend
npm install
```

### 2. Build và sync với Android
```bash
npm run android:sync
```

---

## 📦 Build APK/AAB File

### Phương án 1: Build qua Android Studio (Khuyến nghị cho lần đầu)

1. **Mở Android Studio:**
```bash
npm run android:open
```

2. **Đợi Gradle sync xong** (lần đầu mất 5-10 phút)

3. **Build APK Debug:**
   - Menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Đợi build xong
   - Click "locate" để mở thư mục chứa APK
   - File APK tại: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Build APK Release:**
   - Menu: **Build** → **Generate Signed Bundle / APK**
   - Chọn **APK**
   - Create new key store (lần đầu tiên)
   - Điền thông tin:
     ```
     Key store path: C:/keystore/tpcomhb-smartpos.jks
     Password: <password-của-bạn>
     Alias: tpcomhb-key
     Alias password: <password-của-bạn>
     Validity (years): 25
     ```
   - Next → Chọn **release** → **Finish**
   - APK tại: `android/app/build/outputs/apk/release/app-release.apk`

---

### Phương án 2: Build qua Command Line

#### Build APK Debug (không cần key)
```bash
cd frontend/android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Build APK Release (có sign - dành cho production)

1. **Tạo keystore (chỉ cần 1 lần):**
```bash
keytool -genkey -v -keystore tpcomhb-smartpos.jks -alias tpcomhb-key -keyalg RSA -keysize 2048 -validity 10000
```

2. **Tạo file `android/key.properties`:**
```properties
storePassword=<your-password>
keyPassword=<your-password>
keyAlias=tpcomhb-key
storeFile=C:/keystore/tpcomhb-smartpos.jks
```

3. **Cập nhật `android/app/build.gradle`:**
Thêm vào trước `android {`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Trong `android { ... }`, thêm:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

4. **Build release APK:**
```bash
cd frontend/android
./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📲 Cài Đặt APK Lên Điện Thoại

### Phương pháp 1: USB Cable

1. **Bật Developer Options trên Android:**
   - Vào Settings → About Phone
   - Tap "Build Number" 7 lần
   - Quay lại Settings → Developer Options
   - Bật "USB Debugging"

2. **Kết nối điện thoại qua USB**

3. **Cài APK:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Phương pháp 2: File Transfer

1. Copy file APK vào điện thoại (qua USB hoặc Google Drive)
2. Mở File Manager trên điện thoại
3. Tap vào file APK
4. Cho phép "Install from Unknown Sources" nếu được hỏi
5. Tap **Install**

---

## 🚀 Test & Run

### Run trên Emulator
```bash
npm run android:run
```

### Run trên thiết bị thật (qua USB)
```bash
adb devices  # Kiểm tra thiết bị đã kết nối
npm run android:run
```

---

## 📊 Thông Tin App

- **App Name:** TPCOMHB Smart POS
- **Package ID:** `vn.tpcomhb.smartpos`
- **Version:** Xem trong `android/app/build.gradle`
- **Min SDK:** 22 (Android 5.1+)
- **Target SDK:** 34 (Android 14)

---

## 🔄 Update App (Sau khi thay đổi code web)

```bash
cd frontend
npm run android:sync  # Build web + sync với Android
npm run android:open  # Mở Android Studio
# Rồi build lại APK như hướng dẫn trên
```

---

## 📦 Publish Lên Google Play Store

### Yêu cầu:
1. **Google Play Developer Account** ($25 một lần)
   - Đăng ký tại: https://play.google.com/console/signup

2. **Build AAB file** (thay vì APK):
```bash
cd frontend/android
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

3. **Upload lên Google Play Console:**
   - Tạo app mới
   - Upload file AAB
   - Điền thông tin app (screenshots, description, v.v.)
   - Submit for review

---

## ⚠️ Lưu Ý Quan Trọng

### 🔐 Bảo Mật Keystore
- **QUAN TRỌNG:** Lưu file keystore (`tpcomhb-smartpos.jks`) và password cẩn thận!
- Nếu mất keystore → Không thể update app trên Play Store
- Backup keystore vào nơi an toàn (Google Drive, USB, v.v.)

### 📝 Permissions
App đã có các permissions cơ bản:
- INTERNET
- CAMERA (để scan QR/barcode)
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE

Để thêm permissions, edit: `android/app/src/main/AndroidManifest.xml`

### 🎨 Thay Đổi Icon
1. Tạo icons với tool: https://icon.kitchen/
2. Download Android icon pack
3. Copy vào: `android/app/src/main/res/`
   - `mipmap-hdpi/ic_launcher.png`
   - `mipmap-mdpi/ic_launcher.png`
   - `mipmap-xhdpi/ic_launcher.png`
   - `mipmap-xxhdpi/ic_launcher.png`
   - `mipmap-xxxhdpi/ic_launcher.png`

---

## 🐛 Troubleshooting

### Lỗi: "JAVA_HOME not set"
```bash
# Windows
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
```

### Lỗi: "SDK location not found"
Tạo file `android/local.properties`:
```properties
sdk.dir=C\:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk
```

### Lỗi: "Gradle sync failed"
```bash
cd android
./gradlew clean
./gradlew build
```

### App crashes khi mở
- Check logs:
```bash
adb logcat | grep TPCOMHB
```

---

## 📞 Hỗ Trợ

- **Android Studio Docs:** https://developer.android.com/studio
- **Capacitor Docs:** https://capacitorjs.com/docs/android
- **Gradle Docs:** https://docs.gradle.org/

---

## ✅ Checklist Trước Khi Release

- [ ] Test app trên nhiều thiết bị Android
- [ ] Kiểm tra tất cả tính năng hoạt động
- [ ] Test offline mode
- [ ] Kiểm tra permissions
- [ ] Update version number trong `build.gradle`
- [ ] Build signed release APK/AAB
- [ ] Backup keystore file
- [ ] Tạo screenshots cho Play Store
- [ ] Viết description và policy
- [ ] Submit lên Google Play Store

---

🎉 **Chúc mừng! Bạn đã biết cách build app Android cho TPCOMHB Smart POS!**
