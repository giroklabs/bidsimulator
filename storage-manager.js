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
        try {
            const data = JSON.parse(jsonString);
            this.currentData = {
                properties: data.properties || [],
                currentPropertyIndex: data.currentPropertyIndex || -1,
                lastSaved: new Date().toISOString()
            };
            return this.saveData();
        } catch (error) {
            console.error('데이터 복원 실패:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
window.storageManager = new StorageManager();
