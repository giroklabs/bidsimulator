/**
 * 저장/불러오기 기능 긴급 수정 도구
 * 모든 문제를 종합적으로 진단하고 해결
 */

// 긴급 진단 함수
window.emergencyDiagnosis = () => {
    console.log('=== 긴급 진단 시작 ===');
    
    // 1. 전역 객체 확인
    console.log('1. 전역 객체 확인:');
    console.log('  - window.storageManager:', typeof window.storageManager);
    console.log('  - window.formDataManager:', typeof window.formDataManager);
    console.log('  - window.auctionSimulator:', typeof window.auctionSimulator);
    
    // 2. localStorage 접근성 확인
    console.log('2. localStorage 접근성 확인:');
    try {
        const testKey = 'test_access';
        localStorage.setItem(testKey, 'test');
        const result = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        console.log('  - localStorage 접근: 성공');
        console.log('  - 테스트 결과:', result);
    } catch (error) {
        console.error('  - localStorage 접근: 실패', error);
    }
    
    // 3. StorageManager 기능 테스트
    console.log('3. StorageManager 기능 테스트:');
    if (window.storageManager) {
        try {
            const properties = window.storageManager.getProperties();
            console.log('  - getProperties():', properties);
            console.log('  - properties 타입:', Array.isArray(properties) ? 'Array' : typeof properties);
            console.log('  - properties 길이:', properties?.length || 0);
        } catch (error) {
            console.error('  - getProperties() 오류:', error);
        }
    } else {
        console.error('  - StorageManager가 없습니다.');
    }
    
    // 4. FormDataManager 기능 테스트
    console.log('4. FormDataManager 기능 테스트:');
    if (window.formDataManager) {
        try {
            const formData = window.formDataManager.collectAllFormData();
            console.log('  - collectAllFormData():', formData);
            console.log('  - formData 타입:', typeof formData);
        } catch (error) {
            console.error('  - collectAllFormData() 오류:', error);
        }
    } else {
        console.error('  - FormDataManager가 없습니다.');
    }
    
    // 5. DOM 요소 확인
    console.log('5. DOM 요소 확인:');
    const keyElements = ['caseNumber', 'propertyLocation', 'propertyType'];
    keyElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`  - ${id}:`, element ? '존재' : '없음');
    });
    
    // 6. localStorage 내용 확인
    console.log('6. localStorage 내용:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`  - ${key}:`, localStorage.getItem(key)?.substring(0, 50) + '...');
    }
    
    console.log('=== 진단 완료 ===');
};

// 긴급 수정 함수
window.emergencyFix = () => {
    console.log('=== 긴급 수정 시작 ===');
    
    // 1. StorageManager 강제 재초기화
    if (window.storageManager) {
        console.log('StorageManager 재초기화 중...');
        try {
            window.storageManager = new StorageManager();
            console.log('StorageManager 재초기화 완료');
        } catch (error) {
            console.error('StorageManager 재초기화 실패:', error);
        }
    }
    
    // 2. FormDataManager 강제 재초기화
    if (window.formDataManager) {
        console.log('FormDataManager 재초기화 중...');
        try {
            window.formDataManager = new FormDataManager();
            console.log('FormDataManager 재초기화 완료');
        } catch (error) {
            console.error('FormDataManager 재초기화 실패:', error);
        }
    }
    
    // 3. AuctionSimulator 재초기화
    if (window.auctionSimulator) {
        console.log('AuctionSimulator 재초기화 중...');
        try {
            window.auctionSimulator = new AuctionSimulator();
            console.log('AuctionSimulator 재초기화 완료');
        } catch (error) {
            console.error('AuctionSimulator 재초기화 실패:', error);
        }
    }
    
    console.log('=== 긴급 수정 완료 ===');
};

// 간단한 저장 테스트
window.simpleSaveTest = () => {
    console.log('=== 간단한 저장 테스트 ===');
    
    if (!window.storageManager) {
        console.error('StorageManager가 없습니다.');
        return false;
    }
    
    try {
        // 1. 테스트 매물 추가
        const testProperty = {
            name: '테스트 매물',
            caseNumber: 'TEST001',
            type: '아파트',
            location: '서울시 강남구',
            region: '서울',
            district: '강남구',
            notes: '긴급 수정 테스트용'
        };
        
        console.log('테스트 매물 추가 중...');
        const newProperty = window.storageManager.addProperty(testProperty);
        console.log('매물 추가 결과:', newProperty);
        
        if (newProperty) {
            // 2. 테스트 데이터 저장
            const testData = {
                auctionInfo: {
                    caseNumber: 'TEST001',
                    propertyLocation: '서울시 강남구',
                    propertyType: '아파트',
                    bidPrice: '100000000',
                    marketPrice: '120000000'
                },
                inspectionData: {
                    buildingAge: '10',
                    meters: '85',
                    finalScore: '85'
                },
                simulationResult: {
                    recommendedPrice: '105000000',
                    winProbability: '75%'
                },
                saleRateInfo: {
                    saleRateValue: '78%',
                    saleRatePercent: '28%'
                },
                timestamp: new Date().toISOString()
            };
            
            console.log('테스트 데이터 저장 중...');
            const saveResult = window.storageManager.savePropertyData(0, testData);
            console.log('데이터 저장 결과:', saveResult);
            
            // 3. 데이터 로드 테스트
            console.log('데이터 로드 테스트 중...');
            const loadResult = window.storageManager.loadPropertyData(0);
            console.log('데이터 로드 결과:', loadResult);
            
            return saveResult && loadResult;
        }
        
        return false;
    } catch (error) {
        console.error('간단한 저장 테스트 실패:', error);
        return false;
    }
};

// 간단한 불러오기 테스트
window.simpleLoadTest = () => {
    console.log('=== 간단한 불러오기 테스트 ===');
    
    if (!window.storageManager || !window.formDataManager) {
        console.error('필요한 매니저가 없습니다.');
        return false;
    }
    
    try {
        // 1. 저장된 데이터 확인
        const savedData = window.storageManager.loadPropertyData(0);
        console.log('저장된 데이터:', savedData);
        
        if (!savedData) {
            console.log('저장된 데이터가 없습니다.');
            return false;
        }
        
        // 2. FormDataManager로 로드
        console.log('FormDataManager로 로드 중...');
        const loadResult = window.formDataManager.loadFormData(savedData);
        console.log('폼 로드 결과:', loadResult);
        
        return loadResult;
    } catch (error) {
        console.error('간단한 불러오기 테스트 실패:', error);
        return false;
    }
};

// 전체 시스템 재시작
window.restartSystem = () => {
    console.log('=== 전체 시스템 재시작 ===');
    
    // 1. 모든 전역 객체 초기화
    window.storageManager = null;
    window.formDataManager = null;
    window.auctionSimulator = null;
    
    // 2. 새로운 인스턴스 생성
    setTimeout(() => {
        try {
            window.storageManager = new StorageManager();
            window.formDataManager = new FormDataManager();
            window.auctionSimulator = new AuctionSimulator();
            
            console.log('시스템 재시작 완료');
            console.log('이제 emergencyDiagnosis()를 실행하여 상태를 확인하세요.');
        } catch (error) {
            console.error('시스템 재시작 실패:', error);
        }
    }, 100);
};

console.log('긴급 수정 도구가 로드되었습니다:');
console.log('- emergencyDiagnosis(): 종합 진단');
console.log('- emergencyFix(): 긴급 수정');
console.log('- simpleSaveTest(): 간단한 저장 테스트');
console.log('- simpleLoadTest(): 간단한 불러오기 테스트');
console.log('- restartSystem(): 전체 시스템 재시작');
