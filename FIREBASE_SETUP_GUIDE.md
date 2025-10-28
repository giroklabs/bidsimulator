# 경매일기 iOS 앱 - Firebase 설정 가이드

## 📋 전체 단계 개요

1. Firebase 콘솔에서 프로젝트 생성
2. iOS 앱 추가
3. GoogleService-Info.plist 다운로드
4. Firebase Authentication 설정
5. Firestore 데이터베이스 생성
6. Firebase Storage 설정
7. Xcode 프로젝트 설정
8. 코드 활성화

---

## 1️⃣ Firebase 콘솔 접속 및 프로젝트 생성

### 1.1 Firebase 콘솔 접속
```
https://console.firebase.google.com/
```

### 1.2 새 프로젝트 만들기
1. 상단의 **"프로젝트 추가"** 또는 **"Add project"** 클릭
2. 프로젝트 이름 입력: `경매일기` 또는 `BidCal`
3. **Google Analytics 설정** (선택사항)
   - 권장: 활성화 ✅
   - Analytics 계정: 기본 계정 선택
4. **프로젝트 만들기** 클릭
5. 생성 완료 대기 (1-2분)

---

## 2️⃣ iOS 앱 추가

### 2.1 iOS 앱 등록
1. 프로젝트 대시보드에서 **iOS 아이콘** 클릭 (🍎)
2. **iOS 번들 ID** 입력
   ```
   com.giroklabs.bidcal
   ```
3. **앱 별칭** (선택사항): `경매일기`
4. **App Store ID** (선택사항): 나중에 입력 가능
5. **앱 등록** 클릭

### 2.2 GoogleService-Info.plist 다운로드
1. **GoogleService-Info.plist** 파일 다운로드 버튼 클릭
2. 다운로드된 파일을 다음 경로로 이동:
   ```
   /Users/greego/Desktop/bid/bidcal/bidcal/GoogleService-Info.plist
   ```

### 2.3 Xcode에 파일 추가
1. Xcode에서 `bidcal.xcworkspace` 열기
2. 파일 탐색기에서 `GoogleService-Info.plist` 드래그 앤 드롭
3. **Target Membership**에서 `bidcal` 체크 확인 ✅
4. **Copy items if needed** 체크 ✅

---

## 3️⃣ Firebase Authentication 설정

### 3.1 Google Sign-In 설정
1. Firebase 콘솔 → **Authentication** → **Sign-in method** 탭
2. **Google** 클릭
3. **사용 설정** 토글 활성화
4. **이메일** 프로젝트 지원 이메일 선택
5. **저장** 클릭

### 3.2 Apple Sign-In 설정
1. **Sign in with Apple** 클릭
2. **사용 설정** 토글 활성화
3. **저장** 클릭

### 3.3 애플리케이션 제한사항 (선택사항)
1. **애플리케이션 제한사항** 탭
2. iOS 앱 선택
3. 필요시 승인된 도메인 추가

---

## 4️⃣ Firestore 데이터베이스 생성

### 4.1 Firestore 생성
1. Firebase 콘솔 → **Firestore Database**
2. **데이터베이스 만들기** 클릭
3. **프로덕션 모드** 또는 **테스트 모드** 선택
   - 처음에는 **테스트 모드** 권장 (30일 무료)
   - 나중에 보안 규칙 설정 가능
4. **위치 선택**: `asia-northeast3` (서울)
   - 또는 `asia-northeast1` (도쿄)
5. **사용 설정** 클릭

### 4.2 보안 규칙 설정
1. **규칙** 탭 클릭
2. 다음 규칙 복사 후 붙여넣기:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자별 데이터 - 자신의 데이터만 접근 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    //个体별 매물 데이터
    match /users/{userId}/properties/{propertyId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 사용자 설정
    match /users/{userId}/settings/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 지역 통계 - 모든 사용자 읽기 가능
    match /regionStatistics/{regionId} {
      allow read: if true;
      allow write: if false; // 관리자만 업데이트
    }
  }
}
```

3. **게시** 클릭

---

## 5️⃣ Firebase Storage 설정

### 5.1 Storage 생성
1. Firebase 콘솔 → **Storage**
2. **시작하기** 클릭
3. **테스트 모드** 또는 **프로덕션 모드** 선택
4. **위치 선택**: Firestore와 동일한 위치
5. **완료** 클릭

### 5.2 Storage 규칙 설정
1. **규칙** 탭 클릭
2. 다음 규칙 복사 후 붙여넣기:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 지역 통계 JSON 파일 - 모든 사용자 읽기 가능
    match /statistics/{allPaths=**} {
      allow read: if true;
      allow write: if false; // 관리자만 업데이트
    }
    
    // 사용자별 업로드 파일
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. **게시** 클릭

### 5.3 통계 데이터 폴더 생성
1. **파일** 탭 클릭
2. **폴더 추가** 클릭
3. 폴더 이름: `statistics`
4. 향후 지역별 JSON 파일 업로드 예정

---

## 6️⃣ Xcode 프로젝트 설정

### 6.1 URL Scheme 설정 (Google Sign-In)
1. Xcode에서 `bidcal` 프로젝트 선택
2. TARGETS → `bidcal` 선택
3. **Info** 탭 클릭
4. **URL Types** 섹션 확장
5. **+** 버튼 클릭
6. **Identifier**: `GoogleSignIn`
7. **URL Schemes**: `GoogleService-Info.plist`의 `REVERSED_CLIENT_ID` 값 복사
   - 파일을 열어 `REVERSED_CLIENT_ID` 항목 찾기
   - 예: `com.googleusercontent.apps.123456789-abcdef`

### 6.2 Apple Sign-In Capability 추가
1. **Signing & Capabilities** 탭 클릭
2. **+ Capability** 버튼 클릭
3. **Sign in with Apple** 검색 및 추가

### 6.3 Bundle Identifier 확인
1. **General** 탭
2. **Bundle Identifier**가 `com.giroklabs.bidcal`인지 확인
3. 변경했다면 Firebase Console에서도 업데이트 필요

---

## 7️⃣ 코드 활성화

### 7.1 Firebase import 활성화
`bidcal/BidCalApp.swift` 파일 수정:

```swift
import SwiftUI
import Firebase  // 주석 해제

@main
struct BidCalApp: App {
    init() {
        FirebaseApp.configure()  // 주석 해제
    }
    
    // ... 나머지 코드
}
```

### 7.2 SettingsView 활성화
`bidcal/Views/SettingsRootView.swift` 파일 수정:

```swift
import SwiftUI

struct SettingsRootView: View {
    @StateObject private var firebase = FirebaseManager()  // 주석 해제
    
    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("계정")) {
                    if let user = firebase.currentUser {
                        // 로그인된 사용자 UI
                        HStack {
                            Image(systemName: "person.crop.circle.fill")
                                .font(.title2)
                            VStack(alignment: .leading) {
                                Text(user.email ?? user.uid)
                                    .font(.subheadline)
                                Text("로그인됨")
                                    .foregroundColor(.secondary)
                                    .font(.caption)
                            }
                            Spacer()
                            Button("로그아웃") {
                                firebase.signOut()
                            }
                        }
                    } else {
                        // 로그인 버튼
                        Button {
                            // Google 로그인
                            if let viewController = UIApplication.shared.windows.first?.rootViewController {
                                Task {
                                    do {
                                        try await firebase.signInWithGoogle(presenting: viewController)
                                    } catch {
                                        print("Google 로그인 실패: \(error)")
                                    }
                                }
                            }
                        } label: {
                            Label("Google로 로그인", systemImage: "g.circle")
                        }
                    }
                }
            }
            .navigationTitle("설정")
        }
    }
}
```

---

## 8️⃣ 테스트

### 8.1 빌드 및 실행
1. Xcode에서 **Cmd + R** 또는 Run 버튼
2. 시뮬레이터 또는 실제 기기에서 실행
3. Firebase 초기화 로그 확인:
   ```
   ✅ Firebase 초기화 완료
   ```

### 8.2 로그인 테스트
1. **설정** 탭 이동
2. **Google로 로그인** 버튼 클릭
3. Google 계정 선택
4. 로그인 성공 확인

---

## 🔧 문제 해결

### "No such module 'Firebase'"
1. **Clean Build Folder**: Cmd + Shift + K
2. **Pod 재설치**:
   ```bash
   cd /Users/greego/Desktop/bid/bidcal
   pod deintegrate
   pod install
   ```
3. **Xcode 완전히 종료 후 재실행**
4. **bidcal.xcworkspace**로 열었는지 확인 (❌ bidcal.xcodeproj 아님)

### Google 로그인 URL Scheme 오류
1. `GoogleService-Info.plist` 열기
2. `REVERSED_CLIENT_ID` 값 복사
3. Xcode → **Info** → **URL Types**에 정확히 입력

### Firestore 보안 규칙 오류
1. Firebase Console → **Firestore** → **규칙** 확인
2. **모니터링** 탭에서 오류 로그 확인
3. 테스트 모드로 임시 전환 가능

---

## 📱 다음 단계

Firebase 설정 완료 후:
1. ✅ 코드에서 Firebase 활성화
2. 🔄 로그인 기능 테스트
3. 📊 매물 데이터 CRUD 구현
4. ☁️ 클라우드 동기화 구현

---

## 🔗 참고 자료

- [Firebase iOS 문서](https://firebase.google.com/docs/ios/setup)
- [Firebase Authentication 가이드](https://firebase.google.com/docs/auth/ios/start)
- [Firestore 문서](https://firebase.google.com/docs/firestore)
- [Google Sign-In iOS](https://developers.google.com/identity/sign-in/ios)
- [Apple Sign In 가이드](https://firebase.google.com/docs/auth/ios/apple)

---

## ✅ 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] iOS 앱 추가 (Bundle ID: com.giroklabs.bidcal)
- [ ] GoogleService-Info.plist 다운로드 및 Xcode 추가
- [ ] Google Sign-In 활성화
- [ ] Apple Sign-In 활성화
- [ ] Firestore 데이터베이스 생성 (서울 리전)
- [ ] Firestore 보안 규칙 설정
- [ ] Firebase Storage 생성
- [ ] Storage 규칙 설정
- [ ] URL Scheme 설정 (Google)
- [ ] Sign in with Apple Capability 추가
- [ ] Firebase import 활성화
- [ ] 로그인 기능 테스트

---

**마지막 업데이트**: 2025년 1월 28일

