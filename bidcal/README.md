# 경매일기 (BidCal) - iOS App

## 📱 프로젝트 개요

경매 매물 관리 및 시뮬레이션을 위한 iOS 네이티브 앱입니다.

- **개발 언어**: Swift 5.9+
- **프레임워크**: SwiftUI
- **최소 지원**: iOS 16.0+
- **의존성 관리**: CocoaPods
- **백엔드**: Firebase (Auth, Firestore, Storage)

## 🎨 디자인 시스템

### 컬러 팔레트
- **Accent Color**: Yellow (#FFD60A) - 밝은 노란색
- **Primary**: Dark Gray (#333338) - 메인 텍스트
- **Secondary**: Medium Gray (#808084) - 서브 텍스트
- **Background**: Cream Beige (#FAF8F2) - 배경

### 테마 특징
- 노란색 포인트 + 그레이 톤 조합
- 시스템 기본 폰트 사용
- 카드 기반 UI 디자인
- 부드러운 그라데이션 및 그림자 효과

## 📂 프로젝트 구조

```
bidcal/
├── Models/
│   ├── AuctionProperty.swift      # 경매 매물 모델
│   └── RegionStatistics.swift     # 지역 통계 모델
├── Views/
│   ├── PropertyListView.swift     # 매물 목록 화면
│   ├── AddPropertyView.swift      # 매물 등록 화면
│   ├── EditPropertyView.swift     # 매물 편집 화면
│   ├── PropertyDetailView.swift   # 매물 상세 화면
│   ├── SimulationView.swift       # 시뮬레이션 결과 화면
│   ├── InspectionView.swift       # 물건조사 화면
│   ├── StatisticsRootView.swift   # 통계 화면
│   └── SettingsRootView.swift     # 설정 화면
├── Managers/
│   ├── DataManager.swift          # 로컬 데이터 관리 (UserDefaults)
│   ├── AuctionCalculator.swift    # 경매 계산 로직
│   └── FirebaseManager.swift      # Firebase 인증 및 동기화
├── Theme.swift                    # 디자인 시스템
├── BidCalApp.swift                # 앱 진입점
└── GoogleService-Info.plist       # Firebase 설정
```

## 🚀 주요 기능

### 1. 매물 관리
- ✅ 매물 등록 (사건번호, 주소, 가격 정보 등)
- ✅ 매물 편집 및 삭제
- ✅ 매물 목록 및 검색
- ✅ 필터링 (상태별, 물건 종류별)

### 2. 시뮬레이션
- ✅ 권장 입찰가 계산
- ✅ 낙찰 확률 분석
- ✅ 예상 수익률 계산
- ✅ 비용 상세 분석 (취득세, 등기비용 등)
- ✅ 가격 비교 차트 (Swift Charts)
- ✅ 비용 구성 차트

### 3. 물건조사
- ✅ 현장조사 항목 입력
  - 물건조사: 보존등기, 노후도, 계량기, 우편물 등
  - 주변조사: 버스노선, 지하철, 마트, 학교
  - 시세조사: 국토교통부, 네이버, KB시세, 현장실사
- ✅ 특이사항 메모
- ✅ 종합 평가 점수 자동 계산

### 4. 통계 분석
- ✅ 지역별 경매 통계
  - 매각가율, 매각률, 평균 입찰 건수
- ✅ 내 데이터 분석
  - 물건 종류별 분포
  - 가격대별 분포
  - 상태별 분포
  - 평균 수익률

### 5. 설정
- ✅ Google 로그인
- ✅ Apple 로그인 (준비 중)
- ⏳ 클라우드 동기화 (구현 예정)

## 🔧 설치 방법

### 1. 필수 요구사항
```bash
# Xcode 15.0+
# CocoaPods
sudo gem install cocoapods
```

### 2. 의존성 설치
```bash
cd bidcal
pod install
```

### 3. Firebase 설정
1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. iOS 앱 추가 (Bundle ID: `com.giroklabs.bidcal`)
3. `GoogleService-Info.plist` 다운로드 및 프로젝트에 추가
4. Authentication 활성화 (Google Sign-In)
5. Firestore Database 생성
6. Storage 버킷 생성

### 4. 프로젝트 실행
```bash
# Workspace 파일로 열기 (중요!)
open bidcal.xcworkspace
```

## 📊 데이터 모델

### AuctionProperty
```swift
struct AuctionProperty {
    var id: UUID
    var caseNumber: String              // 사건번호
    var propertyLocation: String        // 물건지 주소
    var propertyType: PropertyType      // 물건 종류
    var court: String                   // 관할 법원
    var auctionDate: Date               // 경매일
    var auctionStatus: AuctionStatus    // 경매 상태
    
    // 가격 정보
    var bidPrice: Double                // 입찰가격
    var marketPrice: Double             // 시세
    var appraisalPrice: Double          // 감정가
    var minimumBid: Double              // 최저입찰가
    var renovationCost: Double          // 리모델링 비용
    
    // 입찰 전략
    var competitorCount: Int            // 예상 경쟁자 수
    var targetProfitRate: Double        // 목표 수익률
    var failedCount: Int                // 유찰 횟수
    
    // 관계 데이터
    var inspection: PropertyInspection?
    var simulationResult: SimulationResult?
}
```

### SimulationResult
```swift
struct SimulationResult {
    var recommendedBidPrice: Double     // 권장 입찰가
    var winningProbability: Double      // 낙찰 확률 (%)
    var expectedProfit: Double          // 예상 수익
    var totalCost: Double               // 총 비용
    var profitRate: Double              // 수익률 (%)
    
    // 비용 상세
    var acquisitionTax: Double          // 취득세
    var localEducationTax: Double       // 지방교육세
    var registrationFees: Double        // 등기비용
    // ...
}
```

## 🧮 계산 로직

### 1. 권장 입찰가 계산
```
권장 입찰가 = 예상 낙찰가 - 추가비용 - 수수료 - 목표수익
예상 낙찰가 = 시세 × 매각가율 / 100
```

### 2. 낙찰 확률 계산
```
기본 확률 = min((입찰가 / 권장가) × 50, 90)
경쟁자 조정 = -3% × 경쟁자 수
유찰 조정 = +5% × 유찰 횟수
최종 확률 = 기본 확률 + 경쟁자 조정 + 유찰 조정
```

### 3. 비용 계산
- 취득세: 낙찰가 × 4%
- 지방교육세: 취득세 × 10%
- 농어촌특별세: 취득세 × 10%
- 등기비용: 낙찰가 × 1%
- 전문가 수수료: 낙찰가 × 0.5%

## 🎯 데이터 저장 전략

### Local-First 접근
1. **즉시 저장**: UserDefaults에 로컬 저장
2. **백그라운드 동기화**: Firebase Firestore에 동기화 (구현 예정)
3. **오프라인 지원**: 로컬 데이터만으로 완전 동작

### 동기화 전략 (구현 예정)
- 로그인 시: Firebase → Local 동기화
- 데이터 변경 시: Local → Firebase 동기화
- 충돌 해결: 최신 수정 시간 기준

## 📈 차트 및 시각화

### Swift Charts (iOS 16+)
- 가격 비교 Bar Chart
- 비용 구성 Pie Chart
- 물건 종류별 분포 Sector Chart
- 가격대별 분포 Bar Chart

### Fallback UI (iOS 15)
- 커스텀 Bar 컴포넌트
- 퍼센트 기반 시각화

## 🔐 보안 및 인증

### Firebase Authentication
- Google Sign-In 지원
- Apple Sign-In 준비 중
- 토큰 기반 인증
- 자동 세션 관리

## 🧪 테스트

```bash
# 유닛 테스트
xcodebuild test -workspace bidcal.xcworkspace -scheme bidcal -destination 'platform=iOS Simulator,name=iPhone 15'
```

## 📱 배포

### TestFlight
1. Archive 생성
2. App Store Connect 업로드
3. 베타 테스터 초대

### App Store
1. 앱 정보 작성
2. 스크린샷 준비 (필수: 6.7", 6.5", 5.5")
3. 개인정보 처리방침 URL
4. 심사 제출

## 🛠 개발 도구

- **Xcode**: 15.0+
- **Swift**: 5.9+
- **CocoaPods**: 1.12+
- **Git**: 버전 관리
- **Firebase Console**: 백엔드 관리

## 📝 TODO

- [ ] Apple Sign-In 구현
- [ ] Firebase 동기화 완성
- [ ] 지역 통계 데이터 동적 로드 (Firebase Storage)
- [ ] 푸시 알림 (경매일 알림)
- [ ] 다크 모드 지원
- [ ] iPad 레이아웃 최적화
- [ ] 위젯 (Today Extension)
- [ ] Siri Shortcuts

## 📄 라이선스

Copyright © 2025 Girok Labs. All rights reserved.

## 👨‍💻 개발자

- **Girok Labs**
- **Contact**: [GitHub](https://github.com/giroklabs)

---

**Made with ❤️ in South Korea**

