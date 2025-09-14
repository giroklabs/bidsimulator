# 카카오 로그인 설정 가이드

## 1. 카카오 개발자 콘솔 설정

### 1-1. 애플리케이션 생성
1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 애플리케이션 이름: `경매 입찰가격 시뮬레이션`
4. 저장 완료

### 1-2. REST API 키 복사
1. 생성된 애플리케이션 클릭
2. **앱 키** 섹션에서 **REST API 키** 복사
3. `kakao-login.js` 파일의 `KAKAO_CLIENT_ID` 값에 입력

```javascript
// kakao-login.js 파일 수정
KAKAO_CLIENT_ID: 'YOUR_KAKAO_REST_API_KEY', // 여기에 REST API 키 입력
```

### 1-3. 동의 항목 설정
1. **제품 설정** → **카카오 로그인** → **동의항목**
2. 다음 항목을 **필수 동의**로 설정:
   - **닉네임** (profile_nickname)
   - **프로필 사진** (profile_image)
3. **카카오계정(이메일)** (account_email) - 선택 동의

### 1-4. Redirect URI 등록
1. **제품 설정** → **카카오 로그인** → **활성화 설정**
2. **카카오 로그인** 활성화 (토글 스위치 ON)
3. **플랫폼 설정** → **Web** 선택
4. **사이트 도메인**에 다음 URI들을 **하나씩** 추가:
   - `http://localhost:8000/kakao-callback` (로컬 개발용)
   - `https://giroklabs.github.io/bidsimulator/kakao-callback` (GitHub Pages 배포용)
   - `http://127.0.0.1:8000/kakao-callback` (추가 로컬 테스트용)
5. **+ 추가** 버튼으로 각각 등록 후 **저장**

#### 📋 Redirect URI 등록 상세 단계:
1. 카카오 개발자 콘솔 → 내 애플리케이션 → [애플리케이션 선택]
2. 제품 설정 → 카카오 로그인 클릭
3. 카카오 로그인 활성화 (토글 ON)
4. 플랫폼 설정에서 "Web" 선택
5. 사이트 도메인 입력란에 URI 입력 후 "추가" 버튼 클릭
6. 모든 URI 추가 완료 후 "저장" 버튼 클릭

## 2. 로컬 테스트 설정

### 2-1. 로컬 서버 실행
```bash
# 포트 8000에서 로컬 서버 실행
python3 -m http.server 8000
```

### 2-2. 브라우저에서 테스트
1. `http://localhost:8000` 접속
2. **카카오 로그인** 버튼 클릭
3. 카카오 로그인 페이지에서 인증
4. 콜백 처리 확인

## 3. GitHub Pages 배포 설정

### 3-1. 카카오 콜백 URL 설정
GitHub Pages URL에 맞게 Redirect URI 등록:
```
https://giroklabs.github.io/bidsimulator/kakao-callback
```

### 3-2. 배포 후 테스트
1. GitHub Pages에 배포 완료 후
2. 실제 도메인에서 카카오 로그인 테스트
3. 콜백 처리 및 데이터 저장 확인

## 4. 카카오 로그인 플로우

### 4-1. 로그인 과정
1. **사용자** → 카카오 로그인 버튼 클릭
2. **카카오** → 인증 페이지로 리디렉션
3. **사용자** → 카카오 계정으로 로그인
4. **카카오** → 인증 코드와 함께 콜백 URL로 리디렉션
5. **애플리케이션** → 인증 코드로 액세스 토큰 요청
6. **카카오** → 액세스 토큰 발급
7. **애플리케이션** → 액세스 토큰으로 사용자 정보 요청
8. **카카오** → 사용자 정보 반환
9. **애플리케이션** → GitHub Gist에 카카오 정보 저장

### 4-2. 데이터 구조
카카오 로그인 후 GitHub Gist에 저장되는 데이터:
```json
{
  "properties": [...],
  "currentPropertyIndex": -1,
  "lastSaved": "2024-01-01T00:00:00.000Z",
  "kakaoInfo": {
    "userInfo": {
      "id": 123456789,
      "nickname": "카카오 사용자",
      "profileImage": "https://...",
      "email": "user@example.com",
      "connectedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "kakao_access_token_here",
    "linkedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 5. 문제 해결

### 5-1. 일반적인 오류
- **redirect_uri_mismatch**: Redirect URI가 등록된 것과 다름
- **invalid_client**: REST API 키가 잘못됨
- **invalid_grant**: 인증 코드가 만료됨

### 5-2. 디버깅 방법
1. 브라우저 개발자 도구 콘솔 확인
2. 네트워크 탭에서 API 요청/응답 확인
3. 카카오 개발자 콘솔 로그 확인

## 6. 보안 고려사항

### 6-1. 토큰 관리
- 카카오 액세스 토큰은 localStorage에 저장
- GitHub Gist에는 사용자 정보만 저장 (토큰 제외)
- 로그아웃 시 로컬 토큰 삭제

### 6-2. 데이터 보호
- 카카오 사용자 정보는 GitHub Private Gist에 저장
- 개인정보는 최소한으로 수집
- 사용자 동의 하에만 데이터 수집

## 7. 추가 기능

### 7-1. 확장 가능한 기능
- 카카오톡 메시지 알림
- 카카오 친구 초대
- 카카오 지도 연동
- 카카오페이 결제 연동

### 7-2. 개선 사항
- 토큰 자동 갱신
- 로그인 상태 지속성
- 다중 계정 지원
- 소셜 로그인 통합 관리
