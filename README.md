# 🏛️ 경매 입찰가격 시뮬레이션 서비스

> 최적의 경매 입찰가격을 찾아보세요

## 🌐 GitHub Pages 배포

이 프로젝트는 GitHub Pages를 통해 배포되어 전 세계 어디서나 접속 가능합니다.

**🔗 배포 URL:** https://giroklabs.github.io/bidsimulator/

## ✨ 주요 기능

### 📊 시뮬레이션 기능
- **통합 권장 입찰가격** 계산
- **낙찰 확률** 분석 (50-60% 목표)
- **예상 수익률** 계산
- **리스크 조정 수익률** 분석
- **모델 신뢰도** 평가

### 💰 비용 계산
- **사용자 입력 입찰가격 기준** 비용 계산
- **경매 수수료** (경매 타입별 차등 적용)
- **등기비용** 및 **세금** 계산
- **리모델링 비용** 포함

### 📈 분석 도구
- **입찰가격별 낙찰 확률** 차트
- **감정가/시세/최저입찰가 대비** 비율 분석
- **시세 대비 예상 수익** 계산
- **전략 조언** 제공

### 🏠 매물 관리
- **매물별 데이터** 저장/불러오기
- **로컬 스토리지** 활용
- **매물 정보** 관리

## 🚀 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Backend**: Python Flask (로컬 개발용)
- **Storage**: LocalStorage API
- **Deployment**: GitHub Pages

## 📱 사용 방법

1. **브라우저에서 접속**: https://giroklabs.github.io/bidsimulator/
2. **경매 정보 입력**: 사건번호, 물건주소, 물건종류 등
3. **물건조사 정보 입력**: 노후도, 구조, 주차장 등
4. **시뮬레이션 실행**: "시뮬레이션 실행" 버튼 클릭
5. **결과 분석**: 권장 입찰가격 및 낙찰 확률 확인

## 🔧 로컬 개발 환경

### 필요 조건
- Python 3.9+
- 웹 브라우저 (Chrome, Firefox, Safari 등)

### 설치 및 실행
```bash
# 저장소 클론
git clone https://github.com/giroklabs/bidsimulator.git
cd bidsimulator

# Flask 백엔드 서버 실행 (선택사항)
python3 app.py

# HTTP 서버 실행
python3 -m http.server 8005

# 브라우저에서 접속
# http://localhost:8005
```

## 📊 주요 알고리즘

### 권장 입찰가격 계산
```javascript
// 매각가율 기반 계산
예상낙찰가 = 시세 × (매각가율 ÷ 100)
권장입찰가 = 예상낙찰가 - 추가비용 - 수수료 - 목표수익

// 낙찰확률 50-60% 목표 조정
targetPriceRatio = (시세 × 매각가율) / 권장입찰가
```

### 비용 계산
```javascript
// 사용자 입력 가격 기준
const userBidPrice = bidPrice > 0 ? bidPrice : recommendedBid;
const totalCost = userBidPrice + fees + taxes + additionalCosts;
```

## 🎯 특징

- **실시간 계산**: 입력값 변경 시 즉시 결과 업데이트
- **정확한 비용 계산**: 실제 경매 비용 구조 반영
- **직관적 UI**: 사용자 친화적 인터페이스
- **모바일 최적화**: 반응형 웹 디자인
- **데이터 저장**: 매물별 정보 관리

## 📈 업데이트 내역

### v1.2.0 (최신)
- ✅ 사용자 입력 입찰가격 기준 비용 계산
- ✅ 권장 입찰가격 산정 알고리즘 개선
- ✅ 낙찰확률 50-60% 목표 조정
- ✅ GitHub Pages 배포

### v1.1.0
- ✅ 매각가율 기반 권장가격 계산
- ✅ 지역별 매각가율 정보 연동
- ✅ 매물 관리 시스템

### v1.0.0
- ✅ 기본 시뮬레이션 기능
- ✅ 비용 계산 시스템
- ✅ 차트 및 분석 도구

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

- **GitHub**: [giroklabs/bidsimulator](https://github.com/giroklabs/bidsimulator)
- **Issues**: [GitHub Issues](https://github.com/giroklabs/bidsimulator/issues)

---

**🏛️ 경매 입찰가격 시뮬레이션 서비스**로 더 나은 투자 결정을 내려보세요!