# 구글 드라이브 API 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 이름: "경매시뮬레이터" (또는 원하는 이름)

### 1.2 API 활성화
1. **API 및 서비스** > **라이브러리** 이동
2. "Google Drive API" 검색 후 활성화
3. "Google Sheets API" (선택사항) 검색 후 활성화

### 1.3 인증 정보 생성
1. **API 및 서비스** > **사용자 인증 정보** 이동
2. **사용자 인증 정보 만들기** > **API 키** 클릭
3. API 키 복사 후 `google-drive-storage.js`의 `API_KEY`에 입력

### 1.4 OAuth 2.0 클라이언트 ID 생성
1. **사용자 인증 정보 만들기** > **OAuth 2.0 클라이언트 ID** 클릭
2. 애플리케이션 유형: **웹 애플리케이션**
3. 승인된 JavaScript 원본: `http://localhost:8003` (또는 실제 도메인)
4. 클라이언트 ID 복사 후 `google-drive-storage.js`의 `CLIENT_ID`에 입력

## 2. HTML에 스크립트 추가

```html
<!-- index.html에 추가 -->
<script src="https://apis.google.com/js/api.js"></script>
<script src="google-drive-storage.js"></script>
```

## 3. 사용법

### 3.1 초기화 및 인증
```javascript
// Google Drive 초기화
await window.googleDriveStorage.initialize();
```

### 3.2 데이터 저장
```javascript
// 매물 데이터 저장
const propertyData = {
    name: "부천시 원미구",
    caseNumber: "2024타경12345",
    // ... 기타 데이터
};
await window.googleDriveHelpers.savePropertyData(1, propertyData);
```

### 3.3 데이터 불러오기
```javascript
// 파일 목록 조회
const files = await window.googleDriveStorage.listFiles();
console.log('저장된 파일들:', files);

// 특정 파일 불러오기
const data = await window.googleDriveHelpers.loadPropertyData('매물_1_1234567890.json');
```

## 4. 보안 주의사항

### 4.1 API 키 보안
- API 키를 공개 저장소에 올리지 마세요
- 프로덕션 환경에서는 환경변수 사용
- API 키 제한 설정 권장

### 4.2 OAuth 설정
- 승인된 도메인에 실제 도메인만 추가
- 개발/프로덕션 환경별로 별도 클라이언트 ID 생성

## 5. 대안 방법들

### 5.1 구글 시트 연동 (간단한 방법)
```javascript
// 구글 시트에 데이터 저장
const sheetData = [
    ['매물명', '사건번호', '입찰가격', '시세'],
    ['부천시 원미구', '2024타경12345', '200000000', '250000000']
];
// Google Sheets API 사용하여 저장
```

### 5.2 구글 폼 연동
- 구글 폼을 생성하고 데이터를 자동으로 제출
- 구글 시트에 자동으로 데이터 저장됨

## 6. 무료 사용량 제한

### 6.1 Google Drive API
- 일일 요청 수: 1,000,000회
- 파일 업로드: 1GB/일
- 대부분의 개인 사용에는 충분함

### 6.2 비용
- 기본 사용량은 무료
- 초과 시 유료 (매우 저렴함)

## 7. 트러블슈팅

### 7.1 인증 오류
- 클라이언트 ID가 올바른지 확인
- 승인된 도메인이 정확한지 확인

### 7.2 API 오류
- API가 활성화되었는지 확인
- API 키가 올바른지 확인

### 7.3 권한 오류
- OAuth 스코프가 올바른지 확인
- 사용자가 파일 생성 권한이 있는지 확인
