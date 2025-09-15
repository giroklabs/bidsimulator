/**
 * 폼 데이터 관리자
 * 경매 정보, 물건조사, 시뮬레이션 결과를 안정적으로 저장/불러오기
 */
class FormDataManager {
    constructor() {
        this.formSections = {
            auction: [
                'caseNumber', 'propertyLocation', 'propertyType', 'court', 'auctionDate',
                'auctionStatus', 'bidPrice', 'marketPrice', 'appraisalPrice', 'minimumBid',
                'renovationCost', 'competitorCount', 'marketCondition', 'urgency',
                'auctionType', 'failedCount', 'regionSelect', 'districtSelect'
            ],
            auctionResult: [
                'auctionDate', 'winningBid', 'secondBidDifference', 'marketRatio', 'auctionResultMemo'
            ],
            inspection: [
                'preservationRegistry', 'buildingAge', 'meters', 'mailCheck', 'slope',
                'lightingDirection', 'structureFloor', 'parking', 'waterLeakage',
                'unpaidUtilities', 'gasType', 'gasUnpaid', 'residentsCheck',
                'currentResidents', 'busRoutes', 'subway', 'shopping', 'schools',
                'molitPrice', 'naverPrice', 'kbPrice', 'fieldPrice', 'specialNotes',
                'finalScore', 'inspectionDate'
            ],
            simulation: [
                'targetProfitRate'
            ]
        };
    }

    /**
     * 모든 폼 데이터 수집
     */
    collectAllFormData() {
        const data = {
            auctionInfo: this.collectSectionData('auction'),
            auctionResult: this.collectSectionData('auctionResult'),
            inspectionData: this.collectSectionData('inspection'),
            simulationResult: this.collectSimulationData(),
            saleRateInfo: this.collectSaleRateInfo(),
            timestamp: new Date().toISOString()
        };

        console.log('폼 데이터 수집 완료:', data);
        return data;
    }

    /**
     * 특정 섹션의 데이터 수집
     */
    collectSectionData(sectionName) {
        const fields = this.formSections[sectionName];
        if (!fields) {
            console.warn(`알 수 없는 섹션: ${sectionName}`);
            return {};
        }

        const data = {};
        fields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element) {
                data[fieldName] = element.value || '';
            } else {
                console.warn(`요소를 찾을 수 없음: ${fieldName}`);
            }
        });

        return data;
    }

    /**
     * 시뮬레이션 결과 데이터 수집
     */
    collectSimulationData() {
        const simulationSection = document.querySelector('.simulation-results-section');
        if (!simulationSection || simulationSection.style.display === 'none') {
            return {};
        }

        const data = {};
        
        // 시뮬레이션 결과 텍스트 수집
        const resultElements = simulationSection.querySelectorAll('.result-item');
        resultElements.forEach(element => {
            const label = element.querySelector('.result-label');
            const value = element.querySelector('.result-value');
            if (label && value) {
                const key = label.textContent.replace(/[^\w가-힣]/g, '');
                data[key] = value.textContent || '';
            }
        });

        // 차트 데이터 수집 (있다면)
        if (window.auctionSimulator && window.auctionSimulator.chart) {
            data.chartData = window.auctionSimulator.chart.data;
        }

        return data;
    }

    /**
     * 매각가율 정보 수집
     */
    collectSaleRateInfo() {
        const data = {};
        
        const saleRateValue = document.getElementById('saleRateValue');
        const saleRatePercent = document.getElementById('saleRatePercent');
        const investmentRecommendation = document.getElementById('investmentRecommendation');
        
        if (saleRateValue) {
            data.saleRateValue = saleRateValue.textContent || '-';
        }
        if (saleRatePercent) {
            data.saleRatePercent = saleRatePercent.textContent || '-';
        }
        if (investmentRecommendation) {
            data.investmentRecommendation = investmentRecommendation.textContent || '-';
        }
        
        return data;
    }

    /**
     * 폼에 데이터 로드
     */
    loadFormData(data) {
        if (!data) {
            console.warn('로드할 데이터가 없습니다.');
            return false;
        }

        try {
            // 경매 정보 로드
            if (data.auctionInfo) {
                this.loadSectionData('auction', data.auctionInfo);
            }

            // 경매 결과 데이터 로드
            if (data.auctionResult) {
                this.loadSectionData('auctionResult', data.auctionResult);
            }

            // 물건조사 데이터 로드
            if (data.inspectionData) {
                this.loadSectionData('inspection', data.inspectionData);
            }

            // 시뮬레이션 결과 로드
            if (data.simulationResult) {
                this.loadSimulationData(data.simulationResult);
            }

            // 매각가율 정보 로드
            if (data.saleRateInfo) {
                this.loadSaleRateInfo(data.saleRateInfo);
            }

            // 지역 선택 정보 복원
            if (data.auctionInfo) {
                this.restoreRegionSelection(data.auctionInfo);
            }

            console.log('폼 데이터 로드 완료');
            return true;
        } catch (error) {
            console.error('폼 데이터 로드 실패:', error);
            return false;
        }
    }

    /**
     * 특정 섹션에 데이터 로드
     */
    loadSectionData(sectionName, data) {
        const fields = this.formSections[sectionName];
        if (!fields || !data) {
            return;
        }

        fields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && data.hasOwnProperty(fieldName)) {
                element.value = data[fieldName] || '';
            }
        });
    }

    /**
     * 시뮬레이션 결과 로드
     */
    loadSimulationData(data) {
        if (!data || Object.keys(data).length === 0) {
            return;
        }

        // 시뮬레이션 결과 섹션 표시
        const simulationSection = document.querySelector('.simulation-results-section');
        if (simulationSection) {
            simulationSection.style.display = 'block';
        }

        // 결과 텍스트 업데이트
        const resultElements = simulationSection.querySelectorAll('.result-item');
        resultElements.forEach(element => {
            const label = element.querySelector('.result-label');
            const value = element.querySelector('.result-value');
            if (label && value) {
                const key = label.textContent.replace(/[^\w가-힣]/g, '');
                if (data[key]) {
                    value.textContent = data[key];
                }
            }
        });
    }

    /**
     * 매각가율 정보 로드
     */
    loadSaleRateInfo(data) {
        if (!data) {
            return;
        }
        
        const saleRateValue = document.getElementById('saleRateValue');
        const saleRatePercent = document.getElementById('saleRatePercent');
        const investmentRecommendation = document.getElementById('investmentRecommendation');
        
        if (saleRateValue && data.saleRateValue) {
            saleRateValue.textContent = data.saleRateValue;
        }
        if (saleRatePercent && data.saleRatePercent) {
            saleRatePercent.textContent = data.saleRatePercent;
        }
        if (investmentRecommendation && data.investmentRecommendation) {
            investmentRecommendation.textContent = data.investmentRecommendation;
        }
        
        // 매각가율 정보 섹션 표시
        const saleRateInfo = document.getElementById('saleRateInfo');
        if (saleRateInfo && (data.saleRateValue !== '-' || data.saleRatePercent !== '-')) {
            saleRateInfo.style.display = 'block';
        }
    }

    /**
     * 지역 선택 정보 복원
     */
    restoreRegionSelection(auctionInfo) {
        if (!auctionInfo) return;
        
        // 지역 선택 복원
        if (auctionInfo.regionSelect) {
            const regionSelect = document.getElementById('regionSelect');
            if (regionSelect) {
                regionSelect.value = auctionInfo.regionSelect;
                
                // 지역 변경 이벤트 트리거하여 구/군 옵션 업데이트
                if (window.auctionSimulator) {
                    window.auctionSimulator.onRegionChange();
                    
                    // 구/군 선택 복원 (약간의 지연 후)
                    setTimeout(() => {
                        if (auctionInfo.districtSelect) {
                            const districtSelect = document.getElementById('districtSelect');
                            if (districtSelect) {
                                districtSelect.value = auctionInfo.districtSelect;
                            }
                        }
                    }, 100);
                }
            }
        }
    }

    /**
     * 폼 초기화
     */
    resetAllForms() {
        Object.keys(this.formSections).forEach(sectionName => {
            this.resetSection(sectionName);
        });

        // 시뮬레이션 결과 숨기기
        const simulationSection = document.querySelector('.simulation-results-section');
        if (simulationSection) {
            simulationSection.style.display = 'none';
        }

        console.log('모든 폼 초기화 완료');
    }

    /**
     * 특정 섹션 초기화
     */
    resetSection(sectionName) {
        const fields = this.formSections[sectionName];
        if (!fields) {
            return;
        }

        fields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element) {
                element.value = '';
            }
        });
    }

    /**
     * 폼 유효성 검사
     */
    validateForm() {
        const errors = [];

        // 필수 필드 검사
        const requiredFields = ['caseNumber', 'propertyLocation', 'propertyType'];
        requiredFields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && !element.value.trim()) {
                errors.push(`${fieldName}은(는) 필수 입력 항목입니다.`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// 전역 인스턴스 생성
window.formDataManager = new FormDataManager();
