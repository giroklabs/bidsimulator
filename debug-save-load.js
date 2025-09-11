/**
 * 저장/불러오기 디버깅 도구
 */

// 디버깅 함수들
window.debugSaveLoad = {
    // 전체 시스템 상태 확인
    checkSystemStatus() {
        console.log('=== 시스템 상태 확인 ===');
        
        // StorageManager 상태
        console.log('StorageManager:', window.storageManager);
        console.log('StorageManager 데이터:', window.storageManager.currentData);
        
        // FormDataManager 상태
        console.log('FormDataManager:', window.formDataManager);
        
        // AuctionSimulator 상태
        console.log('AuctionSimulator:', window.auctionSimulator);
        console.log('Properties:', window.auctionSimulator?.getProperties());
        
        // localStorage 상태
        console.log('localStorage keys:', Object.keys(localStorage));
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`localStorage[${key}]:`, localStorage.getItem(key));
        }
    },
    
    // 매물 데이터 수동 저장 테스트
    testManualSave(propertyIndex = 0) {
        console.log('=== 수동 저장 테스트 ===');
        
        if (!window.storageManager) {
            console.error('StorageManager가 없습니다.');
            return;
        }
        
        const properties = window.storageManager.getProperties();
        if (!properties[propertyIndex]) {
            console.error(`매물 ${propertyIndex}이 없습니다.`);
            return;
        }
        
        const testData = {
            auctionInfo: {
                caseNumber: 'TEST123',
                propertyLocation: '테스트 주소',
                propertyType: '아파트',
                court: '테스트 법원',
                auctionDate: '2024-12-31',
                auctionStatus: '진행중',
                bidPrice: '100000000',
                marketPrice: '120000000',
                appraisalPrice: '110000000',
                minimumBid: '80000000',
                renovationCost: '5000000',
                competitorCount: '3',
                marketCondition: 'normal',
                urgency: 'medium',
                auctionType: 'realEstate',
                failedCount: '0',
                regionSelect: '경기',
                districtSelect: '부천시 오정구'
            },
            inspectionData: {
                preservationRegistry: '예',
                buildingAge: '10',
                meters: '85',
                mailCheck: '정상',
                slope: '평지',
                lightingDirection: '남향',
                structureFloor: '15',
                parking: '가능',
                waterLeakage: '없음',
                unpaidUtilities: '없음',
                gasType: '도시가스',
                gasUnpaid: '없음',
                residentsCheck: '확인',
                currentResidents: '0',
                busRoutes: '좋음',
                subway: '보통',
                shopping: '좋음',
                schools: '보통',
                molitPrice: '120000000',
                naverPrice: '125000000',
                kbPrice: '118000000',
                fieldPrice: '122000000',
                specialNotes: '테스트 메모',
                finalScore: '85',
                inspectionDate: '2024-12-01'
            },
            simulationResult: {
                recommendedPrice: '105000000',
                winProbability: '75%',
                expectedProfit: '15000000',
                totalCost: '108000000',
                riskAdjustedProfit: '12000000',
                modelConfidence: '높음'
            },
            saleRateInfo: {
                saleRateValue: '78.2%',
                saleRatePercent: '28.8%',
                investmentRecommendation: '추천'
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('테스트 데이터:', testData);
        
        const success = window.storageManager.savePropertyData(propertyIndex, testData);
        console.log('저장 결과:', success);
        
        if (success) {
            console.log('저장 성공!');
            this.checkSystemStatus();
        } else {
            console.error('저장 실패!');
        }
    },
    
    // 매물 데이터 수동 로드 테스트
    testManualLoad(propertyIndex = 0) {
        console.log('=== 수동 로드 테스트 ===');
        
        if (!window.storageManager) {
            console.error('StorageManager가 없습니다.');
            return;
        }
        
        const savedData = window.storageManager.loadPropertyData(propertyIndex);
        console.log('로드된 데이터:', savedData);
        
        if (savedData) {
            console.log('로드 성공!');
            
            // FormDataManager로 로드 테스트
            if (window.formDataManager) {
                const success = window.formDataManager.loadFormData(savedData);
                console.log('폼 로드 결과:', success);
            }
        } else {
            console.error('로드 실패 - 저장된 데이터가 없습니다.');
        }
    },
    
    // 전체 사이클 테스트
    testFullCycle(propertyIndex = 0) {
        console.log('=== 전체 사이클 테스트 ===');
        
        // 1. 저장 테스트
        this.testManualSave(propertyIndex);
        
        // 2. 잠시 대기
        setTimeout(() => {
            // 3. 로드 테스트
            this.testManualLoad(propertyIndex);
        }, 1000);
    },
    
    // 매물 추가 테스트
    testAddProperty() {
        console.log('=== 매물 추가 테스트 ===');
        
        if (!window.storageManager) {
            console.error('StorageManager가 없습니다.');
            return;
        }
        
        const testProperty = {
            name: '테스트 매물',
            caseNumber: 'TEST2024001',
            type: '아파트',
            location: '서울시 강남구',
            region: '서울',
            district: '강남구',
            notes: '테스트용 매물입니다.'
        };
        
        const newProperty = window.storageManager.addProperty(testProperty);
        console.log('매물 추가 결과:', newProperty);
        
        if (newProperty) {
            console.log('매물 추가 성공!');
            this.checkSystemStatus();
        } else {
            console.error('매물 추가 실패!');
        }
    }
};

// 전역 함수로 노출
window.checkSystemStatus = window.debugSaveLoad.checkSystemStatus;
window.testManualSave = window.debugSaveLoad.testManualSave;
window.testManualLoad = window.debugSaveLoad.testManualLoad;
window.testFullCycle = window.debugSaveLoad.testFullCycle;
window.testAddProperty = window.debugSaveLoad.testAddProperty;

// 간단한 테스트 함수
window.quickTest = () => {
    console.log('=== 빠른 테스트 ===');
    
    // 1. 매물 추가
    if (window.storageManager) {
        const testProperty = {
            name: '테스트 매물',
            caseNumber: 'TEST001',
            type: '아파트',
            location: '서울시 강남구',
            region: '서울',
            district: '강남구'
        };
        
        const newProperty = window.storageManager.addProperty(testProperty);
        console.log('매물 추가 결과:', newProperty);
        
        if (newProperty) {
            // 2. 데이터 저장
            const testData = {
                auctionInfo: { caseNumber: 'TEST001', propertyLocation: '서울시 강남구' },
                inspectionData: { buildingAge: '10', meters: '85' },
                simulationResult: { recommendedPrice: '100000000' },
                saleRateInfo: { saleRateValue: '75%', saleRatePercent: '25%' }
            };
            
            const saveSuccess = window.storageManager.savePropertyData(0, testData);
            console.log('데이터 저장 결과:', saveSuccess);
            
            // 3. 데이터 로드
            const loadedData = window.storageManager.loadPropertyData(0);
            console.log('데이터 로드 결과:', loadedData);
            
            // 4. 폼에 로드
            if (window.formDataManager && loadedData) {
                const loadSuccess = window.formDataManager.loadFormData(loadedData);
                console.log('폼 로드 결과:', loadSuccess);
            }
        }
    } else {
        console.error('StorageManager가 없습니다.');
    }
};

console.log('디버깅 함수들이 로드되었습니다:');
console.log('- checkSystemStatus(): 시스템 상태 확인');
console.log('- testManualSave(index): 수동 저장 테스트');
console.log('- testManualLoad(index): 수동 로드 테스트');
console.log('- testFullCycle(index): 전체 사이클 테스트');
console.log('- testAddProperty(): 매물 추가 테스트');
console.log('- quickTest(): 빠른 전체 테스트');
