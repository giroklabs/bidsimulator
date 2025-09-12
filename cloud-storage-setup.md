# 클라우드 스토리지 설정 가이드

## 📱 **카카오 드라이브 설정**

### 1. 카카오 개발자 콘솔 설정
1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 새 애플리케이션 생성
3. **앱 키** > **JavaScript 키** 복사
4. `kakao-drive-storage.js`의 `APP_KEY`에 입력

### 2. 플랫폼 설정
1. **플랫폼** > **Web** 추가
2. 사이트 도메인: `http://localhost:8003` (또는 실제 도메인)

### 3. 사용법
```javascript
// 카카오 드라이브 연동
await window.cloudStorageHelpers.enableKakaoDrive();
```

---

## 🟢 **네이버 클라우드 플랫폼 설정**

### 1. 네이버 클라우드 플랫폼 가입
1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속
2. 회원가입 및 인증 완료

### 2. Object Storage 설정
1. **Storage** > **Object Storage** 선택
2. 새 버킷 생성 (예: `auction-simulator`)
3. **API 인증키** 생성
4. `naver-cloud-storage.js`에 설정:
   ```javascript
   this.ACCESS_KEY = 'YOUR_ACCESS_KEY';
   this.SECRET_KEY = 'YOUR_SECRET_KEY';
   this.BUCKET_NAME = 'auction-simulator';
   ```

### 3. Cloud DB for MongoDB 설정
1. **Database** > **Cloud DB for MongoDB** 선택
2. 새 인스턴스 생성
3. **API 인증키** 생성
4. `naver-cloud-db.js`에 설정:
   ```javascript
   this.API_KEY = 'YOUR_API_KEY';
   this.SECRET_KEY = 'YOUR_SECRET_KEY';
   ```

### 4. 사용법
```javascript
// 네이버 클라우드 Object Storage 연동
await window.cloudStorageHelpers.enableNaverCloud();

// 네이버 클라우드 DB 연동
await window.cloudStorageHelpers.enableNaverCloudDB();
```

---

## ☁️ **구글 드라이브 설정 (참고)**

### 1. Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. Google Drive API 활성화
4. OAuth 2.0 클라이언트 ID 생성

### 2. 사용법
```javascript
// 구글 드라이브 연동
await window.cloudStorageHelpers.enableGoogleDrive();
```

---

## 🔧 **통합 사용법**

### 1. 클라우드 서비스 선택
```javascript
// 드롭다운에서 서비스 선택 후 "🔗 클라우드 연동" 버튼 클릭
// 또는 직접 코드로 연동
await window.cloudStorageHelpers.enableKakaoDrive();
```

### 2. 데이터 저장/불러오기
```javascript
// 매물 데이터 저장 (자동으로 활성 클라우드 서비스에 저장)
await window.cloudStorageHelpers.saveProperty(1, propertyData);

// 매물 데이터 불러오기
const data = await window.cloudStorageHelpers.loadProperty(1);

// 모든 매물 불러오기
const allProperties = await window.cloudStorageHelpers.loadAllProperties();
```

### 3. 백업 및 복원
```javascript
// 백업 생성
await window.cloudStorageHelpers.createBackup(allData);

// 데이터 가져오기 (복원)
const properties = await window.cloudStorageHelpers.loadAllProperties();
```

### 4. 클라우드 서비스 전환
```javascript
// 다른 클라우드 서비스로 전환
await window.cloudStorageHelpers.switchProvider('kakao');
await window.cloudStorageHelpers.switchProvider('naver');
await window.cloudStorageHelpers.switchProvider('google');
```

---

## 💰 **비용 비교**

### 카카오 드라이브
- ✅ **무료**: 기본 사용량 무료
- ✅ **간편**: 카카오 계정으로 로그인
- ⚠️ **제한**: API 호출 제한 있음

### 네이버 클라우드 플랫폼
- 💰 **유료**: 사용량 기반 과금
- ✅ **안정성**: 엔터프라이즈급 서비스
- ✅ **확장성**: 대용량 데이터 처리 가능

### 구글 드라이브
- ✅ **무료**: 일일 1,000,000 요청 무료
- ✅ **안정성**: 구글 인프라
- ✅ **통합성**: 구글 생태계와 연동

---

## 🔒 **보안 주의사항**

### 1. API 키 보안
- API 키를 공개 저장소에 올리지 마세요
- 프로덕션 환경에서는 환경변수 사용
- API 키 제한 설정 권장

### 2. 데이터 암호화
- 민감한 데이터는 암호화 후 저장
- HTTPS 연결 필수
- 정기적인 백업 권장

### 3. 접근 권한 관리
- 최소 권한 원칙 적용
- 정기적인 권한 검토
- 불필요한 권한 제거

---

## 🚀 **성능 최적화**

### 1. 배치 처리
```javascript
// 여러 매물을 한 번에 저장
const properties = [property1, property2, property3];
await Promise.all(properties.map((prop, index) => 
    window.cloudStorageHelpers.saveProperty(index, prop)
));
```

### 2. 캐싱
```javascript
// 로컬 캐시와 클라우드 동기화
const localData = localStorage.getItem('cached_data');
const cloudData = await window.cloudStorageHelpers.loadAllProperties();
```

### 3. 오프라인 지원
```javascript
// 네트워크 상태 확인
if (navigator.onLine) {
    await window.cloudStorageHelpers.saveProperty(index, data);
} else {
    // 로컬에 임시 저장
    localStorage.setItem(`temp_${index}`, JSON.stringify(data));
}
```

---

## 📞 **지원 및 문의**

### 카카오
- [카카오 개발자 센터](https://developers.kakao.com/)
- 카카오톡 채널: @카카오개발자

### 네이버
- [네이버 클라우드 플랫폼 고객센터](https://www.ncloud.com/support)
- 기술지원: support@ncloud.com

### 구글
- [Google Cloud 지원](https://cloud.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-drive-api)
