/**
 * 안정적인 데이터 저장/불러오기 관리자
 * 간단하고 신뢰할 수 있는 localStorage 기반 시스템
 */
class StorageManager {
    constructor() {
        this.storageKey = 'auctionSimulatorData';
        this.currentData = this.loadData();
    }

    /**
     * 전체 데이터 로드
     */
    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                return {
                    properties: parsed.properties || [],
                    currentPropertyIndex: parsed.currentPropertyIndex || -1,
                    lastSaved: parsed.lastSaved || null
                };
            }
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        }
        
        return {
            properties: [],
            currentPropertyIndex: -1,
            lastSaved: null
        };
    }

    /**
     * 전체 데이터 저장
     */
    saveData() {
        try {
            this.currentData.lastSaved = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentData));
            console.log('데이터 저장 완료:', this.currentData);
            return true;
        } catch (error) {
            console.error('데이터 저장 실패:', error);
            return false;
        }
    }

    /**
     * 매물 목록 가져오기
     */
    getProperties() {
        return this.currentData.properties || [];
    }

    /**
     * 매물 추가
     */
    addProperty(property) {
        if (!this.currentData.properties) {
            this.currentData.properties = [];
        }
        
        const newProperty = {
            id: Date.now(),
            ...property,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.currentData.properties.push(newProperty);
        return this.saveData() ? newProperty : null;
    }

    /**
     * 매물 업데이트
     */
    updateProperty(index, property) {
        if (!this.currentData.properties || !this.currentData.properties[index]) {
            return false;
        }
        
        this.currentData.properties[index] = {
            ...this.currentData.properties[index],
            ...property,
            updatedAt: new Date().toISOString()
        };
        
        return this.saveData();
    }

    /**
     * 매물 삭제
     */
    deleteProperty(index) {
        if (!this.currentData.properties || !this.currentData.properties[index]) {
            return false;
        }
        
        this.currentData.properties.splice(index, 1);
        
        // 현재 선택된 매물이 삭제된 경우 선택 해제
        if (this.currentData.currentPropertyIndex === index) {
            this.currentData.currentPropertyIndex = -1;
        } else if (this.currentData.currentPropertyIndex > index) {
            this.currentData.currentPropertyIndex--;
        }
        
        return this.saveData();
    }

    /**
     * 현재 선택된 매물 인덱스 설정
     */
    setCurrentPropertyIndex(index) {
        this.currentData.currentPropertyIndex = index;
        this.saveData();
    }

    /**
     * 현재 선택된 매물 인덱스 가져오기
     */
    getCurrentPropertyIndex() {
        return this.currentData.currentPropertyIndex;
    }

    /**
     * 현재 선택된 매물 가져오기
     */
    getCurrentProperty() {
        const index = this.getCurrentPropertyIndex();
        if (index >= 0 && this.currentData.properties[index]) {
            return this.currentData.properties[index];
        }
        return null;
    }

    /**
     * 매물별 상세 데이터 저장
     */
    savePropertyData(propertyIndex, data) {
        const property = this.currentData.properties[propertyIndex];
        if (!property) {
            return false;
        }
        
        property.data = {
            auctionInfo: data.auctionInfo || {},
            inspectionData: data.inspectionData || {},
            simulationResult: data.simulationResult || {},
            saleRateInfo: data.saleRateInfo || {},
            lastSaved: new Date().toISOString()
        };
        
        return this.saveData();
    }

    /**
     * 매물별 상세 데이터 로드
     */
    loadPropertyData(propertyIndex) {
        const property = this.currentData.properties[propertyIndex];
        if (!property || !property.data) {
            return null;
        }
        
        return property.data;
    }

    /**
     * 전체 데이터 초기화
     */
    clearAllData() {
        this.currentData = {
            properties: [],
            currentPropertyIndex: -1,
            lastSaved: null
        };
        return this.saveData();
    }

    /**
     * 데이터 백업 (JSON 문자열로 반환)
     */
    exportData() {
        return JSON.stringify(this.currentData, null, 2);
    }

    /**
     * 데이터 복원 (JSON 문자열에서 복원)
     */
    importData(jsonString) {
        console.log('=== StorageManager 데이터 복원 시작 ===');
        console.log('입력된 JSON 문자열:', jsonString);
        
        try {
            if (!jsonString || jsonString.trim() === '') {
                console.error('❌ 빈 JSON 문자열');
                return false;
            }
            
            const data = JSON.parse(jsonString);
            console.log('파싱된 데이터:', data);
            
            // 데이터 유효성 검사
            if (!data || typeof data !== 'object') {
                console.error('❌ 유효하지 않은 데이터 형식');
                return false;
            }
            
            // 기존 데이터 백업
            const oldData = { ...this.currentData };
            console.log('기존 데이터 백업:', oldData);
            
            // 새 데이터 설정
            this.currentData = {
                properties: data.properties || [],
                currentPropertyIndex: data.currentPropertyIndex !== undefined ? data.currentPropertyIndex : -1,
                lastSaved: new Date().toISOString()
            };
            
            console.log('새로 설정된 데이터:', this.currentData);
            console.log('복원된 매물 개수:', this.currentData.properties.length);
            
            // localStorage에 저장
            const saveResult = this.saveData();
            console.log('localStorage 저장 결과:', saveResult);
            
            if (saveResult) {
                console.log('✅ 데이터 복원 성공');
                
                // 복원된 매물 목록 로그
                this.currentData.properties.forEach((property, index) => {
                    console.log(`매물 ${index}:`, {
                        caseNumber: property.caseNumber,
                        name: property.name,
                        type: property.type,
                        location: property.location
                    });
                });
                
                return true;
            } else {
                console.error('❌ localStorage 저장 실패');
                // 원래 데이터로 복원
                this.currentData = oldData;
                return false;
            }
            
        } catch (error) {
            console.error('❌ 데이터 복원 실패:', error);
            console.error('오류 상세:', {
                message: error.message,
                stack: error.stack,
                inputLength: jsonString ? jsonString.length : 0
            });
            return false;
        }
    }

    /**
     * 모든 매물 데이터 초기화
     */
    clearAllProperties() {
        console.log('=== 모든 매물 데이터 초기화 시작 ===');
        
        try {
            // 기본 매물 데이터 초기화
            this.currentData = {
                properties: [],
                currentPropertyIndex: -1,
                lastSaved: new Date().toISOString()
            };
            
            // localStorage에 저장
            const saveResult = this.saveData();
            console.log('기본 매물 데이터 초기화 결과:', saveResult);
            
            // 매물별 상세 데이터도 초기화
            this.clearAllPropertyDetails();
            
            console.log('✅ 모든 매물 데이터 초기화 완료');
            return true;
            
        } catch (error) {
            console.error('❌ 매물 데이터 초기화 오류:', error);
            return false;
        }
    }

    /**
     * 모든 매물별 상세 데이터 초기화
     */
    clearAllPropertyDetails() {
        console.log('=== 매물별 상세 데이터 초기화 시작 ===');
        
        try {
            // localStorage에서 property_all_ 키들을 찾아서 삭제
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('property_all_')) {
                    keysToRemove.push(key);
                }
            }
            
            console.log('삭제할 상세 데이터 키들:', keysToRemove);
            
            // 키들 삭제
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`삭제됨: ${key}`);
            });
            
            console.log(`✅ ${keysToRemove.length}개의 매물별 상세 데이터 초기화 완료`);
            
        } catch (error) {
            console.error('❌ 매물별 상세 데이터 초기화 오류:', error);
        }
    }
}

// 전역 인스턴스 생성
window.storageManager = new StorageManager();
