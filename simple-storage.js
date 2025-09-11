/**
 * 간단하고 안정적인 저장/불러오기 시스템
 * 복잡한 클래스 구조 대신 단순한 함수 기반 접근
 */

// 전역 저장소 객체
window.simpleStorage = {
    // 저장 키
    STORAGE_KEY: 'auctionSimulatorSimple',
    
    // 초기화
    init() {
        console.log('SimpleStorage 초기화 시작');
        this.ensureStorageExists();
        console.log('SimpleStorage 초기화 완료');
    },
    
    // 저장소 존재 확인 및 초기화
    ensureStorageExists() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) {
            const initialData = {
                properties: [],
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
            console.log('초기 저장소 생성');
        }
    },
    
    // 전체 데이터 가져오기
    getAllData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
        }
        return { properties: [], lastSaved: null };
    },
    
    // 전체 데이터 저장
    saveAllData(data) {
        try {
            data.lastSaved = new Date().toISOString();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            console.log('데이터 저장 완료');
            return true;
        } catch (error) {
            console.error('데이터 저장 오류:', error);
            return false;
        }
    },
    
    // 매물 목록 가져오기
    getProperties() {
        const data = this.getAllData();
        return data.properties || [];
    },
    
    // 매물 추가
    addProperty(property) {
        const data = this.getAllData();
        const newProperty = {
            id: Date.now(),
            ...property,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.properties.push(newProperty);
        
        if (this.saveAllData(data)) {
            console.log('매물 추가 완료:', newProperty);
            return newProperty;
        }
        return null;
    },
    
    // 매물 업데이트
    updateProperty(index, property) {
        const data = this.getAllData();
        if (data.properties[index]) {
            data.properties[index] = {
                ...data.properties[index],
                ...property,
                updatedAt: new Date().toISOString()
            };
            
            if (this.saveAllData(data)) {
                console.log('매물 업데이트 완료:', data.properties[index]);
                return data.properties[index];
            }
        }
        return null;
    },
    
    // 매물 삭제
    deleteProperty(index) {
        const data = this.getAllData();
        if (data.properties[index]) {
            const deleted = data.properties.splice(index, 1)[0];
            
            if (this.saveAllData(data)) {
                console.log('매물 삭제 완료:', deleted);
                return true;
            }
        }
        return false;
    },
    
    // 매물별 상세 데이터 저장
    savePropertyData(propertyIndex, formData) {
        const data = this.getAllData();
        if (data.properties[propertyIndex]) {
            data.properties[propertyIndex].formData = {
                auctionInfo: formData.auctionInfo || {},
                inspectionData: formData.inspectionData || {},
                simulationResult: formData.simulationResult || {},
                saleRateInfo: formData.saleRateInfo || {},
                timestamp: new Date().toISOString()
            };
            
            if (this.saveAllData(data)) {
                console.log('매물 데이터 저장 완료:', propertyIndex);
                return true;
            }
        }
        return false;
    },
    
    // 매물별 상세 데이터 로드
    loadPropertyData(propertyIndex) {
        const data = this.getAllData();
        if (data.properties[propertyIndex] && data.properties[propertyIndex].formData) {
            console.log('매물 데이터 로드 완료:', propertyIndex);
            return data.properties[propertyIndex].formData;
        }
        return null;
    }
};

// 폼 데이터 수집/로드 함수들
window.simpleFormManager = {
    // 모든 폼 데이터 수집
    collectAllFormData() {
        const data = {
            auctionInfo: this.collectAuctionInfo(),
            inspectionData: this.collectInspectionData(),
            simulationResult: this.collectSimulationResult(),
            saleRateInfo: this.collectSaleRateInfo()
        };
        
        console.log('폼 데이터 수집 완료:', data);
        return data;
    },
    
    // 경매 정보 수집
    collectAuctionInfo() {
        const fields = [
            'caseNumber', 'propertyLocation', 'propertyType', 'court', 'auctionDate',
            'auctionStatus', 'bidPrice', 'marketPrice', 'appraisalPrice', 'minimumBid',
            'renovationCost', 'competitorCount', 'marketCondition', 'urgency',
            'auctionType', 'failedCount', 'regionSelect', 'districtSelect', 'targetProfitRate'
        ];
        
        const data = {};
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                data[field] = element.value || '';
            }
        });
        
        return data;
    },
    
    // 물건조사 데이터 수집
    collectInspectionData() {
        const fields = [
            'preservationRegistry', 'buildingAge', 'meters', 'mailCheck', 'slope',
            'lightingDirection', 'structureFloor', 'parking', 'waterLeakage',
            'unpaidUtilities', 'gasType', 'gasUnpaid', 'residentsCheck',
            'currentResidents', 'busRoutes', 'subway', 'shopping', 'schools',
            'molitPrice', 'naverPrice', 'kbPrice', 'fieldPrice', 'specialNotes',
            'finalScore', 'inspectionDate'
        ];
        
        const data = {};
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                data[field] = element.value || '';
            }
        });
        
        return data;
    },
    
    // 시뮬레이션 결과 수집
    collectSimulationResult() {
        // 시뮬레이션 결과는 화면에 표시된 값들을 수집
        const elements = {
            recommendedPrice: document.getElementById('recommendedPrice'),
            winProbability: document.getElementById('winProbability'),
            expectedProfit: document.getElementById('expectedProfit'),
            riskAdjustedProfit: document.getElementById('riskAdjustedProfit'),
            modelConfidence: document.getElementById('modelConfidence'),
            totalCost: document.getElementById('totalCost')
        };
        
        const data = {};
        Object.keys(elements).forEach(key => {
            const element = elements[key];
            if (element) {
                data[key] = element.textContent || element.value || '';
            }
        });
        
        return data;
    },
    
    // 매각가율 정보 수집
    collectSaleRateInfo() {
        const elements = {
            saleRateValue: document.getElementById('saleRateValue'),
            saleRatePercent: document.getElementById('saleRatePercent'),
            investmentRecommendation: document.getElementById('investmentRecommendation')
        };
        
        const data = {};
        Object.keys(elements).forEach(key => {
            const element = elements[key];
            if (element) {
                data[key] = element.textContent || '';
            }
        });
        
        return data;
    },
    
    // 폼에 데이터 로드
    loadFormData(formData) {
        if (!formData) {
            console.log('로드할 데이터가 없습니다.');
            return false;
        }
        
        try {
            // 경매 정보 로드
            if (formData.auctionInfo) {
                this.loadAuctionInfo(formData.auctionInfo);
            }
            
            // 물건조사 데이터 로드
            if (formData.inspectionData) {
                this.loadInspectionData(formData.inspectionData);
            }
            
            // 시뮬레이션 결과 로드
            if (formData.simulationResult) {
                this.loadSimulationResult(formData.simulationResult);
            }
            
            // 매각가율 정보 로드
            if (formData.saleRateInfo) {
                this.loadSaleRateInfo(formData.saleRateInfo);
            }
            
            console.log('폼 데이터 로드 완료');
            return true;
        } catch (error) {
            console.error('폼 데이터 로드 오류:', error);
            return false;
        }
    },
    
    // 경매 정보 로드
    loadAuctionInfo(data) {
        Object.keys(data).forEach(field => {
            const element = document.getElementById(field);
            if (element && data[field]) {
                element.value = data[field];
            }
        });
    },
    
    // 물건조사 데이터 로드
    loadInspectionData(data) {
        Object.keys(data).forEach(field => {
            const element = document.getElementById(field);
            if (element && data[field]) {
                element.value = data[field];
            }
        });
    },
    
    // 시뮬레이션 결과 로드
    loadSimulationResult(data) {
        Object.keys(data).forEach(field => {
            const element = document.getElementById(field);
            if (element && data[field]) {
                if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
                    element.value = data[field];
                } else {
                    element.textContent = data[field];
                }
            }
        });
    },
    
    // 매각가율 정보 로드
    loadSaleRateInfo(data) {
        Object.keys(data).forEach(field => {
            const element = document.getElementById(field);
            if (element && data[field]) {
                element.textContent = data[field];
            }
        });
        
        // 매각가율 정보 섹션 표시
        const saleRateInfo = document.getElementById('saleRateInfo');
        if (saleRateInfo) {
            saleRateInfo.style.display = 'block';
        }
    },
    
    // 모든 폼 초기화
    resetAllForms() {
        // 경매 정보 초기화
        const auctionFields = [
            'caseNumber', 'propertyLocation', 'propertyType', 'court', 'auctionDate',
            'auctionStatus', 'bidPrice', 'marketPrice', 'appraisalPrice', 'minimumBid',
            'renovationCost', 'competitorCount', 'marketCondition', 'urgency',
            'auctionType', 'failedCount', 'regionSelect', 'districtSelect', 'targetProfitRate'
        ];
        
        auctionFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = '';
            }
        });
        
        // 물건조사 데이터 초기화
        const inspectionFields = [
            'preservationRegistry', 'buildingAge', 'meters', 'mailCheck', 'slope',
            'lightingDirection', 'structureFloor', 'parking', 'waterLeakage',
            'unpaidUtilities', 'gasType', 'gasUnpaid', 'residentsCheck',
            'currentResidents', 'busRoutes', 'subway', 'shopping', 'schools',
            'molitPrice', 'naverPrice', 'kbPrice', 'fieldPrice', 'specialNotes',
            'finalScore', 'inspectionDate'
        ];
        
        inspectionFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = '';
            }
        });
        
        console.log('모든 폼 초기화 완료');
    }
};

// 간단한 테스트 함수들
window.simpleTest = {
    // 전체 테스트
    runFullTest() {
        console.log('=== 간단한 저장/불러오기 테스트 시작 ===');
        
        // 1. 매물 추가
        const testProperty = {
            name: '테스트 매물',
            caseNumber: 'TEST001',
            type: '아파트',
            location: '서울시 강남구'
        };
        
        const addedProperty = window.simpleStorage.addProperty(testProperty);
        console.log('매물 추가 결과:', addedProperty);
        
        if (addedProperty) {
            // 2. 폼 데이터 수집
            const formData = window.simpleFormManager.collectAllFormData();
            console.log('폼 데이터 수집 결과:', formData);
            
            // 3. 매물 데이터 저장
            const saveResult = window.simpleStorage.savePropertyData(0, formData);
            console.log('매물 데이터 저장 결과:', saveResult);
            
            // 4. 매물 데이터 로드
            const loadedData = window.simpleStorage.loadPropertyData(0);
            console.log('매물 데이터 로드 결과:', loadedData);
            
            // 5. 폼에 로드
            const loadResult = window.simpleFormManager.loadFormData(loadedData);
            console.log('폼 로드 결과:', loadResult);
            
            console.log('=== 테스트 완료 ===');
            return saveResult && loadResult;
        }
        
        return false;
    },
    
    // 저장 테스트
    testSave() {
        console.log('=== 저장 테스트 ===');
        const formData = window.simpleFormManager.collectAllFormData();
        const result = window.simpleStorage.savePropertyData(0, formData);
        console.log('저장 결과:', result);
        return result;
    },
    
    // 불러오기 테스트
    testLoad() {
        console.log('=== 불러오기 테스트 ===');
        const loadedData = window.simpleStorage.loadPropertyData(0);
        const result = window.simpleFormManager.loadFormData(loadedData);
        console.log('불러오기 결과:', result);
        return result;
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('SimpleStorage 초기화 시작');
    window.simpleStorage.init();
    console.log('SimpleStorage 준비 완료');
});

console.log('간단한 저장/불러오기 시스템이 로드되었습니다:');
console.log('- simpleStorage: 저장소 관리');
console.log('- simpleFormManager: 폼 데이터 관리');
console.log('- simpleTest.runFullTest(): 전체 테스트');
console.log('- simpleTest.testSave(): 저장 테스트');
console.log('- simpleTest.testLoad(): 불러오기 테스트');
