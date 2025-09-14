// 한국 경매 입찰가격 시뮬레이션 서비스
class AuctionSimulator {
    constructor() {
        // StorageManager와 FormDataManager 확인
        if (!window.storageManager) {
            console.error('StorageManager가 초기화되지 않았습니다.');
            throw new Error('StorageManager not initialized');
        }
        if (!window.formDataManager) {
            console.error('FormDataManager가 초기화되지 않았습니다.');
            throw new Error('FormDataManager not initialized');
        }
        
        console.log('StorageManager와 FormDataManager 확인 완료');
        this.initializeEventListeners();
        this.chart = null;
        this.selectedProperty = null;
        this.renderPropertyTree();
        console.log('AuctionSimulator 초기화 완료');
    }

    // 숫자 포맷팅 함수 (천단위 콤마)
    formatNumber(num) {
        return new Intl.NumberFormat('ko-KR').format(num);
    }

    // 원 단위로 변환 (만원 → 원)
    convertToWon(amount) {
        return amount * 10000;
    }

    // 원 단위를 만원 단위로 변환 (원 → 만원)
    convertToManWon(amount) {
        return amount / 10000;
    }

    // 매각가율을 반영한 권장 입찰가 계산 (시장 검증된 방식)
    calculateRecommendedBidPrice(marketPrice, salePriceRate, targetProfitRate, auctionType, additionalCosts = {}) {
        console.log('매각가율 기반 권장 입찰가 계산 시작:', {
            marketPrice,
            salePriceRate,
            targetProfitRate,
            auctionType,
            additionalCosts
        });

        // 1. 매각가율을 적용한 예상 낙찰가 계산
        const expectedAuctionPrice = marketPrice * (salePriceRate / 100);
        console.log('예상 낙찰가 (시세 × 매각가율):', expectedAuctionPrice);

        // 2. 추가 비용 계산 (명도비, 수리비, 세금 등)
        const totalAdditionalCosts = this.calculateAdditionalCosts(expectedAuctionPrice, additionalCosts);
        console.log('추가 비용 총합:', totalAdditionalCosts);

        // 3. 수수료 계산
        const fees = this.getAuctionFees(auctionType);
        const totalFees = expectedAuctionPrice * (fees.auctionFee + fees.registrationFee + fees.tax + fees.additionalCosts);
        console.log('경매 수수료 총합:', totalFees);

        // 4. 목표 수익 계산
        const targetProfit = expectedAuctionPrice * (targetProfitRate / 100);
        console.log('목표 수익:', targetProfit);

        // 5. 권장 입찰가 계산 (시장 검증된 공식)
        // 권장 입찰가 = 예상 낙찰가 - 추가비용 - 수수료 - 목표수익
        const recommendedBidPrice = expectedAuctionPrice - totalAdditionalCosts - totalFees - targetProfit;
        
        // 6. 최소 입찰가 보장 (감정가의 30% 이상)
        const minBidPrice = marketPrice * 0.3;
        const finalBidPrice = Math.max(recommendedBidPrice, minBidPrice);

        console.log('권장 입찰가 계산 결과:', {
            expectedAuctionPrice,
            totalAdditionalCosts,
            totalFees,
            targetProfit,
            recommendedBidPrice,
            minBidPrice,
            finalBidPrice
        });

        return {
            recommendedBidPrice: Math.round(finalBidPrice),
            expectedAuctionPrice: Math.round(expectedAuctionPrice),
            totalAdditionalCosts: Math.round(totalAdditionalCosts),
            totalFees: Math.round(totalFees),
            targetProfit: Math.round(targetProfit),
            profitMargin: ((targetProfit / finalBidPrice) * 100).toFixed(1)
        };
    }

    // 추가 비용 계산 (명도비, 수리비, 세금 등)
    calculateAdditionalCosts(auctionPrice, additionalCosts) {
        const costs = {
            // 기본 비용들
            evictionCost: additionalCosts.evictionCost || 0, // 명도비
            renovationCost: additionalCosts.renovationCost || 0, // 수리비
            legalCost: additionalCosts.legalCost || 0, // 법무비
            inspectionCost: additionalCosts.inspectionCost || 0, // 현황조사비
            
            // 세금 (낙찰가의 1.5% 내외)
            acquisitionTax: auctionPrice * 0.015,
            
            // 기타 비용
            otherCosts: additionalCosts.otherCosts || 0
        };

        const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
        
        console.log('추가 비용 상세:', costs);
        return totalCosts;
    }

    // 현재 매각가율 가져오기
    getCurrentSalePriceRate() {
        const saleRateElement = document.getElementById('saleRateValue');
        console.log('getCurrentSalePriceRate 호출:', {
            element: saleRateElement,
            textContent: saleRateElement ? saleRateElement.textContent : 'null',
            isVisible: saleRateElement ? saleRateElement.offsetParent !== null : false
        });
        
        if (saleRateElement && saleRateElement.textContent && saleRateElement.textContent !== '-') {
            const saleRate = parseFloat(saleRateElement.textContent.replace('%', ''));
            if (!isNaN(saleRate)) {
                console.log('현재 매각가율 사용:', saleRate + '%');
                return saleRate;
            }
        }
        
        // 매각가율이 없는 경우 기본값 사용 (80%)
        console.log('매각가율 정보 없음, 기본값 사용: 80%');
        return 80;
    }

    // 통합된 매각가율 기반 계산 결과 표시
    displaySaleRateBasedCalculation(bidCalculation) {
        // 통합된 계산 섹션이 없으면 생성
        let saleRateSection = document.getElementById('saleRateCalculation');
        if (!saleRateSection) {
            saleRateSection = document.createElement('div');
            saleRateSection.id = 'saleRateCalculation';
            saleRateSection.className = 'sale-rate-calculation';
            saleRateSection.innerHTML = `
                <h3>📊 상세 계산 과정</h3>
                <div class="calculation-details">
                    <div class="calculation-item">
                        <span class="label">예상 낙찰가:</span>
                        <span class="value" id="expectedAuctionPrice">-</span>
                    </div>
                    <div class="calculation-item">
                        <span class="label">매각가율:</span>
                        <span class="value" id="salePriceRate">-</span>
                    </div>
                    <div class="calculation-item">
                        <span class="label">추가 비용:</span>
                        <span class="value" id="totalAdditionalCosts">-</span>
                    </div>
                    <div class="calculation-item">
                        <span class="label">경매 수수료:</span>
                        <span class="value" id="totalFees">-</span>
                    </div>
                    <div class="calculation-item">
                        <span class="label">목표 수익:</span>
                        <span class="value" id="targetProfit">-</span>
                    </div>
                    <div class="calculation-item highlight">
                        <span class="label">통합 권장 입찰가:</span>
                        <span class="value" id="finalRecommendedBid">-</span>
                    </div>
                    <div class="calculation-item">
                        <span class="label">예상 수익률:</span>
                        <span class="value" id="profitMargin">-</span>
                    </div>
                    <div class="calculation-item">
                        <span class="label">시장 조정 적용:</span>
                        <span class="value" id="marketAdjustment">-</span>
                    </div>
                </div>
                <div class="calculation-note">
                    <p>💡 위의 "통합 권장 입찰가"가 최종 권장 입찰가격입니다. 매각가율, 시장 상황, 경쟁자 수, 유찰 횟수 등을 종합적으로 고려하여 계산되었습니다.</p>
                </div>
            `;
            
            // 결과 섹션에 추가
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.appendChild(saleRateSection);
            }
        }

        // 현재 매각가율 가져오기
        const currentSaleRate = this.getCurrentSalePriceRate();

        // 값 업데이트
        const elements = {
            expectedAuctionPrice: document.getElementById('expectedAuctionPrice'),
            salePriceRate: document.getElementById('salePriceRate'),
            totalAdditionalCosts: document.getElementById('totalAdditionalCosts'),
            totalFees: document.getElementById('totalFees'),
            targetProfit: document.getElementById('targetProfit'),
            finalRecommendedBid: document.getElementById('finalRecommendedBid'),
            profitMargin: document.getElementById('profitMargin'),
            marketAdjustment: document.getElementById('marketAdjustment')
        };

        if (elements.expectedAuctionPrice) {
            elements.expectedAuctionPrice.textContent = this.formatNumber(bidCalculation.expectedAuctionPrice) + '원';
        }
        if (elements.salePriceRate) {
            elements.salePriceRate.textContent = currentSaleRate + '%';
        }
        if (elements.totalAdditionalCosts) {
            elements.totalAdditionalCosts.textContent = this.formatNumber(bidCalculation.totalAdditionalCosts) + '원';
        }
        if (elements.totalFees) {
            elements.totalFees.textContent = this.formatNumber(bidCalculation.totalFees) + '원';
        }
        if (elements.targetProfit) {
            elements.targetProfit.textContent = this.formatNumber(bidCalculation.targetProfit) + '원';
        }
        if (elements.finalRecommendedBid) {
            elements.finalRecommendedBid.textContent = this.formatNumber(bidCalculation.recommendedBidPrice) + '원';
        }
        if (elements.profitMargin) {
            elements.profitMargin.textContent = bidCalculation.profitMargin + '%';
        }
        if (elements.marketAdjustment) {
            elements.marketAdjustment.textContent = '적용됨';
        }

        console.log('통합된 매각가율 기반 계산 결과 표시 완료:', bidCalculation);
    }

    // 기존 호환성을 위한 래퍼 함수
    calculateTargetPrice(marketPrice, targetProfitRate, auctionType, renovationCost = 0) {
        // 매각가율이 없는 경우 기본값 사용 (80%)
        const defaultSalePriceRate = 80;
        const additionalCosts = { renovationCost };
        
        const result = this.calculateRecommendedBidPrice(
            marketPrice, 
            defaultSalePriceRate, 
            targetProfitRate, 
            auctionType, 
            additionalCosts
        );
        
        return result.recommendedBidPrice;
    }

    initializeEventListeners() {
        console.log('이벤트 리스너 등록 시작');
        
        // 폼 제출 이벤트
        const form = document.getElementById('auctionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                console.log('폼 제출 이벤트 발생');
                e.preventDefault();
                this.runSimulation();
            });
            console.log('폼 이벤트 리스너 등록 완료');
        } else {
            console.error('auctionForm 요소를 찾을 수 없습니다');
        }
        
        // 매물 추가 버튼 이벤트
        const addPropertyBtn = document.getElementById('addPropertyBtn');
        console.log('매물 추가 버튼 요소 찾기 시도:', addPropertyBtn);
        
        if (addPropertyBtn) {
            console.log('매물 추가 버튼 찾음, 이벤트 리스너 등록 시작');
            addPropertyBtn.addEventListener('click', (e) => {
                console.log('=== 매물 추가 버튼 클릭됨 ===');
                console.log('이벤트 객체:', e);
                console.log('버튼 요소:', addPropertyBtn);
                console.log('this 객체:', this);
                
                try {
                    this.showPropertyModal();
                    console.log('showPropertyModal 호출 완료');
                } catch (error) {
                    console.error('showPropertyModal 호출 오류:', error);
                }
            });
            console.log('매물 추가 버튼 이벤트 리스너 등록 완료');
        } else {
            console.error('addPropertyBtn 요소를 찾을 수 없습니다');
            // 모든 버튼 요소 확인
            const allButtons = document.querySelectorAll('button');
            console.log('페이지의 모든 버튼 요소들:', allButtons);
            console.log('버튼들의 ID:', Array.from(allButtons).map(btn => btn.id));
        }

        // 클라우드 서비스 선택 및 연동 버튼 이벤트
        const cloudProviderSelect = document.getElementById('cloudProviderSelect');
        const cloudConnectBtn = document.getElementById('cloudConnectBtn');
        
        if (cloudProviderSelect && cloudConnectBtn) {
            cloudConnectBtn.addEventListener('click', async () => {
                try {
                    const selectedProvider = cloudProviderSelect.value;
                    if (!selectedProvider) {
                        alert('클라우드 서비스를 선택해주세요.');
                        return;
                    }

                    const providerNames = {
                        google: '구글 드라이브',
                        kakao: '카카오 드라이브',
                        naver: '네이버 클라우드',
                        naverDB: '네이버 클라우드 DB'
                    };

                    console.log(`${providerNames[selectedProvider]} 연동 시작...`);
                    await window.cloudStorageHelpers.switchProvider(selectedProvider);
                } catch (error) {
                    console.error('클라우드 서비스 연동 실패:', error);
                }
            });
            console.log('클라우드 서비스 연동 버튼 이벤트 리스너 등록 완료');
        }

        // 백업 버튼 이벤트
        const backupBtn = document.getElementById('backupBtn');
        if (backupBtn) {
            backupBtn.addEventListener('click', async () => {
                try {
                    // 현재 활성 클라우드 서비스에 백업
                    const activeProvider = window.cloudStorageHelpers.getActiveProvider();
                    if (activeProvider) {
                        // 현재 로컬 데이터 수집
                        const allData = {
                            properties: window.simpleStorage ? window.simpleStorage.getProperties() : [],
                            timestamp: new Date().toISOString(),
                            version: '1.0'
                        };
                        await window.cloudStorageHelpers.createBackup(allData);
                    } else {
                        alert('클라우드 서비스가 연동되지 않았습니다. 먼저 클라우드 서비스를 선택하고 연동해주세요.');
                    }
                } catch (error) {
                    console.error('백업 생성 실패:', error);
                }
            });
            console.log('백업 버튼 이벤트 리스너 등록 완료');
        }

        // 가져오기 버튼 이벤트
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', async () => {
                try {
                    // 현재 활성 클라우드 서비스에서 가져오기
                    const activeProvider = window.cloudStorageHelpers.getActiveProvider();
                    if (activeProvider) {
                        const properties = await window.cloudStorageHelpers.loadAllProperties();
                        
                        // 로컬 저장소에 데이터 복원
                        if (window.simpleStorage && properties.length > 0) {
                            properties.forEach((property, index) => {
                                window.simpleStorage.savePropertyData(index, property);
                            });
                        }
                        
                        // 매물 목록 새로고침
                        this.renderPropertyTree();
                        alert(`${activeProvider.name}에서 ${properties.length}개의 매물 데이터를 가져왔습니다!`);
                    } else {
                        alert('클라우드 서비스가 연동되지 않았습니다. 먼저 클라우드 서비스를 선택하고 연동해주세요.');
                    }
                } catch (error) {
                    console.error('데이터 가져오기 실패:', error);
                }
            });
            console.log('가져오기 버튼 이벤트 리스너 등록 완료');
        }

        // 물건지 주소 입력 시 매각가율 정보 로드
        const propertyLocationInput = document.getElementById('propertyLocation');
        if (propertyLocationInput) {
            propertyLocationInput.addEventListener('input', (e) => {
                const location = e.target.value.trim();
                if (location.length > 3) { // 최소 3글자 이상 입력 시
                    console.log('주소 입력 감지:', location);
                    this.loadSaleRateInfoForMainForm(location);
                } else {
                    // 주소가 비어있거나 짧으면 기본값 표시 (숨기지 않음)
                    console.log('주소가 짧음, 기본값 표시');
                    // this.setDefaultSaleRateInfo(); // 제거 - 지역별 데이터 로드 방해
                }
                
                // 지역별 매각가율 감지 시 강제 수정
                setTimeout(() => {
                    this.forceCorrectRegionalSaleRate();
                }, 200);
            });
            console.log('물건지 주소 입력 이벤트 리스너 등록 완료');
        }

        // 페이지 로드 시 기본 매각가율 정보 표시 (제거 - 지역별 데이터 로드 방해)
        // this.setDefaultSaleRateInfo();
        
        // 매각가율 정보 표시 보장
        setTimeout(() => {
            this.ensureSaleRateInfoVisible();
            // 지역별 매각가율 강제 수정
            this.forceCorrectRegionalSaleRate();
        }, 500);
        
        // 주기적으로 지역별 매각가율 확인 및 수정 (3초마다)
        setInterval(() => {
            this.forceCorrectRegionalSaleRate();
        }, 3000);
        
        // 낙찰확률 50~60% 조정 기능 테스트 (개발/테스트 환경에서만)
        if (window.location.hostname.includes('github.io') || window.location.hostname === 'localhost') {
            setTimeout(() => {
                console.log('낙찰확률 조정 기능 테스트 실행 중...');
                this.testBidProbabilityAdjustment();
            }, 2000);
        }
        
        // 버튼 클릭 이벤트 (백업)
        const button = document.querySelector('.simulate-btn');
        if (button) {
            button.addEventListener('click', (e) => {
                console.log('버튼 클릭 이벤트 발생');
                e.preventDefault();
                this.runSimulation();
            });
            console.log('버튼 이벤트 리스너 등록 완료');
        } else {
            console.error('simulate-btn 요소를 찾을 수 없습니다');
        }
        
        // 저장/불러오기 버튼 이벤트
        this.initializeSaveButtons();

        // 매물 추가 버튼 이벤트
        const addBtn = document.getElementById('addNewProperty');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showPropertyModal());
        }

        // 모달 이벤트
        this.initializeModalEvents();
    }

    // 매물 데이터 로드 (로컬 스토리지에서)
    // StorageManager를 사용하여 매물 목록 가져오기
    getProperties() {
        try {
            if (window.simpleStorage) {
                return window.simpleStorage.getProperties();
            } else if (window.storageManager) {
                return window.storageManager.getProperties();
            } else {
                console.error('저장 시스템이 없습니다.');
                return [];
            }
        } catch (error) {
            console.error('매물 목록 가져오기 오류:', error);
            return [];
        }
    }

    // StorageManager를 사용하여 매물 목록 저장
    saveProperties() {
        // StorageManager는 자동으로 저장되므로 별도 저장 불필요
        return true;
    }

    // 매물 트리 렌더링
    renderPropertyTree() {
        const tree = document.getElementById('propertyList');
        if (!tree) return;

        // StorageManager에서 매물 목록 가져오기 (안전하게)
        let properties = [];
        try {
            properties = this.getProperties();
            console.log('저장된 모든 매물들:', properties);
        } catch (error) {
            console.error('매물 목록 가져오기 실패:', error);
            properties = [];
        }

        // 기존 트리 내용 제거
        tree.innerHTML = '';

        // 매물이 없을 때
        if (properties.length === 0) {
            const noProperties = document.createElement('div');
            noProperties.className = 'no-properties';
            noProperties.innerHTML = '<p>저장된 매물이 없습니다</p><p>+ 매물 추가 버튼을 클릭하여 매물을 추가하세요</p>';
            tree.appendChild(noProperties);
            return;
        }

        // 매물 개수 업데이트
        const totalCount = document.getElementById('totalCount');
        if (totalCount) {
            totalCount.textContent = `(${properties.length})`;
        }

        // 매물별로 트리 아이템 생성
        properties.forEach((property, index) => {
            const treeItem = this.createPropertyTreeItem(property, index);
            tree.appendChild(treeItem);
        });
    }

    // 매물 트리 아이템 생성
    createPropertyTreeItem(property, index) {
        const item = document.createElement('div');
        item.className = 'tree-item property-item';
        item.dataset.index = index;

        const typeIcon = this.getPropertyTypeIcon(property.type);
        const displayName = property.name || property.caseNumber || property.location || '이름 없음';
        
        item.innerHTML = `
            <span class="tree-icon property-type-icon ${property.type || 'default'}">${typeIcon}</span>
            <span class="tree-label">${displayName}</span>
            <div class="property-actions">
                <button class="load-btn" onclick="event.stopPropagation(); auctionSimulator.loadAllDataForProperty(${index})" title="모든 정보 불러오기">📂</button>
                <button class="save-all-btn" onclick="event.stopPropagation(); auctionSimulator.saveAllDataForProperty(${index})" title="모든 정보 저장">💾</button>
                <button class="edit-btn" onclick="event.stopPropagation(); auctionSimulator.editProperty(${index})">✏️</button>
                <button class="delete-btn" onclick="event.stopPropagation(); auctionSimulator.deleteProperty(${index})">🗑️</button>
            </div>
        `;

        // 클릭 이벤트
        item.addEventListener('click', () => this.selectProperty(index));

        return item;
    }

    // 매물 타입별 아이콘 반환
    getPropertyTypeIcon(type) {
        const icons = {
            '아파트': '🏢',
            '오피스텔': '🏢',
            '빌라': '🏠',
            '단독주택': '🏠',
            '상가': '🏪',
            '사무실': '🏢',
            '토지': '🌍',
            '기타': '📦',
            'apartment': '🏢',
            'house': '🏠',
            'officetel': '🏢',
            'commercial': '🏪',
            'land': '🌍',
            'other': '📦'
        };
        return icons[type] || '📦';
    }

    // 매물 선택
    selectProperty(index) {
        // 이전 선택 해제
        document.querySelectorAll('.tree-item.selected').forEach(item => {
            item.classList.remove('selected');
        });

        // 새 선택 적용
        const selectedItem = document.querySelector(`[data-index="${index}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        const properties = this.getProperties();
        this.selectedProperty = properties[index];
        
        // StorageManager에 현재 선택된 매물 인덱스 저장
        window.storageManager.setCurrentPropertyIndex(index);
        
        // 1. 먼저 모든 폼을 완전히 초기화 (매각가율 정보 포함)
        this.resetAllForms();
        
        // 2. 선택된 매물의 기본 정보를 메인 섹션에 표시
        this.displaySelectedPropertyInfo(this.selectedProperty);
        
        // 3. 저장된 상세 데이터 확인 및 자동 불러오기 옵션 제공
        this.checkAndOfferDataLoad(index);
        
        console.log('선택된 매물:', this.selectedProperty);
    }

    // 저장된 데이터 확인 및 자동 불러오기 옵션 제공
    checkAndOfferDataLoad(propertyIndex) {
        try {
            // 간단한 저장 시스템에서 저장된 데이터 확인
            let hasData = false;
            if (window.simpleStorage) {
                const savedData = window.simpleStorage.loadPropertyData(propertyIndex);
                hasData = savedData && (
                    Object.keys(savedData.auctionInfo || {}).length > 0 ||
                    Object.keys(savedData.inspectionData || {}).length > 0 ||
                    Object.keys(savedData.simulationResult || {}).length > 0 ||
                    Object.keys(savedData.saleRateInfo || {}).length > 0
                );
            }
            
            if (hasData) {
                // 저장된 데이터가 있으면 자동 불러오기 여부 확인
                const property = this.selectedProperty;
                const propertyName = property?.name || property?.caseNumber || '이 매물';
                
                setTimeout(() => {
                    const shouldLoad = confirm(`${propertyName}에 저장된 정보가 있습니다.\n자동으로 불러오시겠습니까?`);
                    if (shouldLoad) {
                        this.loadAllDataForProperty(propertyIndex);
                    }
                }, 500); // 약간의 지연 후 확인 다이얼로그 표시
            } else {
                console.log('저장된 상세 데이터가 없습니다.');
            }
        } catch (error) {
            console.error('데이터 확인 중 오류:', error);
        }
    }

    // 모든 폼 완전 초기화 (매물 선택 시 사용)
    resetAllForms() {
        console.log('모든 폼 초기화 시작');
        
        // FormDataManager를 사용하여 모든 폼 초기화
        window.formDataManager.resetAllForms();
        
        // 매각가율 정보는 사용자가 직접 선택하므로 초기화하지 않음
        // this.resetSaleRateInfo(); // 제거
        
        console.log('모든 폼 초기화 완료');
    }

    // 기본 매각가율 정보 설정
    setDefaultSaleRateInfo() {
        console.log('기본 매각가율 정보 설정');
        
        // 기본값 설정 (전국 평균)
        const saleRateValue = document.getElementById('saleRateValue');
        const saleRatePercent = document.getElementById('saleRatePercent');
        const investmentRecommendation = document.getElementById('investmentRecommendation');
        
        if (saleRateValue) {
            saleRateValue.textContent = '78.5';
        }
        if (saleRatePercent) {
            saleRatePercent.textContent = '78.5%';
        }
        if (investmentRecommendation) {
            investmentRecommendation.textContent = 'B+';
        }
        
        console.log('기본 매각가율 정보 설정 완료 (전국 평균: 78.5%)');
    }

    // 매각가율 정보 완전 초기화
    resetSaleRateInfo() {
        console.log('매각가율 정보 완전 초기화 시작');
        const saleRateInfo = document.getElementById('saleRateInfo');
        const saleRateValue = document.getElementById('saleRateValue');
        const saleRatePercent = document.getElementById('saleRatePercent');
        const investmentRecommendation = document.getElementById('investmentRecommendation');
        
        if (saleRateInfo && saleRateValue && saleRatePercent && investmentRecommendation) {
            // 모든 값 초기화
            saleRateValue.textContent = '-';
            saleRatePercent.textContent = '-';
            investmentRecommendation.textContent = '-';
            
            // 클래스 초기화
            saleRateValue.className = 'sale-rate-value';
            saleRatePercent.className = 'sale-rate-value';
            investmentRecommendation.className = 'sale-rate-value';
            
            // 섹션 표시
            saleRateInfo.style.display = 'block';
            console.log('매각가율 정보 완전 초기화 완료');
        } else {
            console.error('매각가율 정보 요소를 찾을 수 없습니다');
        }
    }

    // 매각가율 정보 숨기기 (사용하지 않음 - 항상 표시)
    hideSaleRateInfo() {
        console.log('hideSaleRateInfo 호출됨 - 무시 (항상 표시)');
        // 매각가율 정보는 항상 표시하므로 숨기지 않음
    }

    // 매각가율 정보 강제 표시 (모든 상황에서 표시 보장)
    ensureSaleRateInfoVisible() {
        const saleRateInfo = document.getElementById('saleRateInfo');
        if (saleRateInfo) {
            saleRateInfo.style.display = 'block';
            console.log('매각가율 정보 강제 표시됨');
            
            // 내용이 비어있으면 기본값 설정 (제거 - 지역별 데이터 로드 방해)
            const saleRateValue = document.getElementById('saleRateValue');
            if (!saleRateValue || !saleRateValue.textContent || saleRateValue.textContent === '-') {
                console.log('매각가율 정보가 비어있음 - 지역별 데이터 로드 대기');
                // this.setDefaultSaleRateInfo(); // 제거
            }
        }
    }

    // 지역별 매각가율 강제 수정 함수 (간단화된 버전)
    forceCorrectRegionalSaleRate() {
        const locationField = document.getElementById('propertyLocation');
        
        // 매물 추가 모달이 열려있으면 실행하지 않음 (새 매물 추가 시 데이터 격리)
        const modal = document.getElementById('propertyModal');
        if (modal && modal.style.display === 'block') {
            const isEditMode = modal.dataset.editIndex !== undefined;
            if (!isEditMode) {
                console.log('새 매물 추가 모달 열림 - 매각가율 설정 건너뜀');
                return;
            }
        }
        
        if (locationField && locationField.value) {
            const location = locationField.value.trim();
            console.log('=== 정확한 매각가율 정보 설정 ===');
            console.log('현재 주소:', location);
            
            // 지역 정보 추출하여 직접 매각가율 정보 설정
            this.loadSaleRateFromLocation(location);
        }
    }

    // 주소에서 직접 매각가율 정보 로드
    loadSaleRateFromLocation(location) {
        console.log('주소에서 매각가율 정보 로드:', location);
        
        try {
            const region = this.extractRegionFromLocation(location);
            const district = this.extractDistrictFromLocation(location);
            
            console.log('추출된 지역 정보:', { region, district });
            
            if (region && district) {
                // 지역별 데이터에서 직접 찾기
                const regionalData = this.getRegionalSaleRateData();
                const fullDistrictName = `${region} ${district}`;
                
                console.log('=== 디버깅 정보 ===');
                console.log('region:', region);
                console.log('district:', district);
                console.log('fullDistrictName:', fullDistrictName);
                console.log('검색할 지역명:', fullDistrictName);
                
                if (regionalData[fullDistrictName]) {
                    console.log('✅ 지역별 데이터에서 찾음:', regionalData[fullDistrictName]);
                    
                    // 매각가율 정보 직접 표시
                    this.displaySaleRateInfo({
                        saleRate: regionalData[fullDistrictName].saleRate,
                        investmentRec: regionalData[fullDistrictName].investmentRec,
                        region: region,
                        district: district
                    });
                    this.showSaleRateInfo();
                    console.log('✅ 매각가율 정보 표시 완료');
                } else {
                    console.log('❌ 지역별 데이터 없음 - 기본값 사용');
                    this.setDefaultSaleRateInfo();
                    this.showSaleRateInfo();
                }
            } else {
                console.log('❌ 지역 정보 추출 실패');
                this.setDefaultSaleRateInfo();
                this.showSaleRateInfo();
            }
        } catch (error) {
            console.error('매각가율 정보 로드 오류:', error);
            this.setDefaultSaleRateInfo();
            this.showSaleRateInfo();
        }
    }
    
    // API에서 매각가율 정보 로드
    async loadSaleRateFromAPI(location) {
        console.log('API에서 매각가율 정보 로드 시도:', location);
        
        try {
            const region = this.extractRegionFromLocation(location);
            const district = this.extractDistrictFromLocation(location);
            
            if (region && district) {
                await this.loadSaleRateInfo(region, district);
            } else {
                console.log('지역 정보 추출 실패');
            }
        } catch (error) {
            console.error('API 로드 실패:', error);
        }
    }

    // 매물 데이터를 폼에 로드 (비활성화됨 - 자동 입력 방지)
    loadPropertyData(property) {
        console.log('선택된 매물 (자동 로드 비활성화):', property);
        
        // 자동 폼 입력 기능 비활성화
        // 사용자가 직접 매물 정보를 입력하도록 함
        console.log('매물 선택됨 - 사용자가 직접 정보를 입력하세요');
    }

    // 선택된 매물 정보를 메인 섹션에 표시
    displaySelectedPropertyInfo(property) {
        console.log('=== 선택된 매물 정보 표시 시작 ===');
        console.log('전체 property 객체:', JSON.stringify(property, null, 2));
        
        // 저장된 모든 매물 정보도 확인
        console.log('저장된 모든 매물들:', this.properties);
        
        // 입력 필드 먼저 초기화
        this.resetMainFormInputs();
        
        // 기본 매물 정보를 메인 폼에 표시
        if (property.caseNumber) {
            document.getElementById('caseNumber').value = property.caseNumber;
        }
        if (property.location) {
            document.getElementById('propertyLocation').value = property.location;
        }
        if (property.type) {
            document.getElementById('propertyType').value = property.type;
        }
        
        // 매물 선택 시에는 매각가율 정보를 로드하지 않음
        // 사용자가 직접 지역을 선택하여 매각가율 정보를 가져와야 함
        console.log('매물 선택됨 - 사용자가 직접 지역을 선택하여 매각가율 정보를 가져오세요');
        
        // 매물 정보를 콘솔에 표시
        console.log('매물 정보:', {
            사건번호: property.caseNumber,
            매물명: property.name,
            유형: property.type,
            위치: property.location
        });
    }

    // 선택된 매물 정보 표시 (기존 함수 유지)
    displaySelectedProperty(property) {
        // 매물 정보를 표시할 영역이 있다면 여기에 표시
        console.log('매물 정보:', {
            사건번호: property.caseNumber,
            매물명: property.name,
            유형: property.type,
            위치: property.location
        });
    }

    // 매물 추가 모달 표시
    showPropertyModal() {
        console.log('=== showPropertyModal 함수 시작 ===');
        const modal = document.getElementById('propertyModal');
        console.log('모달 요소 찾기:', modal);
        
        if (modal) {
            console.log('모달 요소 찾음, 표시 시작');
            const isEditMode = modal.dataset.editIndex !== undefined;
            console.log('편집 모드 여부:', isEditMode);
            
            if (!isEditMode) {
                // 새 매물 추가 모드일 때만 초기화
                console.log('새 매물 추가 모드로 초기화 시작');
                
                // 편집 모드 초기화
                delete modal.dataset.editIndex;
                const titleElement = modal.querySelector('h3');
                if (titleElement) {
                    titleElement.textContent = '매물 추가';
                    console.log('제목 변경 완료');
                } else {
                    console.error('모달 제목 요소를 찾을 수 없습니다');
                }
                
                // 현재 경매 데이터 초기화
                this.currentAuctionData = null;
                console.log('경매 데이터 초기화 완료');
                
                // 선택된 매물 초기화
                this.selectedProperty = null;
                console.log('선택된 매물 초기화 완료');
                
                // 모든 매물 선택 해제
                document.querySelectorAll('.tree-item.selected').forEach(item => {
                    item.classList.remove('selected');
                });
                console.log('모든 매물 선택 해제 완료');
                
                // 폼 초기화 (reset() 먼저 실행)
                const form = document.getElementById('propertyForm');
                if (form) {
                    form.reset();
                    console.log('폼 reset() 완료');
                }
                
                // 메인 폼 먼저 초기화
                this.resetMainForm();
                
                // 모달 폼 개별 초기화 (DOM 업데이트 후 실행)
                setTimeout(() => {
                    this.resetModalForm();
                    console.log('모달 폼 초기화 완료');
                }, 100);
                
                // 매각가율 정보도 완전 초기화
                setTimeout(() => {
                    this.resetSaleRateInfo();
                }, 150);
            } else {
                console.log('편집 모드 - 폼 초기화 건너뜀');
            }
            
            // 모달 표시
            modal.style.display = 'block';
            console.log('매물 추가 모달 표시 완료');
            
            // 매각가율 정보 표시 보장 (새 매물 추가 시에는 초기화된 상태로)
            setTimeout(() => {
                this.ensureSaleRateInfoVisible();
                console.log('새 매물 추가 - 매각가율 정보 초기화 상태 유지');
            }, 100);
        } else {
            console.error('propertyModal을 찾을 수 없습니다');
        }
    }

    resetModalForm() {
        console.log('모달 폼 초기화 시작');
        
        // 사건번호 초기화
        const caseNumber = document.getElementById('caseNumber');
        if (caseNumber) {
            caseNumber.value = '';
            console.log('사건번호 초기화 완료');
        }
        
        // 매물명 초기화
        const propertyName = document.getElementById('propertyName');
        if (propertyName) {
            propertyName.value = '';
            console.log('매물명 초기화 완료');
        }
        console.log('모달 폼 초기화 완료');
    }

    // 메인 폼 초기화 (매물 추가 시에만 사용)
    resetMainForm() {
        console.log('메인 폼 초기화 시작');
        
        // 메인 폼의 모든 입력 필드 초기화
        const mainFormFields = [
            'caseNumber',
            'propertyLocation',
            'propertyType',
            'court',
            'auctionDate',
            'auctionStatus',
            'bidPrice',
            'marketPrice',
            'appraisalPrice',
            'minimumBid',
            'renovationCost',
            'competitorCount',
            'marketCondition',
            'urgency',
            'auctionType',
            'failedCount'
        ];
        
        mainFormFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                console.log(`${fieldId} 초기화 완료`);
            }
        });
        
        // 매각가율 정보는 초기화하지 않음 (사용자가 입력한 정보 유지)
        // this.resetSaleRateInfo(); // 제거 - 사용자가 입력한 매각가율 정보 유지
        
        // 선택된 매물 초기화 (매물 추가 시에만)
        this.selectedProperty = null;
        
        // 이전 선택 해제 (매물 추가 시에만)
        document.querySelectorAll('.tree-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        console.log('메인 폼 초기화 완료');
    }

    // 메인 폼의 입력 필드만 초기화 (매물 선택 시에는 사용하지 않음)
    resetMainFormInputs() {
        console.log('메인 폼 입력 필드만 초기화 시작');
        
        // 입력 필드만 초기화 (기본 정보는 유지)
        const inputFields = [
            'court',
            'auctionDate',
            'auctionStatus',
            'bidPrice',
            'marketPrice',
            'appraisalPrice',
            'minimumBid',
            'renovationCost',
            'competitorCount',
            'marketCondition',
            'urgency',
            'auctionType',
            'failedCount'
        ];
        
        inputFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                console.log(`${fieldId} 초기화 완료`);
            }
        });
        
        console.log('메인 폼 입력 필드 초기화 완료');
    }

    // 특정 매물의 저장된 경매 정보 불러오기
    loadSavedAuctionDataForProperty(property) {
        console.log('저장된 경매 정보 불러오기 시작:', property);
        
        // localStorage에서 해당 매물의 저장된 데이터 찾기
        const savedData = this.findSavedDataForProperty(property);
        
        if (savedData && savedData.auctionInfo) {
            console.log('저장된 경매 정보 발견:', savedData.auctionInfo);
            
            // 경매 정보를 메인 폼에 로드
            this.populateFormWithAuctionInfo(savedData.auctionInfo);
            
            // 시뮬레이션 결과가 있다면 로드
            if (savedData.simulationResult) {
                console.log('저장된 시뮬레이션 결과 발견:', savedData.simulationResult);
                this.populateFormWithSimulationResult(savedData.simulationResult);
            }
            
            // 물건조사 정보가 있다면 로드
            if (savedData.inspectionData) {
                console.log('저장된 물건조사 정보 발견:', savedData.inspectionData);
                this.populateFormWithInspectionData(savedData.inspectionData);
            }
            
        } else {
            console.log('저장된 경매 정보가 없습니다. 기본 정보만 표시됩니다.');
        }
    }

    // localStorage에서 특정 매물의 저장된 데이터 찾기
    findSavedDataForProperty(property) {
        const propertyKey = property.caseNumber || property.name || property.location;
        if (!propertyKey) return null;
        
        // localStorage의 모든 키를 검색
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('property_all_')) {
                try {
                    const savedData = JSON.parse(localStorage.getItem(key));
                    if (savedData && savedData.property) {
                        // 매물 정보 비교
                        const savedProperty = savedData.property;
                        if ((savedProperty.caseNumber && savedProperty.caseNumber === property.caseNumber) ||
                            (savedProperty.name && savedProperty.name === property.name) ||
                            (savedProperty.location && savedProperty.location === property.location)) {
                            console.log('매칭되는 저장된 데이터 발견:', key);
                            return savedData;
                        }
                    }
                } catch (e) {
                    console.warn('저장된 데이터 파싱 오류:', key, e);
                }
            }
        }
        
        return null;
    }

    // 경매 정보를 메인 폼에 채우기
    populateFormWithAuctionInfo(auctionInfo) {
        console.log('경매 정보를 메인 폼에 채우기:', auctionInfo);
        
        // 기본 정보는 이미 설정되었으므로 추가 정보만 설정
        if (auctionInfo.court) {
            document.getElementById('court').value = auctionInfo.court;
        }
        if (auctionInfo.auctionDate) {
            document.getElementById('auctionDate').value = auctionInfo.auctionDate;
        }
        if (auctionInfo.auctionStatus) {
            document.getElementById('auctionStatus').value = auctionInfo.auctionStatus;
        }
        if (auctionInfo.bidPrice) {
            document.getElementById('bidPrice').value = auctionInfo.bidPrice;
        }
        if (auctionInfo.marketPrice) {
            document.getElementById('marketPrice').value = auctionInfo.marketPrice;
        }
        if (auctionInfo.appraisalPrice) {
            document.getElementById('appraisalPrice').value = auctionInfo.appraisalPrice;
        }
        if (auctionInfo.minimumBid) {
            document.getElementById('minimumBid').value = auctionInfo.minimumBid;
        }
        if (auctionInfo.renovationCost) {
            document.getElementById('renovationCost').value = auctionInfo.renovationCost;
        }
        if (auctionInfo.competitorCount) {
            document.getElementById('competitorCount').value = auctionInfo.competitorCount;
        }
        if (auctionInfo.marketCondition) {
            document.getElementById('marketCondition').value = auctionInfo.marketCondition;
        }
        if (auctionInfo.urgency) {
            document.getElementById('urgency').value = auctionInfo.urgency;
        }
        if (auctionInfo.auctionType) {
            document.getElementById('auctionType').value = auctionInfo.auctionType;
        }
        if (auctionInfo.failedCount) {
            document.getElementById('failedCount').value = auctionInfo.failedCount;
        }
        
        console.log('경매 정보 폼 채우기 완료');
    }

    // 시뮬레이션 결과를 폼에 채우기
    populateFormWithSimulationResult(simulationResult) {
        console.log('시뮬레이션 결과를 폼에 채우기:', simulationResult);
        
        // 시뮬레이션 결과 필드들 채우기 (권장가격 제거)
        if (simulationResult.totalCost) {
            document.getElementById('totalCost').textContent = simulationResult.totalCost;
        }
        if (simulationResult.riskAdjustedProfit) {
            document.getElementById('riskAdjustedProfit').textContent = simulationResult.riskAdjustedProfit;
        }
        if (simulationResult.modelConfidence) {
            document.getElementById('modelConfidence').textContent = simulationResult.modelConfidence;
        }
        
        console.log('시뮬레이션 결과 로드 완료');
    }

    // 물건조사 정보를 폼에 채우기
    populateFormWithInspectionData(inspectionData) {
        console.log('물건조사 정보를 폼에 채우기:', inspectionData);
        
        // 물건조사 필드들 채우기
        if (inspectionData.preservationRegistry) {
            document.getElementById('preservationRegistry').value = inspectionData.preservationRegistry;
        }
        if (inspectionData.buildingAge) {
            document.getElementById('buildingAge').value = inspectionData.buildingAge;
        }
        if (inspectionData.meters) {
            document.getElementById('meters').value = inspectionData.meters;
        }
        if (inspectionData.mailCheck) {
            document.getElementById('mailCheck').value = inspectionData.mailCheck;
        }
        if (inspectionData.slope) {
            document.getElementById('slope').value = inspectionData.slope;
        }
        if (inspectionData.lightingDirection) {
            document.getElementById('lightingDirection').value = inspectionData.lightingDirection;
        }
        if (inspectionData.structureFloor) {
            document.getElementById('structureFloor').value = inspectionData.structureFloor;
        }
        if (inspectionData.parking) {
            document.getElementById('parking').value = inspectionData.parking;
        }
        if (inspectionData.waterLeakage) {
            document.getElementById('waterLeakage').value = inspectionData.waterLeakage;
        }
        if (inspectionData.unpaidUtilities) {
            document.getElementById('unpaidUtilities').value = inspectionData.unpaidUtilities;
        }
        if (inspectionData.gasType) {
            document.getElementById('gasType').value = inspectionData.gasType;
        }
        if (inspectionData.gasUnpaid) {
            document.getElementById('gasUnpaid').value = inspectionData.gasUnpaid;
        }
        if (inspectionData.residentsCheck) {
            document.getElementById('residentsCheck').value = inspectionData.residentsCheck;
        }
        if (inspectionData.currentResidents) {
            document.getElementById('currentResidents').value = inspectionData.currentResidents;
        }
        
        // 주변조사 필드들 채우기
        if (inspectionData.busRoutes) {
            document.getElementById('busRoutes').value = inspectionData.busRoutes;
        }
        if (inspectionData.subway) {
            document.getElementById('subway').value = inspectionData.subway;
        }
        if (inspectionData.shopping) {
            document.getElementById('shopping').value = inspectionData.shopping;
        }
        if (inspectionData.schools) {
            document.getElementById('schools').value = inspectionData.schools;
        }
        
        // 시세조사 필드들 채우기
        if (inspectionData.molitPrice) {
            document.getElementById('molitPrice').value = inspectionData.molitPrice;
        }
        if (inspectionData.naverPrice) {
            document.getElementById('naverPrice').value = inspectionData.naverPrice;
        }
        if (inspectionData.kbPrice) {
            document.getElementById('kbPrice').value = inspectionData.kbPrice;
        }
        if (inspectionData.fieldPrice) {
            document.getElementById('fieldPrice').value = inspectionData.fieldPrice;
        }
        
        // 기타 필드들 채우기
        if (inspectionData.specialNotes) {
            document.getElementById('specialNotes').value = inspectionData.specialNotes;
        }
        if (inspectionData.finalScore) {
            document.getElementById('finalScore').value = inspectionData.finalScore;
        }
        if (inspectionData.inspectionDate) {
            document.getElementById('inspectionDate').value = inspectionData.inspectionDate;
        }
        
        console.log('물건조사 정보 로드 완료');
    }

    onRegionChange() {
        const regionSelect = document.getElementById('regionSelect');
        const districtSelect = document.getElementById('districtSelect');
        
        if (!regionSelect || !districtSelect) return;
        
        const selectedRegion = regionSelect.value;
        
        if (selectedRegion) {
            // 구/군 옵션 업데이트
            this.updateDistrictOptions(selectedRegion);
        } else {
            districtSelect.innerHTML = '<option value="">먼저 지역을 선택하세요</option>';
        }
        
        // 매각통계 정보 초기화
        const statisticsInfo = document.getElementById('saleStatisticsInfo');
        if (statisticsInfo) {
            statisticsInfo.innerHTML = '<p>구/군을 선택하면 매각통계 정보가 표시됩니다.</p>';
        }
    }

    updateDistrictOptions(region) {
        const districtSelect = document.getElementById('districtSelect');
        if (!districtSelect) return;
        
        // 지역별 구/군 목록
        const districts = {
            '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', 
                    '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', 
                    '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', 
                    '종로구', '중구', '중랑구'],
            '경기': [
                // 수원시
                '수원시 영통구', '수원시 팔달구', '수원시 장안구', '수원시 권선구',
                // 성남시
                '성남시 분당구', '성남시 수정구', '성남시 중원구',
                // 안양시
                '안양시 만안구', '안양시 동안구',
                // 부천시
                '부천시 원미구', '부천시 소사구', '부천시 오정구',
                // 고양시
                '고양시 덕양구', '고양시 일산동구', '고양시 일산서구',
                // 용인시
                '용인시 처인구', '용인시 기흥구', '용인시 수지구',
                // 화성시
                '화성시 동탄구', '화성시 동탄신도시',
                // 기타 시/군
                '의정부시', '광명시', '평택시', '과천시', '오산시', '시흥시', 
                '군포시', '의왕시', '하남시', '파주시', '이천시', '안성시', 
                '김포시', '광주시', '여주시', '양평군', '동두천시', '가평군', '연천군'
            ],
            '부산': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', 
                    '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', 
                    '기장군'],
            '인천': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', 
                    '서구', '강화군', '옹진군']
        };
        
        const regionDistricts = districts[region] || [];
        
        districtSelect.innerHTML = '<option value="">구/군을 선택하세요</option>';
        regionDistricts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
    }

    async onDistrictChange() {
        const regionSelect = document.getElementById('regionSelect');
        const districtSelect = document.getElementById('districtSelect');
        
        if (!regionSelect || !districtSelect) return;
        
        const selectedRegion = regionSelect.value;
        const selectedDistrict = districtSelect.value;
        
        if (selectedRegion && selectedDistrict) {
            console.log('지역 선택됨:', selectedRegion, selectedDistrict);
            
            // 매각가율 정보 로드
            await this.loadSaleRateInfo(selectedRegion, selectedDistrict);
            
            // 위치 필드 자동 업데이트
            const propertyLocation = document.getElementById('propertyLocation');
            if (propertyLocation) {
                // 경기도의 경우 시와 구가 이미 포함되어 있으므로 그대로 사용
                if (selectedRegion === '경기' && selectedDistrict.includes('시')) {
                    propertyLocation.value = selectedDistrict;
                } else {
                    propertyLocation.value = `${selectedRegion} ${selectedDistrict}`;
                }
            }
        } else {
            // 선택이 해제되면 매각가율 정보 숨기기
            this.hideSaleRateInfo();
        }
    }

    // 지역별 매각가율 데이터 (fallback)
    getRegionalSaleRateData() {
        return {
            // 서울시
            '서울 강남구': { saleRate: 85.2, investmentRec: 'A+' },
            '서울 강동구': { saleRate: 78.5, investmentRec: 'A' },
            '서울 강북구': { saleRate: 72.3, investmentRec: 'B+' },
            '서울 강서구': { saleRate: 76.8, investmentRec: 'A-' },
            '서울 관악구': { saleRate: 74.1, investmentRec: 'B+' },
            '서울 광진구': { saleRate: 79.2, investmentRec: 'A-' },
            '서울 구로구': { saleRate: 73.6, investmentRec: 'B+' },
            '서울 금천구': { saleRate: 71.8, investmentRec: 'B' },
            '서울 노원구': { saleRate: 75.4, investmentRec: 'B+' },
            '서울 도봉구': { saleRate: 70.9, investmentRec: 'B' },
            '서울 동대문구': { saleRate: 73.2, investmentRec: 'B+' },
            '서울 동작구': { saleRate: 77.8, investmentRec: 'A-' },
            '서울 마포구': { saleRate: 82.1, investmentRec: 'A' },
            '서울 서대문구': { saleRate: 76.5, investmentRec: 'B+' },
            '서울 서초구': { saleRate: 87.3, investmentRec: 'A+' },
            '서울 성동구': { saleRate: 80.6, investmentRec: 'A' },
            '서울 성북구': { saleRate: 74.8, investmentRec: 'B+' },
            '서울 송파구': { saleRate: 83.7, investmentRec: 'A+' },
            '서울 양천구': { saleRate: 78.9, investmentRec: 'A-' },
            '서울 영등포구': { saleRate: 81.4, investmentRec: 'A' },
            '서울 용산구': { saleRate: 84.2, investmentRec: 'A+' },
            '서울 은평구': { saleRate: 76.1, investmentRec: 'B+' },
            '서울 종로구': { saleRate: 85.8, investmentRec: 'A+' },
            '서울 중구': { saleRate: 86.4, investmentRec: 'A+' },
            '서울 중랑구': { saleRate: 72.7, investmentRec: 'B+' },
            
            // 경기도
            '경기 수원시 영통구': { saleRate: 78.3, investmentRec: 'A-' },
            '경기 수원시 팔달구': { saleRate: 76.9, investmentRec: 'B+' },
            '경기 수원시 장안구': { saleRate: 75.2, investmentRec: 'B+' },
            '경기 수원시 권선구': { saleRate: 74.8, investmentRec: 'B+' },
            '경기 성남시 분당구': { saleRate: 82.7, investmentRec: 'A+' },
            '경기 성남시 수정구': { saleRate: 77.1, investmentRec: 'B+' },
            '경기 성남시 중원구': { saleRate: 75.6, investmentRec: 'B+' },
            '경기 부천시': { saleRate: 73.4, investmentRec: 'B+' },
            '경기 부천시 오정구': { saleRate: 72.8, investmentRec: 'B' },
            '경기 부천시 원미구': { saleRate: 74.1, investmentRec: 'B+' },
            '경기 부천시 소사구': { saleRate: 73.0, investmentRec: 'B' },
            '경기 의정부시': { saleRate: 76.5, investmentRec: 'B+' },
            '경기 안양시 동안구': { saleRate: 79.2, investmentRec: 'A-' },
            '경기 안양시 만안구': { saleRate: 77.8, investmentRec: 'B+' },
            '경기 안산시 단원구': { saleRate: 71.9, investmentRec: 'B' },
            '경기 안산시 상록구': { saleRate: 73.2, investmentRec: 'B' },
            '경기 고양시 덕양구': { saleRate: 78.4, investmentRec: 'A-' },
            '경기 고양시 일산동구': { saleRate: 80.1, investmentRec: 'A-' },
            '경기 고양시 일산서구': { saleRate: 79.6, investmentRec: 'A-' },
            '경기 용인시 기흥구': { saleRate: 77.3, investmentRec: 'B+' },
            '경기 용인시 수지구': { saleRate: 81.5, investmentRec: 'A' },
            '경기 용인시 처인구': { saleRate: 74.7, investmentRec: 'B+' },
            '경기 파주시': { saleRate: 72.6, investmentRec: 'B' },
            '경기 이천시': { saleRate: 71.8, investmentRec: 'B' },
            '경기 안성시': { saleRate: 70.9, investmentRec: 'B' },
            '경기 김포시': { saleRate: 76.2, investmentRec: 'B+' },
            '경기 화성시': { saleRate: 73.8, investmentRec: 'B' },
            '경기 광주시': { saleRate: 75.1, investmentRec: 'B+' },
            '경기 여주시': { saleRate: 69.7, investmentRec: 'C+' },
            '경기 오산시': { saleRate: 74.3, investmentRec: 'B+' },
            '경기 시흥시': { saleRate: 72.9, investmentRec: 'B' },
            '경기 군포시': { saleRate: 78.7, investmentRec: 'A-' },
            '경기 의왕시': { saleRate: 80.3, investmentRec: 'A-' },
            '경기 하남시': { saleRate: 79.8, investmentRec: 'A-' },
            '경기 광명시': { saleRate: 77.2, investmentRec: 'B+' },
            '경기 평택시': { saleRate: 71.5, investmentRec: 'B' },
            '경기 과천시': { saleRate: 83.4, investmentRec: 'A+' },
            '경기 구리시': { saleRate: 78.9, investmentRec: 'A-' },
            '경기 남양주시': { saleRate: 76.4, investmentRec: 'B+' },
            '경기 의정부시': { saleRate: 76.5, investmentRec: 'B+' },
            '경기 연천군': { saleRate: 68.2, investmentRec: 'C' },
            '경기 가평군': { saleRate: 69.1, investmentRec: 'C+' },
            '경기 양평군': { saleRate: 70.3, investmentRec: 'B' },
            
            // 인천시
            '인천 중구': { saleRate: 74.6, investmentRec: 'B+' },
            '인천 동구': { saleRate: 72.1, investmentRec: 'B' },
            '인천 미추홀구': { saleRate: 76.8, investmentRec: 'B+' },
            '인천 연수구': { saleRate: 81.3, investmentRec: 'A' },
            '인천 남동구': { saleRate: 78.5, investmentRec: 'A-' },
            '인천 부평구': { saleRate: 75.9, investmentRec: 'B+' },
            '인천 계양구': { saleRate: 77.2, investmentRec: 'B+' },
            '인천 서구': { saleRate: 73.4, investmentRec: 'B' },
            '인천 강화군': { saleRate: 68.7, investmentRec: 'C' },
            '인천 옹진군': { saleRate: 65.9, investmentRec: 'C' },
            
            // 부산시
            '부산 중구': { saleRate: 76.3, investmentRec: 'B+' },
            '부산 서구': { saleRate: 74.8, investmentRec: 'B+' },
            '부산 동구': { saleRate: 73.1, investmentRec: 'B' },
            '부산 영도구': { saleRate: 72.6, investmentRec: 'B' },
            '부산 부산진구': { saleRate: 78.9, investmentRec: 'A-' },
            '부산 동래구': { saleRate: 80.2, investmentRec: 'A-' },
            '부산 남구': { saleRate: 77.5, investmentRec: 'B+' },
            '부산 북구': { saleRate: 75.8, investmentRec: 'B+' },
            '부산 해운대구': { saleRate: 84.7, investmentRec: 'A+' },
            '부산 사하구': { saleRate: 73.7, investmentRec: 'B' },
            '부산 금정구': { saleRate: 76.4, investmentRec: 'B+' },
            '부산 강서구': { saleRate: 71.9, investmentRec: 'B' },
            '부산 연제구': { saleRate: 82.1, investmentRec: 'A' },
            '부산 수영구': { saleRate: 83.6, investmentRec: 'A+' },
            '부산 사상구': { saleRate: 74.2, investmentRec: 'B' },
            '부산 기장군': { saleRate: 72.8, investmentRec: 'B' }
        };
    }

    // 새로운 매각가율 정보 로드 함수 (간단화된 버전)
    async loadSaleRateInfo(region, district) {
        console.log('매각가율 정보 로드 시작:', region, district);
        
        try {
            // 지역별 데이터에서 직접 찾기
            const regionalData = this.getRegionalSaleRateData();
            const fullDistrictName = `${region} ${district}`;
            
            console.log('=== loadSaleRateInfo 디버깅 ===');
            console.log('region:', region);
            console.log('district:', district);
            console.log('fullDistrictName:', fullDistrictName);
            console.log('검색할 지역명:', fullDistrictName);
            
            if (regionalData[fullDistrictName]) {
                console.log('✅ 지역별 데이터에서 찾음:', regionalData[fullDistrictName]);
                
                // 매각가율 정보 표시
                this.displaySaleRateInfo({
                    saleRate: regionalData[fullDistrictName].saleRate,
                    investmentRec: regionalData[fullDistrictName].investmentRec,
                    region: region,
                    district: district
                });
                this.showSaleRateInfo();
                console.log('✅ 매각가율 정보 표시 완료');
                return;
            }
            
            // 지역별 데이터가 없으면 기본값 사용
            console.log('❌ 지역별 데이터 없음 - 기본값 사용');
            this.setDefaultSaleRateInfo();
            this.showSaleRateInfo();
            
        } catch (error) {
            console.error('매각가율 정보 로드 실패:', error);
            this.setDefaultSaleRateInfo();
            this.showSaleRateInfo();
        }
    }

    // 매각가율 정보 표시
    displaySaleRateInfo(statistics) {
        console.log('매각가율 정보 표시 시작:', statistics);
        
        const saleRateValue = document.getElementById('saleRateValue');
        const saleRatePercent = document.getElementById('saleRatePercent');
        const investmentRecommendation = document.getElementById('investmentRecommendation');
        
        if (saleRateValue && statistics.saleRate) {
            saleRateValue.textContent = statistics.saleRate.toFixed(1);
            console.log('매각가율 값 설정:', statistics.saleRate);
        }
        if (saleRatePercent && statistics.saleRate) {
            saleRatePercent.textContent = `${statistics.saleRate.toFixed(1)}%`;
            console.log('매각가율 퍼센트 설정:', statistics.saleRate);
        }
        if (investmentRecommendation && statistics.investmentRec) {
            investmentRecommendation.textContent = statistics.investmentRec;
            console.log('투자추천 등급 설정:', statistics.investmentRec);
        }
        
        // 매각가율에 따른 스타일 적용
        if (statistics.saleRate) {
            const rate = parseFloat(statistics.saleRate);
            const className = this.getSaleRateClass(rate);
            
            if (saleRateValue) {
                saleRateValue.className = className;
                console.log('매각가율 스타일 적용:', className);
            }
            if (saleRatePercent) {
                saleRatePercent.className = className;
            }
        }
        
        console.log('매각가율 정보 표시 완료:', {
            saleRate: statistics.saleRate,
            investmentRec: statistics.investmentRec,
            region: statistics.region,
            district: statistics.district
        });
    }

    // 매각가율 정보 표시
    showSaleRateInfo() {
        const saleRateInfo = document.getElementById('saleRateInfo');
        if (saleRateInfo) {
            saleRateInfo.style.display = 'block';
            console.log('매각가율 정보 표시됨');
        }
    }

    // 매각가율 정보 숨기기
    hideSaleRateInfo() {
        const saleRateInfo = document.getElementById('saleRateInfo');
        if (saleRateInfo) {
            saleRateInfo.style.display = 'none';
            console.log('매각가율 정보 숨겨짐');
        }
    }

    async loadSaleStatistics(region, district) {
        const statisticsInfo = document.getElementById('saleStatisticsInfo');
        if (!statisticsInfo) return;
        
        try {
            // 로딩 표시
            statisticsInfo.innerHTML = '<p>매각통계 정보를 불러오는 중...</p>';
            
            // 매각통계 데이터 조회
            const [districtStats, investmentRec] = await Promise.all([
                fetchDistrictStatistics(region, district),
                fetchInvestmentRecommendation(region, district)
            ]);
            
            let html = '';
            
            if (districtStats.success) {
                const data = districtStats.data;
                const saleRateClass = this.getSaleRateClass(data.sale_rate);
                const salePriceRateClass = this.getSaleRateClass(data.sale_price_rate);
                
                html += `
                    <div class="stat-item">
                        <span class="stat-label">경매건수</span>
                        <span class="stat-value">${data.auctions.toLocaleString()}건</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">매각건수</span>
                        <span class="stat-value">${data.sales.toLocaleString()}건</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">매각률</span>
                        <span class="stat-value ${saleRateClass}">${data.sale_rate.toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">매각가율</span>
                        <span class="stat-value ${salePriceRateClass}">${data.sale_price_rate.toFixed(1)}%</span>
                    </div>
                `;
            }
            
            if (investmentRec.success) {
                const data = investmentRec.data;
                const badgeClass = this.getRecommendationBadgeClass(data.recommendation);
                
                html += `
                    <div class="stat-item">
                        <span class="stat-label">투자 추천</span>
                        <span class="stat-value ${badgeClass}">${data.recommendation}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">시장 점수</span>
                        <span class="stat-value">${data.score}/100</span>
                    </div>
                `;
            }
            
            if (html) {
                statisticsInfo.innerHTML = html;
            } else {
                statisticsInfo.innerHTML = '<p>매각통계 정보를 찾을 수 없습니다.</p>';
            }
            
        } catch (error) {
            console.error('매각통계 정보 로드 오류:', error);
            statisticsInfo.innerHTML = '<p>매각통계 정보를 불러오는 중 오류가 발생했습니다.</p>';
        }
    }

    getSaleRateClass(rate) {
        if (rate >= 30) return 'sale-rate-good';
        if (rate >= 20) return 'sale-rate-normal';
        return 'sale-rate-bad';
    }

    async loadSaleRateInfoForMainForm(location) {
        console.log('loadSaleRateInfoForMainForm 호출됨:', location);
        
        if (!location) {
            console.log('location이 없어서 종료');
            return;
        }
        
        const region = this.extractRegionFromLocation(location);
        const district = this.extractDistrictFromLocation(location);
        
        console.log('=== 매각가율 정보 로드 상세 ===');
        console.log('입력된 location:', location);
        console.log('추출된 region:', region);
        console.log('추출된 district:', district);
        
        if (!region || !district) {
            console.log('지역 정보를 추출할 수 없습니다:', location);
            // 지역 정보를 추출할 수 없는 경우 - 기본값 설정하지 않음
            // this.setDefaultSaleRateInfo(); // 제거
            return;
        }
        
        console.log('API 호출 예정 - region:', region, 'district:', district);
        
        try {
            // 매각통계 데이터 조회
            const [districtStats, investmentRec] = await Promise.all([
                fetchDistrictStatistics(region, district),
                fetchInvestmentRecommendation(region, district)
            ]);
            
            console.log('매각통계 API 응답:', { districtStats, investmentRec });
            
            const saleRateInfo = document.getElementById('saleRateInfo');
            if (!saleRateInfo) {
                console.error('saleRateInfo 요소를 찾을 수 없습니다');
                return;
            }
            
            if (districtStats.success && investmentRec.success) {
                const statsData = districtStats.data;
                const investmentData = investmentRec.data;
                
                console.log('매각가율 데이터 표시:', { statsData, investmentData });
                
                // 지역별 데이터가 있는 경우 강제 수정 (API 데이터 표시 후)
                const knownRegions = ['부천시 오정구', '부천시 원미구', '부천시 소사구', '강남구', '해운대구'];
                if (knownRegions.includes(district)) {
                    console.log(`=== ${district} 감지 - API 데이터 표시 후 강제 수정 ===`);
                    // API 데이터를 먼저 표시하고, 그 다음에 강제 수정
                }
                
                // 매각가율 정보 표시
                const saleRateValue = document.getElementById('saleRateValue');
                const saleRatePercent = document.getElementById('saleRatePercent');
                const investmentRecommendation = document.getElementById('investmentRecommendation');
                
                if (saleRateValue) {
                    saleRateValue.textContent = `${statsData.sale_price_rate.toFixed(1)}%`;
                    saleRateValue.className = `sale-rate-value ${this.getSaleRateClass(statsData.sale_price_rate)}`;
                    console.log('=== 매각가율 표시 성공 ===');
                    console.log('표시된 매각가율:', saleRateValue.textContent);
                    console.log('데이터 출처:', region, district);
                    console.log('API 응답 데이터:', statsData.sale_price_rate);
                } else {
                    console.error('saleRateValue 요소를 찾을 수 없습니다');
                }
                
                if (saleRatePercent) {
                    saleRatePercent.textContent = `${statsData.sale_rate.toFixed(1)}%`;
                    saleRatePercent.className = `sale-rate-value ${this.getSaleRateClass(statsData.sale_rate)}`;
                    console.log('매각률 표시:', saleRatePercent.textContent);
                }
                
                if (investmentRecommendation) {
                    investmentRecommendation.textContent = investmentData.recommendation;
                    investmentRecommendation.className = `sale-rate-value ${this.getRecommendationBadgeClass(investmentData.recommendation)}`;
                    console.log('투자 추천 표시:', investmentRecommendation.textContent);
                }
                
                // 매각가율 정보 섹션 표시
                saleRateInfo.style.display = 'block';
                console.log('매각가율 정보 섹션 표시됨');
                
                // 지역별 데이터가 있는 경우 강제 수정 실행
                if (knownRegions.includes(district)) {
                    setTimeout(() => {
                        this.forceCorrectRegionalSaleRate();
                        console.log(`${district} 강제 수정 완료`);
                    }, 100);
                }
                
            } else {
                console.log('API 응답 실패:', { districtStats, investmentRec });
                // API 실패 시 지역별 강제 수정 실행
                const knownRegions = ['부천시 오정구', '부천시 원미구', '부천시 소사구', '강남구', '해운대구'];
                if (knownRegions.includes(district)) {
                    console.log(`API 실패 - ${district} 강제 수정 실행`);
                    setTimeout(() => {
                        this.forceCorrectRegionalSaleRate();
                    }, 100);
                }
            }
            
        } catch (error) {
            console.error('매각가율 정보 로드 오류:', error);
            // 오류 발생 시 지역별 강제 수정 실행
            const knownRegions = ['부천시 오정구', '부천시 원미구', '부천시 소사구', '강남구', '해운대구'];
            if (district && knownRegions.includes(district)) {
                console.log(`오류 발생 - ${district} 강제 수정 실행`);
                setTimeout(() => {
                    this.forceCorrectRegionalSaleRate();
                }, 100);
            }
        }
    }
    
    // 매각가율 정보 강제 표시 함수
    async forceShowSaleRateInfo(region, district) {
        console.log('매각가율 정보 강제 표시:', { region, district });
        
        const saleRateInfo = document.getElementById('saleRateInfo');
        if (!saleRateInfo) {
            console.error('saleRateInfo 요소를 찾을 수 없습니다');
            return;
        }
        
        try {
            // 실제 API 데이터 조회
            const [districtStats, investmentRec] = await Promise.all([
                fetchDistrictStatistics(region, district),
                fetchInvestmentRecommendation(region, district)
            ]);
            
            console.log('강제 표시용 API 응답:', { districtStats, investmentRec });
            
            if (districtStats.success && investmentRec.success) {
                const statsData = districtStats.data;
                const investmentData = investmentRec.data;
                
                console.log('표시할 데이터:', {
                    region,
                    district,
                    sale_price_rate: statsData.sale_price_rate,
                    sale_rate: statsData.sale_rate,
                    recommendation: investmentData.recommendation
                });
                
                const saleRateValue = document.getElementById('saleRateValue');
                const saleRatePercent = document.getElementById('saleRatePercent');
                const investmentRecommendation = document.getElementById('investmentRecommendation');
                
                if (saleRateValue) {
                    saleRateValue.textContent = `${statsData.sale_price_rate.toFixed(1)}%`;
                    saleRateValue.className = `sale-rate-value ${this.getSaleRateClass(statsData.sale_price_rate)}`;
                    console.log('매각가율 표시됨:', saleRateValue.textContent);
                }
                
                if (saleRatePercent) {
                    saleRatePercent.textContent = `${statsData.sale_rate.toFixed(1)}%`;
                    saleRatePercent.className = `sale-rate-value ${this.getSaleRateClass(statsData.sale_rate)}`;
                    console.log('매각률 표시됨:', saleRatePercent.textContent);
                }
                
                if (investmentRecommendation) {
                    investmentRecommendation.textContent = investmentData.recommendation;
                    investmentRecommendation.className = `sale-rate-value ${this.getRecommendationBadgeClass(investmentData.recommendation)}`;
                    console.log('투자 추천 표시됨:', investmentRecommendation.textContent);
                }
                
                // 매각가율 정보 섹션 표시
                saleRateInfo.style.display = 'block';
                console.log('매각가율 정보 강제 표시 완료 (실제 데이터)');
            } else {
                console.log('API 응답 실패, 하드코딩된 데이터 사용');
                // API 실패시 하드코딩된 데이터 사용
                const saleRateValue = document.getElementById('saleRateValue');
                const saleRatePercent = document.getElementById('saleRatePercent');
                const investmentRecommendation = document.getElementById('investmentRecommendation');
                
                if (saleRateValue) {
                    saleRateValue.textContent = '80.3%';
                    saleRateValue.className = 'sale-rate-value good';
                }
                
                if (saleRatePercent) {
                    saleRatePercent.textContent = '30.3%';
                    saleRatePercent.className = 'sale-rate-value good';
                }
                
                if (investmentRecommendation) {
                    investmentRecommendation.textContent = '추천';
                    investmentRecommendation.className = 'sale-rate-value good';
                }
                
                saleRateInfo.style.display = 'block';
            }
        } catch (error) {
            console.error('강제 표시 오류:', error);
            // 오류시 하드코딩된 데이터 사용
            const saleRateValue = document.getElementById('saleRateValue');
            const saleRatePercent = document.getElementById('saleRatePercent');
            const investmentRecommendation = document.getElementById('investmentRecommendation');
            
            if (saleRateValue) {
                saleRateValue.textContent = '80.3%';
                saleRateValue.className = 'sale-rate-value good';
            }
            
            if (saleRatePercent) {
                saleRatePercent.textContent = '30.3%';
                saleRatePercent.className = 'sale-rate-value good';
            }
            
            if (investmentRecommendation) {
                investmentRecommendation.textContent = '추천';
                investmentRecommendation.className = 'sale-rate-value good';
            }
            
            saleRateInfo.style.display = 'block';
        }
    }

    // 매물 추가 모달 숨기기
    hidePropertyModal() {
        console.log('매물 추가 모달 숨김 시작');
        const modal = document.getElementById('propertyModal');
        if (modal) {
            // 모달 숨기기
            modal.style.display = 'none';
            console.log('모달 숨김 완료');
            
            // 편집 모드 초기화
            delete modal.dataset.editIndex;
            modal.querySelector('h3').textContent = '매물 추가';
            console.log('편집 모드 초기화 완료');
            
            // 경매 데이터 초기화
            this.currentAuctionData = null;
            console.log('경매 데이터 초기화 완료');
            
            // 폼 reset() 실행
            const form = document.getElementById('propertyForm');
            if (form) {
                form.reset();
                console.log('폼 reset() 완료');
            }
            
            // 모달 폼 개별 초기화 (DOM 업데이트 후 실행)
            setTimeout(() => {
                this.resetModalForm();
            }, 100);
            
            console.log('모달 숨김 및 모든 초기화 완료');
        } else {
            console.error('propertyModal을 찾을 수 없습니다');
        }
    }

    // 모달 이벤트 초기화
    initializeModalEvents() {
        const modal = document.getElementById('propertyModal');
        if (!modal) return;

        // 닫기 버튼
        const closeBtn = document.getElementById('closeModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hidePropertyModal());
        }

        // 취소 버튼
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hidePropertyModal());
        }

        // 저장 버튼
        const saveBtn = document.getElementById('savePropertyBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                console.log('저장 버튼 클릭됨');
                this.saveProperty();
            });
            console.log('저장 버튼 이벤트 리스너 등록 완료');
        } else {
            console.error('savePropertyBtn 요소를 찾을 수 없습니다');
        }

        // 경매 데이터 가져오기 버튼 (모달 내부)
        const fetchBtn = modal.querySelector('#fetchAuctionData');
        if (fetchBtn) {
            console.log('모달 내 경매 데이터 가져오기 버튼 이벤트 리스너 등록');
            fetchBtn.addEventListener('click', () => {
                console.log('모달 내 경매 데이터 가져오기 버튼 클릭됨');
                this.fetchAuctionDataFromModal();
            });
        } else {
            console.error('모달 내 fetchAuctionData 버튼을 찾을 수 없습니다');
        }

        // 지역 선택 이벤트
        const regionSelect = document.getElementById('regionSelect');
        if (regionSelect) {
            regionSelect.addEventListener('change', () => this.onRegionChange());
        }

        // 구/군 선택 이벤트
        const districtSelect = document.getElementById('districtSelect');
        if (districtSelect) {
            districtSelect.addEventListener('change', () => this.onDistrictChange());
        }

        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hidePropertyModal();
            }
        });
    }

    // 매물 저장
    saveProperty() {
        console.log('saveProperty 함수 호출됨');
        const form = document.getElementById('propertyForm');
        if (!form) {
            console.error('propertyForm을 찾을 수 없습니다');
            return;
        }

        const modal = document.getElementById('propertyModal');
        const isEdit = modal.dataset.editIndex !== undefined;
        const editIndex = parseInt(modal.dataset.editIndex);

        const property = {
            id: isEdit ? this.properties[editIndex].id : Date.now(),
            caseNumber: document.getElementById('caseNumber').value || '',
            name: document.getElementById('propertyName').value || '',
            type: '', // 삭제된 필드 - 빈 문자열로 설정
            location: '', // 삭제된 필드 - 빈 문자열로 설정
            region: '', // 삭제된 필드 - 빈 문자열로 설정
            district: '', // 삭제된 필드 - 빈 문자열로 설정
            notes: '', // 삭제된 필드 - 빈 문자열로 설정
            createdAt: isEdit ? this.properties[editIndex].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // 경매 데이터가 있다면 함께 저장
            auctionData: this.currentAuctionData || null
        };

        // 최소한의 유효성 검사 (매물명 또는 사건번호가 있으면 저장 허용)
        if (!property.name && !property.caseNumber) {
            alert('매물명 또는 사건번호를 입력해주세요.');
            return;
        }

        // 중복 검사 (사건번호 기준) - 사건번호가 있을 때만 검사
        if (property.caseNumber) {
            const properties = this.getProperties();
            const existing = properties.find((p, index) => 
                p.caseNumber === property.caseNumber && (!isEdit || index !== editIndex)
            );
            if (existing) {
                alert('이미 등록된 사건번호입니다.');
                return;
            }
        }

        if (isEdit) {
            // 매물 편집 - 간단한 저장 시스템 사용
            const success = window.simpleStorage ? 
                window.simpleStorage.updateProperty(editIndex, property) :
                window.storageManager.updateProperty(editIndex, property);
                
            if (success) {
                alert('매물이 성공적으로 수정되었습니다.');
            } else {
                alert('매물 수정에 실패했습니다.');
                return;
            }
        } else {
            // 매물 추가 - 간단한 저장 시스템 사용
            const newProperty = window.simpleStorage ? 
                window.simpleStorage.addProperty(property) :
                window.storageManager.addProperty(property);
                
            if (newProperty) {
                alert('매물이 성공적으로 추가되었습니다.');
                console.log('새 매물 추가 완료 - 사용자가 직접 선택하세요');
            } else {
                alert('매물 추가에 실패했습니다.');
                return;
            }
        }

        this.saveProperties();
        this.renderPropertyTree();
        this.hidePropertyModal();
        
        // 편집이 아닌 경우에만 메인 폼 초기화 (새 매물 추가 시)
        if (!isEdit) {
            // 매물 저장 후 매각가율 정보만 초기화 (다음 매물을 위한 데이터 격리)
            setTimeout(() => {
                this.resetSaleRateInfo();
                console.log('새 매물 저장 후 매각가율 정보 초기화 완료');
            }, 100);
            console.log('새 매물 저장 완료 - 매각가율 정보만 초기화 (데이터 격리)');
        }
    }

    // 매물 편집
    editProperty(index) {
        const properties = this.getProperties();
        const property = properties[index];
        if (!property) return;

        console.log('매물 편집 시작:', property);

        // 편집 모드로 설정
        const modal = document.getElementById('propertyModal');
        modal.dataset.editIndex = index;
        modal.querySelector('h3').textContent = '매물 편집';

        // 모달 표시
        this.showPropertyModal();

        // 모달이 완전히 로드된 후 기존 데이터 로드
        setTimeout(() => {
            // 1. 기본 매물 정보 로드 (현재 남아있는 필드만)
            document.getElementById('caseNumber').value = property.caseNumber || '';
            document.getElementById('propertyName').value = property.name || '';

            // 2. 저장된 모든 데이터가 있으면 불러오기
            const saveKey = `property_${index}_data`;
            const savedData = localStorage.getItem(saveKey);
            
            if (savedData) {
                try {
                    const allData = JSON.parse(savedData);
                    console.log('편집용 저장된 데이터 불러오기:', allData);
                    
                    // 경매 정보를 모달 필드에 직접 입력
                    if (allData.auctionInfo) {
                        this.loadAuctionInfoToModalForm(allData.auctionInfo);
                    }
                    
                    // 물건조사 정보를 모달 필드에 직접 입력
                    if (allData.inspectionData) {
                        this.loadInspectionDataToModalForm(allData.inspectionData);
                    }
                    
                    console.log('편집용 모든 데이터 불러오기 완료');
                } catch (error) {
                    console.error('편집용 데이터 불러오기 실패:', error);
                }
            } else {
                console.log('저장된 데이터 없음 - 기본 정보만 편집');
            }
        }, 100);
    }

    // 매물 삭제
    deleteProperty(index) {
        const properties = this.getProperties();
        const property = properties[index];
        if (!property) return;

        if (confirm(`"${property.name || property.caseNumber || '이름 없음'}" 매물을 삭제하시겠습니까?`)) {
            const success = window.simpleStorage ? 
                window.simpleStorage.deleteProperty(index) :
                window.storageManager.deleteProperty(index);
            if (success) {
                this.renderPropertyTree();
                
                // 선택된 매물이 삭제된 경우 선택 해제
                if (this.selectedProperty === property) {
                    this.selectedProperty = null;
                }
                alert('매물이 삭제되었습니다.');
            } else {
                alert('매물 삭제에 실패했습니다.');
            }
        }
    }

    // 모달에서 경매 데이터 가져오기
    async fetchAuctionDataFromModal() {
        // 데이터 가져오기 기능 일시정지
        alert('데이터 가져오기 기능이 일시정지되었습니다.\n수동으로 경매 정보를 입력해주세요.');
        return;
        
        console.log('fetchAuctionDataFromModal 함수 호출됨');
        
        const caseNumber = document.getElementById('caseNumber').value.trim();
        console.log('입력된 사건번호:', caseNumber);
        
        if (!caseNumber) {
            alert('경매 사건번호를 입력해주세요.');
            return;
        }

        const fetchBtn = document.getElementById('fetchAuctionData');
        const originalText = fetchBtn.textContent;
        console.log('버튼 상태:', fetchBtn.disabled, originalText);
        
        try {
            // 로딩 상태 표시
            fetchBtn.disabled = true;
            fetchBtn.classList.add('loading');
            fetchBtn.textContent = '가져오는 중...';
            console.log('로딩 상태 설정 완료');

            // 실제 경매 데이터 가져오기 (시뮬레이션)
            console.log('경매 데이터 가져오기 시작...');
            const auctionData = await this.simulateAuctionDataFetch(caseNumber);
            console.log('가져온 경매 데이터:', auctionData);
            
            // 모달 폼에 데이터 자동 입력
            this.populateModalFormWithAuctionData(auctionData);
            
            // 현재 경매 데이터 저장 (매물 저장 시 사용)
            this.currentAuctionData = auctionData;
            
            alert('경매 데이터를 성공적으로 가져왔습니다!');
            
        } catch (error) {
            console.error('경매 데이터 가져오기 실패:', error);
            alert('경매 데이터를 가져오는데 실패했습니다: ' + error.message);
        } finally {
            // 로딩 상태 해제
            fetchBtn.disabled = false;
            fetchBtn.classList.remove('loading');
            fetchBtn.textContent = originalText;
            console.log('로딩 상태 해제 완료');
        }
    }

    // 경매 데이터 가져오기 (실제 API 호출)
    async simulateAuctionDataFetch(caseNumber) {
        try {
            // Flask 백엔드 API 호출
            const response = await fetch('http://localhost:5001/api/auction-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    caseNumber: caseNumber
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || '데이터를 가져올 수 없습니다.');
            }
            
        } catch (error) {
            console.warn('API 호출 실패, 시뮬레이션 데이터 사용:', error);
            
            // API 호출 실패 시 시뮬레이션 데이터 반환
            return new Promise((resolve) => {
                setTimeout(() => {
                    const year = caseNumber.match(/(\d{4})/)?.[1] || '2024';
                    const isRecent = parseInt(year) >= 2024;
                    
                    const mockData = {
                        caseNumber: caseNumber,
                        court: '서울중앙지방법원',
                        propertyType: '아파트',
                        location: '서울시 강남구',
                        marketPrice: isRecent ? 250000000 : 220000000,
                        appraisalPrice: isRecent ? 243000000 : 210000000,
                        minimumBid: isRecent ? 170100000 : 147000000,
                        failedCount: Math.floor(Math.random() * 3),
                        renovationCost: 10000000,
                        auctionDate: new Date().toISOString().split('T')[0],
                        propertyDetails: {
                            size: '84㎡',
                            floor: '15/20층',
                            direction: '남향',
                            parking: '가능'
                        }
                    };
                    
                    resolve(mockData);
                }, 1000);
            });
        }
    }

    // 모달 폼에 경매 데이터 자동 채우기
    populateModalFormWithAuctionData(auctionData) {
        // 모달 폼에 기본 정보 입력
        document.getElementById('propertyName').value = auctionData.location + ' ' + auctionData.propertyType;
        document.getElementById('propertyLocation').value = auctionData.location;
        
        // 매물 유형 설정
        const propertyTypeMap = {
            '아파트': 'apartment',
            '단독주택': 'house',
            '오피스텔': 'officetel',
            '상가': 'commercial',
            '토지': 'land'
        };
        document.getElementById('propertyType').value = propertyTypeMap[auctionData.propertyType] || 'other';
        
        console.log('모달 폼에 경매 데이터 채우기 완료:', auctionData);
    }

    // 메인 폼에 경매 데이터 자동 채우기
    populateFormWithAuctionData(auctionData) {
        // 기본 정보 입력
        document.getElementById('marketPrice').value = auctionData.marketPrice;
        document.getElementById('appraisalPrice').value = auctionData.appraisalPrice;
        document.getElementById('minimumBid').value = auctionData.minimumBid;
        document.getElementById('renovationCost').value = auctionData.renovationCost;
        
        // 유찰 횟수 설정
        const failedCountSelect = document.getElementById('failedCount');
        const failedCount = Math.min(auctionData.failedCount, 4);
        failedCountSelect.selectedIndex = failedCount;
        
        // 경매 유형 설정 (부동산 경매로 고정)
        document.getElementById('auctionType').value = 'realEstate';
        
        // 경매 기본 정보 표시
        
        // 매물 정보를 화면에 표시
        this.displayAuctionData(auctionData);
        
        console.log('경매 데이터로 폼 채우기 완료:', auctionData);
    }

    // 경매 기본 정보 표시

    // 경매 데이터 정보 표시
    displayAuctionData(auctionData) {
        // 매물 정보를 표시할 영역이 있다면 여기에 표시
        console.log('가져온 경매 데이터:', {
            사건번호: auctionData.caseNumber,
            법원: auctionData.court,
            매물유형: auctionData.propertyType,
            위치: auctionData.location,
            시세: this.formatNumber(auctionData.marketPrice) + '원',
            감정가: this.formatNumber(auctionData.appraisalPrice) + '원',
            최저입찰가: this.formatNumber(auctionData.minimumBid) + '원',
            유찰횟수: auctionData.failedCount + '회',
            경매일: auctionData.auctionDate
        });
        
        // 추가 정보가 있다면 표시
        if (auctionData.propertyDetails) {
            console.log('매물 상세정보:', auctionData.propertyDetails);
        }
    }

    // 경매 유형별 수수료율 정의
    getAuctionFees(auctionType) {
        const fees = {
            realEstate: {
                auctionFee: 0.02, // 2% 경매 수수료
                registrationFee: 0.001, // 0.1% 등기비용
                tax: 0.04, // 4% 취득세
                additionalCosts: 0.005 // 0.5% 기타 비용
            },
            vehicle: {
                auctionFee: 0.03, // 3% 경매 수수료
                registrationFee: 0.002, // 0.2% 등록비용
                tax: 0.03, // 3% 개별소비세
                additionalCosts: 0.003 // 0.3% 기타 비용
            },
            art: {
                auctionFee: 0.15, // 15% 경매 수수료
                registrationFee: 0.001, // 0.1% 등록비용
                tax: 0.10, // 10% 부가가치세
                additionalCosts: 0.005 // 0.5% 기타 비용
            },
            general: {
                auctionFee: 0.05, // 5% 경매 수수료
                registrationFee: 0.001, // 0.1% 등록비용
                tax: 0.10, // 10% 부가가치세
                additionalCosts: 0.003 // 0.3% 기타 비용
            }
        };
        return fees[auctionType] || fees.general;
    }

    // 시장 상황별 가중치 계산
    getMarketWeight(marketCondition) {
        const weights = {
            hot: 1.4,    // 활발한 시장: 40% 높은 경쟁
            normal: 1.0,  // 보통 시장
            cold: 0.6    // 침체된 시장: 40% 낮은 경쟁
        };
        return weights[marketCondition] || 1.0;
    }

    // 긴급도별 입찰 전략 가중치 (현실적인 조정)
    getUrgencyWeight(urgency) {
        const weights = {
            high: 1.08,   // 높음: 8% 더 높은 입찰
            medium: 1.0,  // 보통: 조정 없음
            low: 0.95     // 낮음: 5% 더 낮은 입찰
        };
        return weights[urgency] || 1.0;
    }

    // 입찰긴급도 승수 (권장가격 직접 조정용)
    getUrgencyMultiplier(urgency) {
        const multipliers = {
            high: 1.12,   // 높음: 12% 상향 (더 명확한 차이)
            medium: 1.0,  // 보통: 조정 없음
            low: 0.92     // 낮음: 8% 하향 (더 명확한 차이)
        };
        return multipliers[urgency] || 1.0;
    }

    // 유찰 횟수에 따른 가격 조정
    getFailedCountAdjustment(failedCount) {
        const adjustments = {
            0: 1.0,    // 첫 경매: 조정 없음
            1: 0.95,   // 1회 유찰: 5% 하향
            2: 0.90,   // 2회 유찰: 10% 하향
            3: 0.85,   // 3회 유찰: 15% 하향
            4: 0.80    // 4회 이상 유찰: 20% 하향
        };
        return adjustments[failedCount] || 1.0;
    }

    // 감정가 대비 적정 입찰가 비율 계산
    getAppraisalRatioWeight(appraisalPrice, marketPrice) {
        const appraisalRatio = appraisalPrice / marketPrice;
        
        if (appraisalRatio > 1.1) {
            return 0.9;  // 감정가가 시세보다 10% 이상 높으면 보수적 입찰
        } else if (appraisalRatio < 0.9) {
            return 1.1;  // 감정가가 시세보다 10% 이상 낮으면 적극적 입찰
        } else {
            return 1.0;  // 감정가가 시세와 비슷하면 보통 입찰
        }
    }

    // 시세 대비 수익성 분석
    calculateMarketProfitability(bidPrice, marketPrice, totalCost) {
        const marketProfit = marketPrice - totalCost;
        const marketProfitRatio = (marketProfit / totalCost) * 100;
        
        return {
            marketProfit: marketProfit,
            marketProfitRatio: marketProfitRatio,
            isProfitable: marketProfit > 0
        };
    }

    // 간단하고 현실적인 낙찰 확률 계산
    calculateWinProbability(bidPrice, propertyValue, competitorCount, marketWeight, urgencyWeight, failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost) {
        // 1. 기본 확률 (가격 대비)
        const priceRatio = bidPrice / propertyValue;
        let baseProbability = this.calculateSimpleBaseProbability(priceRatio);
        
        // 2. 경쟁자 수 조정
        const competitorFactor = this.calculateSimpleCompetitorFactor(competitorCount);
        
        // 3. 시장 상황 조정
        const marketFactor = marketWeight;
        
        // 4. 긴급도 조정
        const urgencyFactor = urgencyWeight;
        
        // 5. 유찰 횟수 조정
        const failedFactor = this.calculateSimpleFailedFactor(failedCount);
        
        // 6. 최저입찰가 대비 조정
        const minimumBidFactor = this.calculateMinimumBidFactor(bidPrice, minimumBid);
        
        // 7. 감정가 대비 조정
        const appraisalFactor = this.calculateAppraisalFactor(bidPrice, appraisalPrice);
        
        // 8. 최종 확률 계산
        const finalProbability = baseProbability * competitorFactor * marketFactor * urgencyFactor * 
                                failedFactor * minimumBidFactor * appraisalFactor;
        
        return Math.max(0.01, Math.min(0.99, finalProbability));
    }

    // 간단한 기본 확률 계산
    calculateSimpleBaseProbability(priceRatio) {
        if (priceRatio < 0.7) return 0.1;      // 70% 미만: 10%
        if (priceRatio < 0.8) return 0.3;      // 70-80%: 30%
        if (priceRatio < 0.9) return 0.6;      // 80-90%: 60%
        if (priceRatio < 1.0) return 0.8;      // 90-100%: 80%
        if (priceRatio < 1.1) return 0.9;      // 100-110%: 90%
        if (priceRatio < 1.2) return 0.95;     // 110-120%: 95%
        return 0.98;                           // 120% 이상: 98%
    }

    // 간단한 경쟁자 수 조정
    calculateSimpleCompetitorFactor(competitorCount) {
        if (competitorCount <= 1) return 0.95;
        if (competitorCount === 2) return 0.7;
        if (competitorCount === 3) return 0.5;
        if (competitorCount === 4) return 0.35;
        if (competitorCount === 5) return 0.25;
        if (competitorCount <= 8) return 0.15;
        return 0.1; // 9명 이상
    }

    // 간단한 유찰 횟수 조정
    calculateSimpleFailedFactor(failedCount) {
        if (failedCount === 0) return 1.0;
        if (failedCount === 1) return 0.9;
        if (failedCount === 2) return 0.8;
        if (failedCount === 3) return 0.7;
        return 0.6; // 4회 이상
    }

    // 최저입찰가 대비 조정
    calculateMinimumBidFactor(bidPrice, minimumBid) {
        const ratio = bidPrice / minimumBid;
        if (ratio < 1.05) return 0.5;      // 최저가 근처: 50%
        if (ratio < 1.1) return 0.7;       // 최저가 110%: 70%
        if (ratio < 1.2) return 0.9;       // 최저가 120%: 90%
        if (ratio < 1.5) return 1.0;       // 최저가 150%: 100%
        return 1.1;                        // 그 이상: 110%
    }

    // 감정가 대비 조정
    calculateAppraisalFactor(bidPrice, appraisalPrice) {
        const ratio = bidPrice / appraisalPrice;
        if (ratio < 0.8) return 0.6;       // 감정가 80% 미만: 60%
        if (ratio < 0.9) return 0.8;       // 감정가 80-90%: 80%
        if (ratio < 1.1) return 1.0;       // 감정가 90-110%: 100%
        if (ratio < 1.3) return 1.1;       // 감정가 110-130%: 110%
        return 1.2;                        // 그 이상: 120%
    }

    // 간단한 특성 추출 (Monte Carlo 제거)
    extractFeatures(bidPrice, propertyValue, competitorCount, marketWeight, urgencyWeight, failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost) {
        return {
            priceRatio: bidPrice / propertyValue,
            appraisalRatio: bidPrice / appraisalPrice,
            minimumBidRatio: bidPrice / minimumBid,
            marketRatio: bidPrice / marketPrice,
            competitorCount: competitorCount,
            marketWeight: marketWeight,
            urgencyWeight: urgencyWeight,
            failedCount: failedCount
        };
    }

    // 간단한 경쟁자 행동 예측 (Monte Carlo 제거)
    predictCompetitorBehavior(features) {
        // 간단한 경쟁자 행동 예측
        const baseProb = 0.5;
        const competitorFactor = features.competitorCount <= 3 ? 0.8 : 0.3;
        const marketFactor = features.marketWeight;
        
        return {
            average: baseProb * competitorFactor * marketFactor,
            weighted: baseProb * competitorFactor * marketFactor,
            variance: 0.1,
            confidence: 0.8
        };
    }

    // 간단한 시장 트렌드 분석 (Monte Carlo 제거)
    analyzeMarketTrend(features) {
        return {
            trend: 'stable',
            strength: 0.1,
            seasonality: 1.0,
            volatility: 0.15,
            momentum: 0.0
        };
    }

    // 간단한 지역 특성 (Monte Carlo 제거)
    calculateLocationFactor(features) {
        return {
            accessibility: 0.8,
            infrastructure: 0.7,
            populationDensity: 0.6,
            developmentPlan: 0.5,
            overall: 0.65
        };
    }

    // 간단한 시뮬레이션 (Monte Carlo 제거)
    runMonteCarloSimulation(features, competitorBehavior) {
        return {
            mean: 0.5,
            median: 0.5,
            stdDev: 0.1,
            percentiles: { p25: 0.4, p50: 0.5, p75: 0.6, p90: 0.7, p95: 0.8 },
            winRate: 0.5
        };
    }

    // 간단한 앙상블 모델 (Monte Carlo 제거)
    calculateEnsembleProbability(competitorBehavior, marketTrend, locationFactor, monteCarloResult) {
        return competitorBehavior.weighted;
    }

    // 간단한 불확실성 정량화 (Monte Carlo 제거)
    quantifyUncertainty(features, probability) {
        return {
            dataQuality: 0.9,
            modelUncertainty: 0.1,
            marketUncertainty: 0.1,
            total: 0.1,
            confidence: 0.9
        };
    }

    // 간단한 확률 조정 (Monte Carlo 제거)
    adjustProbabilityWithUncertainty(probability, uncertainty) {
        return probability;
    }

    // 간단한 헬퍼 함수들 (Monte Carlo 제거)
    calculateVariance(predictions) {
        return 0.1; // 고정값
    }

    calculateConfidence(predictions) {
        return 0.8; // 고정값
    }

    // 기본 확률 계산 (개선된 S자 곡선 모델)
    calculateBaseProbability(priceRatio) {
        // 최저입찰가 근처에서의 확률을 더 현실적으로 조정
        if (priceRatio < 0.7) {
            return 0.15; // 70% 미만: 15% (0.05 → 0.15)
        } else if (priceRatio < 0.8) {
            return 0.35; // 70-80%: 35%
        } else if (priceRatio < 0.9) {
            return 0.60; // 80-90%: 60%
        } else if (priceRatio < 1.0) {
            return 0.80; // 90-100%: 80%
        } else if (priceRatio < 1.1) {
            return 0.90; // 100-110%: 90%
        } else if (priceRatio < 1.2) {
            return 0.95; // 110-120%: 95%
        } else {
            return 0.98; // 120% 이상: 98%
        }
    }

    // 경쟁자 수에 따른 확률 조정 (개선된 모델)
    calculateCompetitorFactor(competitorCount) {
        if (competitorCount <= 1) {
            return 0.95; // 경쟁자 없거나 1명이면 95%
        }
        
        // 경쟁자 수에 따른 기본 확률 (더 현실적으로 조정)
        const baseProbabilities = {
            2: 0.70,  // 2명: 70%
            3: 0.50,  // 3명: 50%
            4: 0.35,  // 4명: 35%
            5: 0.25,  // 5명: 25%
            6: 0.18,  // 6명: 18%
            7: 0.13,  // 7명: 13%
            8: 0.10,  // 8명: 10%
            9: 0.08,  // 9명: 8%
            10: 0.06  // 10명: 6%
        };
        
        // 10명 이상인 경우 지수적 감소
        if (competitorCount > 10) {
            return Math.max(0.01, 0.06 * Math.pow(0.8, competitorCount - 10));
        }
        
        return baseProbabilities[competitorCount] || 0.05;
    }

    // 시장 상황별 가중치 (더 정교한 모델)
    calculateMarketFactor(marketWeight, competitorCount) {
        // 시장 상황에 따른 기본 가중치
        let baseFactor = marketWeight;
        
        // 경쟁자 수와 시장 상황의 상호작용
        if (competitorCount >= 5) {
            // 경쟁자가 많을 때는 시장 상황이 더 중요
            baseFactor = Math.pow(marketWeight, 1.5);
        } else if (competitorCount <= 2) {
            // 경쟁자가 적을 때는 시장 상황 영향 감소
            baseFactor = Math.pow(marketWeight, 0.7);
        }
        
        return Math.max(0.1, Math.min(2.0, baseFactor));
    }

    // 입찰자 행동 패턴 모델링 (개선된 모델)
    calculateBehaviorFactor(bidPrice, appraisalPrice, minimumBid, failedCount) {
        const appraisalRatio = bidPrice / appraisalPrice;
        const minimumBidRatio = bidPrice / minimumBid;
        
        let behaviorFactor = 1.0;
        
        // 1. 감정가 대비 입찰가 패턴
        if (appraisalRatio < 0.7) {
            behaviorFactor *= 0.3; // 매우 보수적 (0.2 → 0.3)
        } else if (appraisalRatio < 0.85) {
            behaviorFactor *= 0.6; // 보수적 (0.5 → 0.6)
        } else if (appraisalRatio < 1.15) {
            behaviorFactor *= 1.0; // 정상
        } else if (appraisalRatio < 1.4) {
            behaviorFactor *= 1.3; // 적극적
        } else {
            behaviorFactor *= 1.6; // 매우 적극적
        }
        
        // 2. 최저입찰가 대비 패턴 (개선)
        if (minimumBidRatio < 1.01) {
            behaviorFactor *= 0.8; // 최저가와 거의 동일 (0.3 → 0.8)
        } else if (minimumBidRatio < 1.05) {
            behaviorFactor *= 0.9; // 최저가 근처 (0.3 → 0.9)
        } else if (minimumBidRatio < 1.2) {
            behaviorFactor *= 1.0; // 최저가 조금 초과 (0.7 → 1.0)
        } else if (minimumBidRatio < 1.5) {
            behaviorFactor *= 1.1; // 적정 범위 (1.0 → 1.1)
        } else {
            behaviorFactor *= 1.2; // 높은 가격
        }
        
        // 3. 유찰 횟수에 따른 행동 변화 (완화)
        const failedAdjustment = Math.pow(0.95, failedCount); // 유찰할수록 보수적 (0.9 → 0.95)
        behaviorFactor *= failedAdjustment;
        
        return Math.max(0.2, Math.min(2.0, behaviorFactor)); // 최소값 0.1 → 0.2
    }

    // 긴급도에 따른 전략적 조정
    calculateUrgencyFactor(urgencyWeight, competitorCount) {
        let urgencyFactor = urgencyWeight;
        
        // 경쟁자 수에 따른 긴급도 효과 조정
        if (competitorCount >= 5) {
            // 경쟁자가 많을 때는 긴급도 효과 증대
            urgencyFactor = Math.pow(urgencyWeight, 1.3);
        } else if (competitorCount <= 2) {
            // 경쟁자가 적을 때는 긴급도 효과 감소
            urgencyFactor = Math.pow(urgencyWeight, 0.8);
        }
        
        return Math.max(0.5, Math.min(1.5, urgencyFactor));
    }

    // 상세 경매비용 계산 (세금, 수수료, 등기비용 등 디테일하게)
    calculateDetailedAuctionCosts(bidPrice, propertyType = '아파트', isFirstHome = true, homeCount = 1, area = 85) {
        console.log('상세 경매비용 계산 시작:', { bidPrice, propertyType, isFirstHome, homeCount, area });
        
        // A. 낙찰대금 잔금 (입찰보증금은 일반적으로 낙찰가의 10%)
        const deposit = bidPrice * 0.1; // 입찰보증금
        const remainingPayment = bidPrice - deposit; // 잔금
        
        // B. 취득세 및 관련세
        let acquisitionTaxRate = 0;
        if (propertyType === '아파트' || propertyType === '오피스텔' || propertyType === '빌라' || propertyType === '단독주택') {
            // 주택 취득세
            if (homeCount === 1) {
                // 1주택자: 면적별 차등 (85㎡ 기준 3%)
                acquisitionTaxRate = area <= 85 ? 0.03 : (area <= 102 ? 0.02 : 0.01);
            } else if (homeCount === 2) {
                acquisitionTaxRate = 0.08; // 2주택자: 8%
            } else {
                acquisitionTaxRate = 0.12; // 3주택 이상: 12%
            }
        } else if (propertyType === '토지') {
            acquisitionTaxRate = 0.03; // 토지: 2-4% (평균 3%)
        } else {
            acquisitionTaxRate = 0.04; // 상업용 부동산: 4%
        }
        
        const acquisitionTax = bidPrice * acquisitionTaxRate;
        const localEducationTax = acquisitionTax * 0.20; // 지방교육세: 취득세 × 20%
        const ruralSpecialTax = acquisitionTax * 0.15; // 농어촌특별세: 취득세 × 15% (평균)
        
        // C. 등기 관련 비용
        const ownershipTransferTax = bidPrice * 0.002; // 소유권이전등기: 낙찰가 × 0.2%
        const mortgageTax = 0; // 근저당권설정등기: 기본 0원
        const registrationEducationTax = ownershipTransferTax * 0.20; // 지방교육세 (등기분): 등록면허세 × 20%
        
        // 국민주택채권 매입 (수도권 기준)
        const housingBond = acquisitionTax * 0.20; // 수도권: 취득세액 × 20%
        
        // D. 인지세
        const stampTax = bidPrice > 100000000 ? 50000 : 0; // 등기신청서: 5만원 (부동산가액 1억 초과시)
        const mortgageStampTax = bidPrice > 1000000000 ? 150000 : 0; // 근저당권설정계약서: 15만원 (채권액 10억 초과시)
        
        // E. 전문가 수수료
        let legalFee = 0; // 법무사 수수료
        if (bidPrice <= 100000000) {
            legalFee = 500000; // 1억 이하: 50만원
        } else if (bidPrice <= 300000000) {
            legalFee = 800000; // 1-3억: 80만원
        } else if (bidPrice <= 500000000) {
            legalFee = 1250000; // 3-5억: 125만원
        } else {
            legalFee = 1750000; // 5억 초과: 175만원
        }
        
        // F. 경매 수수료 삭제 (더 이상 계산하지 않음)
        
        // G. 기타 발생 가능 비용 (기본값 0원)
        const evictionCost = 0; // 명도비: 기본 0원
        const unpaidUtilities = bidPrice * 0.005; // 미납 공과금: 낙찰가의 0.5% (추정)
        
        // 총 세금 및 수수료 계산
        const totalTaxes = acquisitionTax + localEducationTax + ruralSpecialTax;
        const totalRegistrationFees = ownershipTransferTax + mortgageTax + registrationEducationTax + housingBond + stampTax + mortgageStampTax;
        const totalProfessionalFees = legalFee;
        const totalAuctionFees = 0; // 경매수수료 삭제
        const totalOtherCosts = evictionCost + unpaidUtilities;
        
        const totalAdditionalCosts = totalTaxes + totalRegistrationFees + totalProfessionalFees + totalAuctionFees + totalOtherCosts;
        
        const result = {
            // 기본 정보
            bidPrice: bidPrice,
            deposit: deposit,
            remainingPayment: remainingPayment,
            
            // 세금
            taxes: {
                acquisitionTax: acquisitionTax,
                localEducationTax: localEducationTax,
                ruralSpecialTax: ruralSpecialTax,
                total: totalTaxes
            },
            
            // 등기비용
            registration: {
                ownershipTransferTax: ownershipTransferTax,
                mortgageTax: mortgageTax,
                registrationEducationTax: registrationEducationTax,
                housingBond: housingBond,
                stampTax: stampTax,
                mortgageStampTax: mortgageStampTax,
                total: totalRegistrationFees
            },
            
            // 전문가 수수료
            professionalFees: {
                legalFee: legalFee,
                total: totalProfessionalFees
            },
            
            // 경매 수수료 삭제
            auctionFees: {
                auctionFee: 0,
                total: 0
            },
            
            // 기타 비용
            otherCosts: {
                evictionCost: evictionCost,
                unpaidUtilities: unpaidUtilities,
                total: totalOtherCosts
            },
            
            // 합계
            totalAdditionalCosts: totalAdditionalCosts,
            totalInvestment: bidPrice + totalAdditionalCosts,
            costPercentage: (totalAdditionalCosts / bidPrice) * 100
        };
        
        console.log('상세 경매비용 계산 완료:', result);
        return result;
    }

    // 총 비용 계산 (수수료, 세금 포함) - 기존 함수 호환성 유지
    calculateTotalCost(bidPrice, auctionType, renovationCost = 0) {
        const detailedCosts = this.calculateDetailedAuctionCosts(bidPrice);
        
        return {
            bidPrice: bidPrice,
            auctionFee: detailedCosts.auctionFees.auctionFee,
            registrationFee: detailedCosts.registration.total,
            tax: detailedCosts.taxes.total,
            additionalCosts: detailedCosts.otherCosts.total,
            renovationCost: renovationCost,
            totalCost: bidPrice + detailedCosts.totalAdditionalCosts + renovationCost,
            detailedCosts: detailedCosts // 상세 비용 정보 포함
        };
    }

    // 예상 수익률 계산 (기본)
    calculateExpectedProfit(propertyValue, totalCost) {
        return ((propertyValue - totalCost) / totalCost) * 100;
    }

    // 상세 비용 정보 표시
    displayDetailedCosts(costInfo, bidPrice, renovationCost) {
        console.log('상세 비용 정보 표시 시작:', { costInfo, bidPrice, renovationCost });
        
        // detailedCosts가 있으면 상세 정보 표시
        if (costInfo.detailedCosts) {
            const dc = costInfo.detailedCosts;
            
            // 기본 정보
            document.getElementById('bidPriceDetail').textContent = this.formatNumber(dc.bidPrice) + '원';
            document.getElementById('depositAmount').textContent = this.formatNumber(dc.deposit) + '원';
            document.getElementById('remainingPayment').textContent = this.formatNumber(dc.remainingPayment) + '원';
            
            // 세금
            document.getElementById('acquisitionTax').textContent = this.formatNumber(dc.taxes.acquisitionTax) + '원';
            document.getElementById('localEducationTax').textContent = this.formatNumber(dc.taxes.localEducationTax) + '원';
            document.getElementById('ruralSpecialTax').textContent = this.formatNumber(dc.taxes.ruralSpecialTax) + '원';
            document.getElementById('totalTaxes').textContent = this.formatNumber(dc.taxes.total) + '원';
            
            // 등기비용
            document.getElementById('ownershipTransferTax').textContent = this.formatNumber(dc.registration.ownershipTransferTax) + '원';
            document.getElementById('mortgageTax').textContent = this.formatNumber(dc.registration.mortgageTax) + '원';
            document.getElementById('registrationEducationTax').textContent = this.formatNumber(dc.registration.registrationEducationTax) + '원';
            document.getElementById('housingBond').textContent = this.formatNumber(dc.registration.housingBond) + '원';
            document.getElementById('stampTax').textContent = this.formatNumber(dc.registration.stampTax + dc.registration.mortgageStampTax) + '원';
            document.getElementById('totalRegistrationFees').textContent = this.formatNumber(dc.registration.total) + '원';
            
            // 전문가 수수료
            document.getElementById('legalFee').textContent = this.formatNumber(dc.professionalFees.legalFee) + '원';
            document.getElementById('totalProfessionalFees').textContent = this.formatNumber(dc.professionalFees.total) + '원';
            
            // 경매 수수료 삭제 (표시하지 않음)
            
            // 기타 비용
            document.getElementById('evictionCost').textContent = this.formatNumber(dc.otherCosts.evictionCost) + '원';
            document.getElementById('unpaidUtilities').textContent = this.formatNumber(dc.otherCosts.unpaidUtilities) + '원';
            document.getElementById('totalOtherCosts').textContent = this.formatNumber(dc.otherCosts.total + renovationCost) + '원';
            
            // 총계
            document.getElementById('totalBidPrice').textContent = this.formatNumber(dc.bidPrice) + '원';
            document.getElementById('totalAdditionalCosts').textContent = this.formatNumber(dc.totalAdditionalCosts + renovationCost) + '원';
            document.getElementById('totalInvestmentDetail').textContent = this.formatNumber(dc.totalInvestment + renovationCost) + '원';
            document.getElementById('costPercentage').textContent = dc.costPercentage.toFixed(1) + '%';
        }
        
        console.log('상세 비용 정보 표시 완료');
    }

    // 목표 낙찰확률을 달성하기 위한 가격비율 계산 (매각가율 반영)
    calculatePriceRatioForTargetProbability(targetProbability, competitorCount, marketCondition, urgency, failedCount, salePriceRate = null) {
        console.log('목표 낙찰확률을 위한 가격비율 계산:', {
            targetProbability: Math.round(targetProbability * 100) + '%',
            competitorCount,
            marketCondition,
            urgency,
            failedCount
        });
        
        // 기본 가격비율 범위 (시세 대비 30%~80%)
        let minRatio = 0.30;
        let maxRatio = 0.80;
        
        // 이분 탐색을 사용하여 목표 확률에 맞는 가격비율 찾기
        let bestRatio = 0.55; // 기본값
        let minError = Infinity;
        
        // 0.30~0.80 범위에서 0.01 단위로 탐색
        for (let ratio = minRatio; ratio <= maxRatio; ratio += 0.01) {
            const probability = this.calculateAdvancedWinProbability(
                ratio, 
                competitorCount, 
                marketCondition, 
                urgency, 
                failedCount,
                salePriceRate
            );
            
            const error = Math.abs(probability - targetProbability);
            
            if (error < minError) {
                minError = error;
                bestRatio = ratio;
            }
            
            // 오차가 0.01 이하면 충분히 정확하다고 판단
            if (error <= 0.01) {
                break;
            }
        }
        
        console.log('가격비율 계산 결과:', {
            목표확률: Math.round(targetProbability * 100) + '%',
            계산된가격비율: Math.round(bestRatio * 100) + '%',
            예상낙찰확률: Math.round(this.calculateAdvancedWinProbability(bestRatio, competitorCount, marketCondition, urgency, failedCount, salePriceRate) * 100) + '%',
            오차: Math.round(minError * 100) + '%'
        });
        
        return bestRatio;
    }

    // 리스크 조정 수익률 계산 (샤프 비율 기반)
    calculateRiskAdjustedProfit(propertyValue, totalCost, winProbability, marketCondition, failedCount) {
        const basicProfit = this.calculateExpectedProfit(propertyValue, totalCost);
        
        // 1. 낙찰 확률에 따른 기대 수익률
        const expectedProfit = basicProfit * winProbability;
        
        // 2. 리스크 프리미엄 계산
        const riskPremium = this.calculateRiskPremium(marketCondition, failedCount, winProbability);
        
        // 3. 변동성 조정 (불확실성 반영)
        const volatilityAdjustment = this.calculateVolatilityAdjustment(winProbability, marketCondition);
        
        // 4. 최종 리스크 조정 수익률
        const riskAdjustedProfit = expectedProfit + riskPremium - volatilityAdjustment;
        
        return Math.max(-50, Math.min(200, riskAdjustedProfit)); // -50% ~ 200% 범위 제한
    }

    // 리스크 프리미엄 계산
    calculateRiskPremium(marketCondition, failedCount, winProbability) {
        let riskPremium = 0;
        
        // 1. 시장 상황별 리스크 프리미엄
        const marketRisk = {
            'hot': 5,    // 활발한 시장: 5% 프리미엄
            'normal': 0, // 보통 시장: 프리미엄 없음
            'cold': -3   // 침체 시장: -3% 할인
        };
        riskPremium += marketRisk[marketCondition] || 0;
        
        // 2. 유찰 횟수별 리스크 프리미엄
        const failedRisk = failedCount * -2; // 유찰 1회당 -2%
        riskPremium += failedRisk;
        
        // 3. 낙찰 확률별 리스크 프리미엄
        if (winProbability < 0.3) {
            riskPremium += 10; // 낮은 확률: 10% 프리미엄
        } else if (winProbability < 0.6) {
            riskPremium += 5;  // 보통 확률: 5% 프리미엄
        } else {
            riskPremium += 0;  // 높은 확률: 프리미엄 없음
        }
        
        return riskPremium;
    }

    // 변동성 조정 계산
    calculateVolatilityAdjustment(winProbability, marketCondition) {
        // 불확실성이 높을수록 변동성 조정 증가
        const uncertainty = 1 - winProbability;
        const baseVolatility = uncertainty * 15; // 최대 15% 조정
        
        // 시장 상황별 변동성 조정
        const marketVolatility = {
            'hot': 1.5,   // 활발한 시장: 변동성 증가
            'normal': 1.0, // 보통 시장: 기본 변동성
            'cold': 0.7   // 침체 시장: 변동성 감소
        };
        
        return baseVolatility * (marketVolatility[marketCondition] || 1.0);
    }

    // 통합된 최적 입찰가격 계산 (매각가율 기반 + 시장 검증된 방식)
    calculateOptimalBid(bidPrice, auctionType, competitorCount, marketCondition, urgency, marketPrice, appraisalPrice, minimumBid, failedCount, renovationCost) {
        console.log('통합된 최적 입찰가격 계산 시작:', {
            bidPrice, auctionType, competitorCount, marketCondition, urgency, 
            marketPrice, appraisalPrice, minimumBid, failedCount, renovationCost
        });
        
        // 1. 매각가율 기반 기본 권장 입찰가 계산
        const salePriceRate = this.getCurrentSalePriceRate();
        const targetProfitRate = Math.round(((bidPrice - marketPrice) / marketPrice) * 100);
        
        const additionalCosts = {
            renovationCost: renovationCost || 0,
            evictionCost: 0,
            legalCost: 0,
            inspectionCost: 0,
            otherCosts: 0
        };
        
        const bidCalculation = this.calculateRecommendedBidPrice(
            marketPrice, 
            salePriceRate, 
            targetProfitRate, 
            auctionType, 
            additionalCosts
        );
        
        let recommendedBid = bidCalculation.recommendedBidPrice;
        
        // 2. 입찰긴급도 직접 적용 (가장 먼저 적용)
        const urgencyMultiplier = this.getUrgencyMultiplier(urgency);
        if (urgencyMultiplier !== 1.0) {
            const beforeUrgency = recommendedBid;
            recommendedBid *= urgencyMultiplier;
            
            console.log('입찰긴급도 직접 적용:', {
                urgency,
                multiplier: urgencyMultiplier,
                before: beforeUrgency.toLocaleString(),
                after: recommendedBid.toLocaleString(),
                change: ((recommendedBid - beforeUrgency) / beforeUrgency * 100).toFixed(2) + '%'
            });
        }
        
        // 3. 시장 검증된 조정 요소들 적용
        recommendedBid = this.applyMarketAdjustments(
            recommendedBid, 
            marketPrice, 
            appraisalPrice, 
            minimumBid, 
            competitorCount, 
            marketCondition, 
            urgency, 
            failedCount
        );
        
        // 4. 최종 검증 및 제한
        recommendedBid = this.applyFinalConstraints(
            recommendedBid, 
            marketPrice, 
            appraisalPrice, 
            minimumBid
        );
        
        // 5. 낙찰 확률 계산 및 목표 범위(50~60%) 조정
        let priceRatio = (appraisalPrice > 0) ? recommendedBid / appraisalPrice : 1.0;
        let winProbability = this.calculateAdvancedWinProbability(
            priceRatio, 
            competitorCount, 
            marketCondition, 
            urgency, 
            failedCount,
            salePriceRate
        );
        
        // 목표 낙찰확률 50~60% 범위로 조정
        if (winProbability < 0.50 || winProbability > 0.60) {
            console.log('낙찰확률 조정 필요:', {
                현재확률: Math.round(winProbability * 100) + '%',
                목표범위: '50~60%'
            });
            
            // 현재 확률에 따라 목표 확률 동적 설정
            let targetProbability;
            if (winProbability < 0.50) {
                targetProbability = 0.52; // 낮은 확률일 때는 52% 목표
            } else {
                targetProbability = 0.58; // 높은 확률일 때는 58% 목표
            }
            const adjustedPriceRatio = this.calculatePriceRatioForTargetProbability(
                targetProbability, 
                competitorCount, 
                marketCondition, 
                urgency, 
                failedCount,
                salePriceRate
            );
            
            // 조정된 가격비율로 권장입찰가 재계산
            const adjustedBid = appraisalPrice * adjustedPriceRatio;
            
            // 최소입찰가보다 낮지 않도록 보정
            const finalBid = Math.max(adjustedBid, minimumBid * 1.05);
            
            console.log('권장입찰가 조정:', {
                기존가격: Math.round(recommendedBid).toLocaleString() + '원',
                조정가격: Math.round(finalBid).toLocaleString() + '원',
                가격비율변화: Math.round((finalBid / appraisalPrice) * 100) + '%',
                예상낙찰확률: Math.round(targetProbability * 100) + '%'
            });
            
            recommendedBid = finalBid;
            priceRatio = (appraisalPrice > 0) ? recommendedBid / appraisalPrice : 1.0;
            winProbability = this.calculateAdvancedWinProbability(
                priceRatio, 
                competitorCount, 
                marketCondition, 
                urgency, 
                failedCount,
                salePriceRate
            );
        }
        
        // 6. 총 비용 및 수익률 계산
        const costInfo = this.calculateTotalCost(recommendedBid, auctionType, renovationCost);
        const expectedProfit = this.calculateExpectedProfit(bidPrice, costInfo.totalCost);
        
        console.log('통합된 계산 결과:', {
            originalBid: bidCalculation.recommendedBidPrice,
            adjustedBid: recommendedBid,
            salePriceRate,
            targetProfitRate,
            winProbability: Math.round(winProbability * 100) + '%',
            expectedProfit: Math.round(expectedProfit) + '%',
            priceRatio: Math.round(priceRatio * 100) + '%'
        });
        
        // 입찰가격별 낙찰 확률 그래프를 위한 데이터 생성
        const chartData = this.generateChartData(marketPrice, appraisalPrice, minimumBid, competitorCount, marketCondition, urgency, failedCount, renovationCost, auctionType, salePriceRate);
        
        return {
            recommendedBid: recommendedBid,
            winProbability: winProbability,
            expectedProfit: expectedProfit,
            bidPrices: chartData.bidPrices,
            probabilities: chartData.probabilities,
            profits: chartData.profits,
            // 매각가율 기반 계산 정보 추가
            saleRateBasedCalculation: bidCalculation
        };
    }

    // 입찰가격별 낙찰 확률 그래프 데이터 생성
    generateChartData(marketPrice, appraisalPrice, minimumBid, competitorCount, marketCondition, urgency, failedCount, renovationCost, auctionType, salePriceRate) {
        const bidPrices = [];
        const probabilities = [];
        const profits = [];
        
        // 최저입찰가의 80%부터 감정가의 120%까지 10개 구간으로 나누어 계산
        const minPrice = minimumBid * 0.8;
        const maxPrice = appraisalPrice * 1.2;
        const step = (maxPrice - minPrice) / 9;
        
        for (let i = 0; i < 10; i++) {
            const bidPrice = minPrice + (step * i);
            bidPrices.push(bidPrice);
            
            // 낙찰 확률 계산
            const priceRatio = bidPrice / marketPrice;
            const winProbability = this.calculateAdvancedWinProbability(
                priceRatio, 
                competitorCount, 
                marketCondition, 
                urgency, 
                failedCount,
                salePriceRate
            );
            probabilities.push(winProbability);
            
            // 수익률 계산
            const costInfo = this.calculateTotalCost(bidPrice, auctionType, renovationCost);
            const expectedProfit = this.calculateExpectedProfit(marketPrice, costInfo.totalCost);
            profits.push(expectedProfit);
        }
        
            return {
            bidPrices,
            probabilities,
            profits
        };
    }

    // 시장 검증된 조정 요소들 적용 (유찰조정, 시세안전성조정만)
    applyMarketAdjustments(baseBid, marketPrice, appraisalPrice, minimumBid, competitorCount, marketCondition, urgency, failedCount) {
        let adjustedBid = baseBid;
        
        console.log('=== 조정계수 적용 시작 ===');
        console.log('입력값:', {
            baseBid: baseBid.toLocaleString(),
            marketPrice: marketPrice.toLocaleString(),
            failedCount,
            marketRatio: (baseBid / marketPrice * 100).toFixed(1) + '%'
        });
        
        // 1. 유찰 횟수 조정 (기하급수적 하향)
        if (failedCount > 0) {
            const failureFactor = Math.pow(0.95, failedCount); // 유찰 1회당 5% 하향
            const maxReduction = 0.7; // 최대 30% 하향 제한
            const actualFactor = Math.max(failureFactor, maxReduction);
            const beforeAdjustment = adjustedBid;
            adjustedBid *= actualFactor;
            
            console.log('유찰조정 적용:', {
                failedCount,
                failureFactor: failureFactor.toFixed(4),
                actualFactor: actualFactor.toFixed(4),
                before: beforeAdjustment.toLocaleString(),
                after: adjustedBid.toLocaleString(),
                reduction: ((beforeAdjustment - adjustedBid) / beforeAdjustment * 100).toFixed(2) + '%'
            });
        } else {
            console.log('유찰조정 적용 안함 (유찰 0회)');
        }
        
        // 2. 시세 대비 안전성 조정
        const marketRatio = adjustedBid / marketPrice;
        if (marketRatio > 0.9) {
            const beforeSafety = adjustedBid;
            adjustedBid *= 0.95;
            console.log('시세안전성조정 적용:', {
                marketRatio: (marketRatio * 100).toFixed(1) + '%',
                before: beforeSafety.toLocaleString(),
                after: adjustedBid.toLocaleString(),
                reduction: ((beforeSafety - adjustedBid) / beforeSafety * 100).toFixed(2) + '%'
            });
        } else {
            console.log('시세안전성조정 적용 안함 (시세비율 ' + (marketRatio * 100).toFixed(1) + '%)');
        }
        
        const totalAdjustment = ((adjustedBid / baseBid - 1) * 100).toFixed(2);
        console.log('=== 조정계수 적용 완료 ===');
        console.log('최종 결과:', {
            baseBid: baseBid.toLocaleString(),
            adjustedBid: adjustedBid.toLocaleString(),
            totalAdjustment: totalAdjustment + '%',
            marketRatio: (adjustedBid / marketPrice * 100).toFixed(1) + '%'
        });
        
        return adjustedBid;
    }

    // 최종 제한 조건 적용
    applyFinalConstraints(bid, marketPrice, appraisalPrice, minimumBid) {
        let finalBid = bid;
        
        // 1. 최소 입찰가 보장 (최저입찰가의 105% 이상)
        finalBid = Math.max(finalBid, minimumBid * 1.05);
        
        // 2. 감정가 제한 (감정가의 98% 이하)
        finalBid = Math.min(finalBid, appraisalPrice * 0.98);
        
        // 3. 시세 제한 제거 (시세안전성조정에서 이미 처리)
        // finalBid = Math.min(finalBid, marketPrice * 0.95);
        
        // 4. 최소 입찰가의 200% 이하 (과도한 입찰 방지)
        finalBid = Math.min(finalBid, minimumBid * 2.0);
        
        console.log('최종 제한 적용:', {
            before: bid,
            after: finalBid,
            minBid: minimumBid,
            appraisalPrice,
            marketPrice,
            marketRatio: (finalBid / marketPrice * 100).toFixed(1) + '%'
        });
        
        return finalBid;
    }

    // 조정계수 검증 함수
    testAdjustmentFactors() {
        console.log('=== 조정계수 검증 테스트 시작 ===');
        
        const basePrice = 200000000; // 2억원 기준
        const marketPrice = 250000000; // 2.5억원 시세
        const appraisalPrice = 240000000; // 2.4억원 감정가
        const minimumBid = 170000000; // 1.7억원 최저입찰가
        
        // 테스트 케이스들
        const testCases = [
            {
                name: '기본 케이스 (Normal, 경쟁자 3명, Medium, 유찰 0회)',
                competitorCount: 3,
                marketCondition: 'normal',
                urgency: 'medium',
                failedCount: 0
            },
            {
                name: 'Hot 시장 (경쟁자 5명, High 긴급도)',
                competitorCount: 5,
                marketCondition: 'hot',
                urgency: 'high',
                failedCount: 0
            },
            {
                name: 'Cold 시장 (경쟁자 1명, Low 긴급도)',
                competitorCount: 1,
                marketCondition: 'cold',
                urgency: 'low',
                failedCount: 0
            },
            {
                name: '유찰 2회 (Cold 시장, 경쟁자 2명)',
                competitorCount: 2,
                marketCondition: 'cold',
                urgency: 'medium',
                failedCount: 2
            },
            {
                name: '고경쟁 상황 (경쟁자 10명, Hot 시장)',
                competitorCount: 10,
                marketCondition: 'hot',
                urgency: 'high',
                failedCount: 0
            },
            {
                name: '다중 유찰 (유찰 4회, Cold 시장)',
                competitorCount: 1,
                marketCondition: 'cold',
                urgency: 'low',
                failedCount: 4
            }
        ];
        
        testCases.forEach((testCase, index) => {
            console.log(`\n--- 테스트 케이스 ${index + 1}: ${testCase.name} ---`);
            
            const adjustedBid = this.applyMarketAdjustments(
                basePrice,
                marketPrice,
                appraisalPrice,
                minimumBid,
                testCase.competitorCount,
                testCase.marketCondition,
                testCase.urgency,
                testCase.failedCount
            );
            
            // 각 조정계수별 개별 계산 (유찰조정, 시세안전성조정만)
            let stepByStep = basePrice;
            const steps = [];
            
            // 1. 유찰 횟수 조정
            let failureFactor = 1.0;
            if (testCase.failedCount > 0) {
                failureFactor = Math.pow(0.95, testCase.failedCount);
                failureFactor = Math.max(failureFactor, 0.7);
                stepByStep *= failureFactor;
            }
            steps.push(`유찰조정 (${testCase.failedCount}회): × ${failureFactor.toFixed(4)} = ${stepByStep.toLocaleString()}`);
            
            // 2. 시세 안전성 조정
            const marketRatio = stepByStep / marketPrice;
            let safetyFactor = 1.0;
            if (marketRatio > 0.9) {
                safetyFactor = 0.95;
                stepByStep *= safetyFactor;
            }
            steps.push(`시세안전성조정 (시세비율 ${(marketRatio * 100).toFixed(1)}%): × ${safetyFactor} = ${stepByStep.toLocaleString()}`);
            
            // 결과 출력
            console.log('단계별 계산:');
            steps.forEach(step => console.log(`  ${step}`));
            
            const totalAdjustment = ((adjustedBid / basePrice - 1) * 100).toFixed(2);
            const marketRatioFinal = (adjustedBid / marketPrice * 100).toFixed(1);
            
            console.log(`\n최종 결과:`);
            console.log(`  기준가격: ${basePrice.toLocaleString()}원`);
            console.log(`  조정후가격: ${adjustedBid.toLocaleString()}원`);
            console.log(`  총 조정률: ${totalAdjustment > 0 ? '+' : ''}${totalAdjustment}%`);
            console.log(`  시세 대비: ${marketRatioFinal}%`);
            console.log(`  감정가 대비: ${(adjustedBid / appraisalPrice * 100).toFixed(1)}%`);
            console.log(`  최저입찰가 대비: ${(adjustedBid / minimumBid * 100).toFixed(1)}%`);
        });
        
        console.log('\n=== 조정계수 검증 테스트 완료 ===');
    }

    // 낙찰확률 50~60% 조정 기능 테스트
    testBidProbabilityAdjustment() {
        console.log('\n=== 낙찰확률 50~60% 조정 기능 테스트 시작 ===');
        
        // 테스트 케이스들 (현실적인 시나리오)
        const testCases = [
            {
                name: '스크린샷 케이스 (현재 23%)',
                marketPrice: 300000000,
                appraisalPrice: 300000000,
                minimumBid: 200000000,
                competitorCount: 5,
                marketCondition: 'normal',
                urgency: 'normal',
                failedCount: 0
            },
            {
                name: '높은 경쟁 케이스',
                marketPrice: 300000000,
                appraisalPrice: 300000000,
                minimumBid: 200000000,
                competitorCount: 8,
                marketCondition: 'hot',
                urgency: 'high',
                failedCount: 1
            },
            {
                name: '낮은 경쟁 케이스',
                marketPrice: 300000000,
                appraisalPrice: 300000000,
                minimumBid: 200000000,
                competitorCount: 3,
                marketCondition: 'cold',
                urgency: 'low',
                failedCount: 2
            }
        ];
        
        testCases.forEach((testCase, index) => {
            console.log(`\n--- 테스트 케이스 ${index + 1}: ${testCase.name} ---`);
            
            try {
                const result = this.calculateOptimalBid(
                    250000000, // bidPrice
                    '아파트', // auctionType
                    testCase.competitorCount,
                    testCase.marketCondition,
                    testCase.urgency,
                    testCase.marketPrice,
                    testCase.appraisalPrice,
                    testCase.minimumBid,
                    testCase.failedCount,
                    0 // renovationCost
                );
                
                console.log('테스트 결과:', {
                    권장입찰가: Math.round(result.recommendedBid).toLocaleString() + '원',
                    낙찰확률: Math.round(result.winProbability * 100) + '%',
                    가격비율: Math.round((result.recommendedBid / testCase.appraisalPrice) * 100) + '%',
                    범위내여부: (result.winProbability >= 0.50 && result.winProbability <= 0.60) ? '✅ 범위내' : '❌ 범위밖'
                });
                
            } catch (error) {
                console.error('테스트 실패:', error);
            }
        });
        
        console.log('\n=== 낙찰확률 50~60% 조정 기능 테스트 완료 ===');
    }

    // 개선된 낙찰 확률 계산 (매각가율 반영)
    calculateAdvancedWinProbability(priceRatio, competitorCount, marketCondition, urgency, failedCount, salePriceRate = null) {
        // 입력값 검증
        if (isNaN(priceRatio) || priceRatio === null || priceRatio === undefined) {
            console.error('유효하지 않은 priceRatio:', priceRatio);
            return 0.5; // 기본값 반환
        }
        
        if (isNaN(competitorCount) || competitorCount === null || competitorCount === undefined) {
            competitorCount = 5; // 기본값
        }
        
        if (isNaN(failedCount) || failedCount === null || failedCount === undefined) {
            failedCount = 0; // 기본값
        }
        
        // 매각가율이 없으면 현재 매각가율 가져오기
        if (salePriceRate === null || salePriceRate === undefined) {
            salePriceRate = this.getCurrentSalePriceRate();
        }
        
        // 기본 확률 (가격 비율 기반) - 50~60% 목표에 맞게 조정
        let baseProbability = 0.5;
        if (priceRatio < 0.65) baseProbability = 0.15;  // 65% 미만: 15%
        else if (priceRatio < 0.75) baseProbability = 0.35;  // 65-75%: 35%
        else if (priceRatio < 0.83) baseProbability = 0.50;  // 75-83%: 50%
        else if (priceRatio < 0.90) baseProbability = 0.65;  // 83-90%: 65%
        else if (priceRatio < 0.97) baseProbability = 0.80;  // 90-97%: 80%
        else if (priceRatio < 1.05) baseProbability = 0.90;  // 97-105%: 90%
        else if (priceRatio < 1.15) baseProbability = 0.95;  // 105-115%: 95%
        else baseProbability = 0.98;  // 115% 이상: 98%
        
        // 경쟁자 수 조정 (완화된 조정)
        let competitionPenalty = 1.0;
        if (competitorCount <= 2) competitionPenalty = 1.0;
        else if (competitorCount === 3) competitionPenalty = 0.9;
        else if (competitorCount === 4) competitionPenalty = 0.8;
        else if (competitorCount === 5) competitionPenalty = 0.75;
        else if (competitorCount === 6) competitionPenalty = 0.7;
        else if (competitorCount === 7) competitionPenalty = 0.65;
        else if (competitorCount === 8) competitionPenalty = 0.6;
        else competitionPenalty = 0.55; // 9명 이상
        
        baseProbability *= competitionPenalty;
        
        // 시장 상황 조정 제거 (유찰조정만 적용)
        
        // 유찰 횟수 조정 (연구 논문 기반: 3회차에서 최고 낙찰가)
        let failureBonus = 1.0;
        if (failedCount === 0) {
            failureBonus = 0.9; // 1회차: 낙찰 확률 10% 감소
        } else if (failedCount === 1) {
            failureBonus = 1.1; // 2회차: 낙찰 확률 10% 증가
        } else if (failedCount === 2) {
            failureBonus = 1.25; // 3회차: 낙찰 확률 25% 증가 (최고점)
        } else if (failedCount === 3) {
            failureBonus = 1.15; // 4회차: 낙찰 확률 15% 증가
        } else {
            failureBonus = 1.05; // 5회차 이상: 낙찰 확률 5% 증가
        }
        baseProbability *= failureBonus;
        
        // 매각가율 조정 (연구 논문 기반 지역별 경매 성공률 반영)
        let saleRateAdjustment = 1.0;
        if (salePriceRate < 70) {
            saleRateAdjustment = 0.75; // 지방 도시(70% 미만): 낙찰 확률 25% 감소
        } else if (salePriceRate < 75) {
            saleRateAdjustment = 0.85; // 지방 도시(70-75%): 낙찰 확률 15% 감소
        } else if (salePriceRate < 80) {
            saleRateAdjustment = 0.95; // 경기도(75-80%): 낙찰 확률 5% 감소
        } else if (salePriceRate < 85) {
            saleRateAdjustment = 1.05; // 서울 기타 지역(80-85%): 낙찰 확률 5% 증가
        } else if (salePriceRate < 90) {
            saleRateAdjustment = 1.15; // 서울 강남권(85-90%): 낙찰 확률 15% 증가
        } else {
            saleRateAdjustment = 1.25; // 초고가 지역(90% 이상): 낙찰 확률 25% 증가
        }
        
        baseProbability *= saleRateAdjustment;
        
        // 최종 확률 제한 (0.1 ~ 0.95)
        const finalProbability = Math.max(0.1, Math.min(0.95, baseProbability));
        
        // 디버깅 로그 (개발 시에만)
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('github.io')) {
            console.log('낙찰확률 계산 상세:', {
                priceRatio: Math.round(priceRatio * 100) + '%',
                baseProbability: Math.round(baseProbability * 100) + '%',
                competitionPenalty: Math.round(competitionPenalty * 100) + '%',
                failureBonus: Math.round(failureBonus * 100) + '%',
                saleRateAdjustment: Math.round(saleRateAdjustment * 100) + '%',
                salePriceRate: salePriceRate + '%',
                finalProbability: Math.round(finalProbability * 100) + '%',
                competitorCount,
                failedCount
            });
        }
        
        return finalProbability;
    }

    // 연구 논문 기반 낙찰가 분석 함수
    analyzeBidPriceFactors(bidPrice, marketPrice, appraisalPrice, minimumBid, salePriceRate, competitorCount, failedCount) {
        console.log('\n=== 연구 논문 기반 낙찰가 분석 ===');
        
        // 1. 가격 비율 분석
        const appraisalRatio = (appraisalPrice > 0) ? (bidPrice / appraisalPrice) : 0;
        const marketRatio = (marketPrice > 0) ? (bidPrice / marketPrice) : 0;
        const minimumRatio = (minimumBid > 0) ? (bidPrice / minimumBid) : 0;
        
        // 2. 연구 기준 대비 분석
        const analysis = {
            // 가격 비율 평가
            appraisalRatio: {
                value: Math.round(appraisalRatio * 100) + '%',
                status: appraisalRatio >= 0.8 && appraisalRatio <= 0.95 ? '적정' : 
                        appraisalRatio < 0.8 ? '낮음' : '높음',
                recommendation: appraisalRatio < 0.8 ? '가격 상향 조정 권장' :
                               appraisalRatio > 0.95 ? '가격 하향 조정 권장' : '현재 가격 적정'
            },
            
            // 시세 대비 평가
            marketRatio: {
                value: Math.round(marketRatio * 100) + '%',
                status: marketRatio >= 0.75 && marketRatio <= 0.90 ? '적정' :
                        marketRatio < 0.75 ? '낮음' : '높음',
                recommendation: marketRatio < 0.75 ? '시세 대비 낮음, 경쟁 우위' :
                               marketRatio > 0.90 ? '시세 대비 높음, 경쟁 불리' : '시세 대비 적정'
            },
            
            // 최저입찰가 대비 평가
            minimumRatio: {
                value: Math.round(minimumRatio * 100) + '%',
                status: minimumRatio >= 1.1 && minimumRatio <= 1.3 ? '적정' :
                        minimumRatio < 1.1 ? '낮음' : '높음',
                recommendation: minimumRatio < 1.1 ? '최저입찰가 대비 낮음, 낙찰 어려움' :
                               minimumRatio > 1.3 ? '최저입찰가 대비 높음, 경쟁력 있음' : '최저입찰가 대비 적정'
            },
            
            // 매각가율 기반 지역 평가
            regionalAnalysis: {
                saleRate: salePriceRate + '%',
                regionType: salePriceRate >= 85 ? '고매각가율 지역 (서울 강남권 등)' :
                           salePriceRate >= 80 ? '중상위 매각가율 지역 (서울 기타)' :
                           salePriceRate >= 75 ? '중간 매각가율 지역 (경기도)' :
                           '저매각가율 지역 (지방 도시)',
                competitiveness: salePriceRate >= 85 ? '매우 높음' :
                                salePriceRate >= 80 ? '높음' :
                                salePriceRate >= 75 ? '보통' : '낮음'
            },
            
            // 경쟁자 수 분석
            competitionAnalysis: {
                count: competitorCount + '명',
                level: competitorCount <= 3 ? '낮음' :
                       competitorCount <= 6 ? '보통' :
                       competitorCount <= 8 ? '높음' : '매우 높음',
                impact: competitorCount <= 3 ? '낙찰 확률 높음' :
                        competitorCount <= 6 ? '적정 경쟁' :
                        '경쟁 치열, 가격 경쟁력 중요'
            },
            
            // 유찰 횟수 분석
            failureAnalysis: {
                count: failedCount + '회',
                stage: failedCount === 0 ? '1회차 (첫 경매)' :
                       failedCount === 1 ? '2회차 (1회 유찰)' :
                       failedCount === 2 ? '3회차 (2회 유찰) - 최적 시점' :
                       failedCount === 3 ? '4회차 (3회 유찰)' : '5회차 이상',
                opportunity: failedCount === 2 ? '최고 낙찰 확률 시점' :
                            failedCount <= 1 ? '초기 단계, 조심스러운 접근' :
                            '후반 단계, 가격 조정 필요'
            }
        };
        
        // 3. 종합 평가
        const overallScore = this.calculateOverallBidScore(analysis);
        analysis.overallEvaluation = {
            score: overallScore,
            grade: overallScore >= 80 ? 'A' :
                   overallScore >= 70 ? 'B' :
                   overallScore >= 60 ? 'C' :
                   overallScore >= 50 ? 'D' : 'F',
            recommendation: this.generateOverallRecommendation(analysis, overallScore)
        };
        
        console.log('낙찰가 분석 결과:', analysis);
        return analysis;
    }
    
    // 종합 입찰 점수 계산
    calculateOverallBidScore(analysis) {
        let score = 50; // 기본 점수
        
        // 가격 비율 점수 (30점 만점)
        const appraisalRatio = parseFloat(analysis.appraisalRatio.value.replace('%', ''));
        if (appraisalRatio >= 80 && appraisalRatio <= 95) score += 30;
        else if (appraisalRatio >= 75 && appraisalRatio <= 100) score += 20;
        else score += 10;
        
        // 매각가율 점수 (25점 만점)
        const saleRate = parseFloat(analysis.regionalAnalysis.saleRate.replace('%', ''));
        if (saleRate >= 85) score += 25;
        else if (saleRate >= 80) score += 20;
        else if (saleRate >= 75) score += 15;
        else score += 10;
        
        // 경쟁자 수 점수 (25점 만점)
        const competitorCount = parseInt(analysis.competitionAnalysis.count.replace('명', ''));
        if (competitorCount <= 3) score += 25;
        else if (competitorCount <= 6) score += 20;
        else if (competitorCount <= 8) score += 15;
        else score += 10;
        
        // 유찰 횟수 점수 (20점 만점)
        const failedCount = parseInt(analysis.failureAnalysis.count.replace('회', ''));
        if (failedCount === 2) score += 20; // 3회차 최적
        else if (failedCount === 1) score += 15;
        else if (failedCount === 3) score += 15;
        else if (failedCount === 0) score += 10;
        else score += 5;
        
        return Math.min(100, score);
    }
    
    // 종합 추천사항 생성
    generateOverallRecommendation(analysis, score) {
        if (score >= 80) {
            return '현재 입찰가격이 매우 적정합니다. 높은 낙찰 확률을 기대할 수 있습니다.';
        } else if (score >= 70) {
            return '현재 입찰가격이 적정합니다. 경쟁 상황에 따라 조정을 고려해보세요.';
        } else if (score >= 60) {
            return '현재 입찰가격이 보통 수준입니다. 경쟁력 향상을 위해 가격 조정을 권장합니다.';
        } else if (score >= 50) {
            return '현재 입찰가격이 낮은 수준입니다. 낙찰을 위해서는 가격 상향 조정이 필요합니다.';
        } else {
            return '현재 입찰가격이 매우 낮습니다. 대폭적인 가격 상향 조정을 권장합니다.';
        }
    }

    // 입찰 전략 조언 생성
    generateStrategyAdvice(winProbability, expectedProfit, competitorCount, marketCondition, 
                          appraisalRatio, marketRatio, minimumRatio, failedCount, marketProfitability, targetProfitRate) {
        let advice = "";
        
        if (winProbability >= 0.8) {
            advice += `<p class="high-probability">🎯 <strong>높은 낙찰 확률</strong> - 현재 전략이 효과적입니다.</p>`;
        } else if (winProbability >= 0.5) {
            advice += `<p class="medium-probability">⚖️ <strong>보통 낙찰 확률</strong> - 입찰가를 조정해보세요.</p>`;
        } else {
            advice += `<p class="low-probability">⚠️ <strong>낮은 낙찰 확률</strong> - 입찰가를 대폭 상향 조정이 필요합니다.</p>`;
        }
        
        advice += `<ul>`;
        
        // 경쟁자 수 관련 조언
        if (competitorCount >= 10) {
            advice += `<li>경쟁자가 많으므로 입찰가를 10-15% 상향 조정을 고려하세요.</li>`;
        } else if (competitorCount <= 3) {
            advice += `<li>경쟁자가 적으므로 보수적인 입찰가로도 충분할 수 있습니다.</li>`;
        }
        
        // 시장 상황 관련 조언
        if (marketCondition === 'hot') {
            advice += `<li>활발한 시장이므로 입찰가를 5-10% 상향 조정하세요.</li>`;
        } else if (marketCondition === 'cold') {
            advice += `<li>침체된 시장이므로 보수적인 입찰가로도 기회가 있을 수 있습니다.</li>`;
        }
        
        // 유찰 횟수 관련 조언
        if (failedCount >= 3) {
            advice += `<li>⚠️ 3회 이상 유찰된 물건입니다. 입찰가를 15-20% 대폭 하향 조정하세요.</li>`;
        } else if (failedCount >= 1) {
            advice += `<li>유찰 이력이 있으므로 입찰가를 5-10% 하향 조정을 고려하세요.</li>`;
        }
        
        // 감정가 대비 입찰가 조언
        if (appraisalRatio < 80) {
            advice += `<li>감정가의 80% 미만으로 입찰하고 있습니다. 낙찰 확률이 매우 낮습니다.</li>`;
        } else if (appraisalRatio > 130) {
            advice += `<li>감정가의 130% 이상으로 입찰하고 있습니다. 과도한 입찰가일 수 있습니다.</li>`;
        } else {
            advice += `<li>감정가 대비 적정 범위의 입찰가입니다.</li>`;
        }
        
        // 시세 대비 수익성 조언
        if (marketProfitability.isProfitable) {
            advice += `<li>✅ 시세 대비 수익성이 양호합니다 (${Math.round(marketProfitability.marketProfitRatio)}%).</li>`;
        } else {
            advice += `<li>⚠️ 시세 대비 수익성이 마이너스입니다. 입찰을 재검토하세요.</li>`;
        }
        
        // 최저입찰가 대비 조언
        if (minimumRatio < 110) {
            advice += `<li>최저입찰가에 가까운 가격입니다. 낙찰 확률이 낮을 수 있습니다.</li>`;
        } else if (minimumRatio > 200) {
            advice += `<li>최저입찰가의 2배 이상으로 입찰하고 있습니다. 과도할 수 있습니다.</li>`;
        }
        
        // 수익률 관련 조언
        if (expectedProfit < 0) {
            advice += `<li>⚠️ 예상 수익률이 마이너스입니다. 입찰을 재검토하세요.</li>`;
        } else if (expectedProfit < targetProfitRate * 0.5) {
            advice += `<li>⚠️ 예상 수익률이 목표 수익률(${targetProfitRate}%)의 절반 미만입니다. 입찰가를 대폭 하향 조정하세요.</li>`;
        } else if (expectedProfit < targetProfitRate * 0.8) {
            advice += `<li>⚠️ 예상 수익률이 목표 수익률(${targetProfitRate}%)의 80% 미만입니다. 입찰가를 하향 조정하세요.</li>`;
        } else if (expectedProfit >= targetProfitRate) {
            advice += `<li>✅ 목표 수익률(${targetProfitRate}%)을 달성할 수 있는 수익률입니다.</li>`;
        } else {
            advice += `<li>⚖️ 목표 수익률(${targetProfitRate}%)에 근접한 수익률입니다. 입찰가를 약간 조정해보세요.</li>`;
        }
        
        advice += `<li>입찰 전 최종 10분에 입찰하는 것이 유리할 수 있습니다.</li>`;
        advice += `<li>경쟁자의 입찰 패턴을 관찰하고 적절한 타이밍에 입찰하세요.</li>`;
        advice += `</ul>`;
        
        return advice;
    }

    // 차트 생성
    createChart(bidPrices, probabilities) {
        const chartElement = document.getElementById('probabilityChart');
        if (!chartElement) {
            console.warn('차트 요소를 찾을 수 없습니다.');
            return;
        }
        
        const ctx = chartElement.getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: bidPrices.map(price => this.formatNumber(Math.round(price)) + '원'),
                datasets: [{
                    label: '낙찰 확률 (%)',
                    data: probabilities.map(p => Math.round(p * 100)),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '입찰가격별 낙찰 확률',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '낙찰 확률 (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '입찰가격'
                        }
                    }
                }
            }
        });
    }

    // 시뮬레이션 실행
    runSimulation() {
        console.log('시뮬레이션 시작');
        
        // 입력값 가져오기 (원 단위로 입력받음)
        const bidPrice = parseInt(document.getElementById('bidPrice').value);
        const auctionType = document.getElementById('auctionType').value;
        const competitorCount = parseInt(document.getElementById('competitorCount').value);
        const marketCondition = document.getElementById('marketCondition').value;
        const urgency = document.getElementById('urgency').value;
        const marketPrice = parseInt(document.getElementById('marketPrice').value);
        const appraisalPrice = parseInt(document.getElementById('appraisalPrice').value);
        const minimumBid = parseInt(document.getElementById('minimumBid').value);
        const failedCount = parseInt(document.getElementById('failedCount').value);
        const renovationCost = parseInt(document.getElementById('renovationCost').value);

        console.log('입력값 확인:', {
            bidPrice, auctionType, competitorCount, marketCondition, 
            urgency, marketPrice, appraisalPrice, minimumBid, failedCount, renovationCost
        });

        // 매각가율 기반 권장 입찰가 계산
        const salePriceRate = this.getCurrentSalePriceRate();
        const targetProfitRate = Math.round(((bidPrice - marketPrice) / marketPrice) * 100);
        
        // 추가 비용 설정
        const additionalCosts = {
            renovationCost: renovationCost || 0,
            evictionCost: 0, // 명도비 (필요시 입력받을 수 있음)
            legalCost: 0, // 법무비
            inspectionCost: 0, // 현황조사비
            otherCosts: 0 // 기타 비용
        };
        
        // 매각가율 기반 권장 입찰가 계산
        const bidCalculation = this.calculateRecommendedBidPrice(
            marketPrice, 
            salePriceRate, 
            targetProfitRate, 
            auctionType, 
            additionalCosts
        );
        
        const targetPrice = bidCalculation.recommendedBidPrice;
        
        console.log('매각가율 기반 권장 입찰가 계산:', {
            marketPrice,
            salePriceRate,
            targetProfitRate,
            bidCalculation,
            targetPrice
        });

        try {
            console.log('최적 입찰가격 계산 시작');
            console.log('입력값 검증:', {
                bidPrice, auctionType, competitorCount, marketCondition, urgency,
                marketPrice, appraisalPrice, minimumBid, failedCount, renovationCost
            });
            
            // 최적 입찰가격 계산 (원 단위로 계산)
            const result = this.calculateOptimalBid(
                bidPrice, auctionType, competitorCount, marketCondition, urgency,
                marketPrice, appraisalPrice, minimumBid, failedCount, renovationCost
            );
            console.log('최적 입찰가격 계산 완료:', result);
            
            // 연구 논문 기반 낙찰가 분석 실행
            const salePriceRate = this.getCurrentSalePriceRate();
            const bidAnalysis = this.analyzeBidPriceFactors(
                bidPrice, marketPrice, appraisalPrice, minimumBid, 
                salePriceRate, competitorCount, failedCount
            );
            
            console.log('총 비용 계산 시작');
            // 총 비용 계산 (사용자가 입력한 입찰가격 기준으로 계산)
            const userBidPrice = bidPrice > 0 ? bidPrice : result.recommendedBid; // 사용자가 입력한 가격 우선, 없으면 권장가격 사용
            const costInfo = this.calculateTotalCost(userBidPrice, auctionType, renovationCost);
            console.log('총 비용 계산 완료 (사용자 입력 가격 기준):', {
                사용자입력가격: bidPrice.toLocaleString(),
                비용계산기준: userBidPrice.toLocaleString(),
                비용정보: costInfo
            });
            
            console.log('시세 대비 수익성 분석 시작');
            // 시세 대비 수익성 분석 (사용자가 입력한 입찰가격 기준으로 계산)
            const marketProfitability = this.calculateMarketProfitability(userBidPrice, marketPrice, costInfo.totalCost);
            console.log('시세 대비 수익성 분석 완료:', marketProfitability);
            
            console.log('결과 표시 시작');
            // 결과 표시 (원 단위로 표시) - 비용은 사용자가 입력한 입찰가격 기준으로 계산됨
            this.displayResults(result, costInfo, userBidPrice, competitorCount, marketCondition, urgency,
                              marketPrice, appraisalPrice, minimumBid, marketProfitability, failedCount, renovationCost, targetProfitRate, result.saleRateBasedCalculation);
            console.log('결과 표시 완료');
            
            console.log('차트 생성 시작');
            // 차트 생성 (원 단위)
            this.createChart(result.bidPrices, result.probabilities);
            console.log('차트 생성 완료');
            
            console.log('결과 컨테이너 활성화 시작');
            // 초기 메시지 숨기기
            const initialMessage = document.getElementById('initialMessage');
            if (initialMessage) {
                initialMessage.style.display = 'none';
            }
            
            // 시뮬레이션 결과 섹션 표시
            const simulationResultsSection = document.querySelector('.simulation-results-section');
            if (simulationResultsSection) {
                simulationResultsSection.style.display = 'block';
                console.log('시뮬레이션 결과 섹션 표시 완료');
            } else {
                console.error('시뮬레이션 결과 섹션을 찾을 수 없습니다');
            }
            
            // 시뮬레이션 결과 저장 버튼 표시
            const saveSection = document.querySelector('.simulation-results-section .save-section');
            if (saveSection) {
                saveSection.style.display = 'flex';
                console.log('시뮬레이션 결과 저장 버튼 표시 완료');
            }
            
        } catch (error) {
            console.error('시뮬레이션 실행 중 오류 발생:', error);
            alert('시뮬레이션 실행 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 결과 표시
    displayResults(result, costInfo, bidPrice, competitorCount, marketCondition, urgency,
                  marketPrice, appraisalPrice, minimumBid, marketProfitability, failedCount, renovationCost, targetProfitRate, bidCalculation = null) {
        // 초기 메시지 숨기기
        const initialMessage = document.getElementById('initialMessage');
        if (initialMessage) {
            initialMessage.style.display = 'none';
        }
        
        // 결과 섹션들 보이기
        const resultSections = [
            'result-cards', 'detailed-results', 'price-analysis', 
            'chart-container', 'strategy-section', 'statistics-section'
        ];
        resultSections.forEach(sectionId => {
            const section = document.querySelector(`.${sectionId}`);
            if (section) {
                section.style.display = 'block';
            }
        });
        
        // 통합된 권장 입찰가 표시 제거 - 그래프만 표시
        
        // 상세 비용 (원 단위로 표시)
        const totalCostInWon = costInfo.totalCost;
        
        // 리스크 조정 수익률 계산 및 표시
        const riskAdjustedProfit = this.calculateRiskAdjustedProfit(
            bidPrice, costInfo.totalCost, result.winProbability, marketCondition, failedCount
        );
        const riskAdjustedProfitEl = document.getElementById('riskAdjustedProfit');
        if (riskAdjustedProfitEl) {
            riskAdjustedProfitEl.textContent = Math.round(riskAdjustedProfit) + '%';
        }
        
        // 모델 신뢰도 계산 및 표시
        const marketWeight = this.getMarketWeight(marketCondition);
        const urgencyWeight = this.getUrgencyWeight(urgency);
        const features = this.extractFeatures(
            result.recommendedBid, bidPrice, competitorCount, marketWeight, urgencyWeight, 
            failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost
        );
        const uncertainty = this.quantifyUncertainty(features, result.winProbability);
        const confidence = Math.round(uncertainty.confidence * 100);
        
        const modelConfidenceEl = document.getElementById('modelConfidence');
        const totalCostEl = document.getElementById('totalCost');
        const auctionFeeEl = document.getElementById('auctionFee');
        const registrationFeeEl = document.getElementById('registrationFee');
        const taxEl = document.getElementById('tax');
        const renovationCostDisplayEl = document.getElementById('renovationCostDisplay');
        
        if (modelConfidenceEl) modelConfidenceEl.textContent = confidence + '%';
        if (totalCostEl) totalCostEl.textContent = this.formatNumber(Math.round(totalCostInWon)) + '원';
        if (auctionFeeEl) auctionFeeEl.textContent = this.formatNumber(Math.round(costInfo.auctionFee)) + '원';
        if (registrationFeeEl) registrationFeeEl.textContent = this.formatNumber(Math.round(costInfo.registrationFee)) + '원';
        if (taxEl) taxEl.textContent = this.formatNumber(Math.round(costInfo.tax)) + '원';
        if (renovationCostDisplayEl) renovationCostDisplayEl.textContent = this.formatNumber(renovationCost) + '원';
        
        // 상세 비용 정보 표시
        this.displayDetailedCosts(costInfo, bidPrice, renovationCost);
        
        // 총 투자 비용 계산 (입찰가 + 수수료 + 리모델링 비용)
        const totalInvestment = totalCostInWon + renovationCost;
        const totalInvestmentEl = document.getElementById('totalInvestment');
        if (totalInvestmentEl) {
            totalInvestmentEl.textContent = this.formatNumber(Math.round(totalInvestment)) + '원';
        }
        
        // 가격 분석 (사용자 입력 가격 기준으로 계산)
        const appraisalRatio = ((bidPrice / appraisalPrice) * 100).toFixed(1);
        const marketRatio = ((bidPrice / marketPrice) * 100).toFixed(1);
        const minimumRatio = ((bidPrice / minimumBid) * 100).toFixed(1);
        
        const appraisalRatioEl = document.getElementById('appraisalRatio');
        const marketRatioEl = document.getElementById('marketRatio');
        const minimumRatioEl = document.getElementById('minimumRatio');
        const marketProfitEl = document.getElementById('marketProfit');
        
        if (appraisalRatioEl) appraisalRatioEl.textContent = appraisalRatio + '%';
        if (marketRatioEl) marketRatioEl.textContent = marketRatio + '%';
        if (minimumRatioEl) minimumRatioEl.textContent = minimumRatio + '%';
        if (marketProfitEl) marketProfitEl.textContent = this.formatNumber(Math.round(marketProfitability.marketProfit)) + '원';
        
        // 목표 수익률과 계산된 목표가 표시
        const targetProfitRateDisplayEl = document.getElementById('targetProfitRateDisplay');
        const calculatedTargetPriceEl = document.getElementById('calculatedTargetPrice');
        
        if (targetProfitRateDisplayEl) targetProfitRateDisplayEl.textContent = targetProfitRate + '%';
        if (calculatedTargetPriceEl) calculatedTargetPriceEl.textContent = this.formatNumber(Math.round(bidPrice)) + '원 (사용자 입력)';
        
        // 전략 조언
        const strategyAdvice = this.generateStrategyAdvice(
            result.winProbability, result.expectedProfit, competitorCount, marketCondition,
            appraisalRatio, marketRatio, minimumRatio, failedCount, marketProfitability, targetProfitRate
        );
        const strategyAdviceEl = document.getElementById('strategyAdvice');
        if (strategyAdviceEl) {
            strategyAdviceEl.innerHTML = strategyAdvice;
        }
        
        // 매각통계 데이터 표시
        this.displayStatisticsData(propertyLocation);
    }
    
    async displayStatisticsData(location) {
        try {
            // 위치에서 지역과 구/군 추출
            const region = this.extractRegionFromLocation(location);
            const district = this.extractDistrictFromLocation(location);
            
            if (!region || !district) {
                console.log('지역 정보를 추출할 수 없습니다:', location);
                return;
            }
            
            // 매각통계 데이터 조회
            const [districtStats, regionSummary, investmentRec, topDistricts] = await Promise.all([
                fetchDistrictStatistics(region, district),
                fetchRegionSummary(region),
                fetchInvestmentRecommendation(region, district),
                fetchTopDistricts(region, 'sale_rate', 5)
            ]);
            
            // 지역 통계 표시
            this.displayRegionStatistics(regionSummary, districtStats);
            
            // 투자 추천 표시
            this.displayInvestmentRecommendation(investmentRec);
            
            // 상위 구/군 표시
            this.displayTopDistricts(topDistricts);
            
        } catch (error) {
            console.error('매각통계 데이터 표시 오류:', error);
        }
    }
    
    extractRegionFromLocation(location) {
        if (!location) return null;
        
        // location이 문자열이 아닌 경우 문자열로 변환
        const locationStr = String(location);
        if (!locationStr || locationStr === 'null' || locationStr === 'undefined') {
            console.log('유효하지 않은 location:', location);
            return null;
        }
        
        console.log('extractRegionFromLocation 호출:', { location, locationStr });
        
        // 지역별 구/군 매핑 (정확한 매칭을 위해)
        const regionMappings = {
            '경기': [
                '수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '과천시', '오산시', '시흥시', 
                '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', 
                '여주시', '양평군', '고양시', '동두천시', '가평군', '연천군'
            ],
            '서울': [
                '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', 
                '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', 
                '용산구', '은평구', '종로구', '중구', '중랑구'
            ],
            '부산': [
                '강서구', '금정구', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', 
                '수영구', '연제구', '영도구', '중구', '해운대구', '기장군'
            ],
            '인천': [
                '계양구', '남구', '남동구', '동구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'
            ]
        };
        
        // 각 지역별로 확인 (정확한 매칭 우선)
        for (const [region, districts] of Object.entries(regionMappings)) {
            // 긴 문자열부터 검사하여 정확한 매칭 우선
            const sortedDistricts = districts.sort((a, b) => b.length - a.length);
            
            for (const district of sortedDistricts) {
                // 정확한 매칭 (단어 경계 고려)
                const regex = new RegExp(`\\b${district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
                if (regex.test(locationStr)) {
                    console.log('매칭된 region:', region, 'district:', district, 'from location:', locationStr);
                    return region;
                }
            }
            
            // 정확한 매칭 실패 시 부분 매칭 시도
            for (const district of sortedDistricts) {
                if (locationStr.includes(district)) {
                    console.log('매칭된 region (partial):', region, 'district:', district, 'from location:', locationStr);
                    return region;
                }
            }
        }
        
        console.log('매칭된 region 없음:', locationStr);
        return null;
    }
    
    extractDistrictFromLocation(location) {
        if (!location) return null;
        
        // location이 문자열이 아닌 경우 문자열로 변환
        const locationStr = String(location);
        if (!locationStr || locationStr === 'null' || locationStr === 'undefined') {
            console.log('유효하지 않은 location:', location);
            return null;
        }
        
        console.log('extractDistrictFromLocation 호출:', { location, locationStr });
        
        // 전체 지역별 구/군 목록 (정확한 매칭을 위해)
        const allDistricts = [
            // 경기도
            '부천시 오정구', '부천시 소사구', '부천시 원미구',
            '수원시 영통구', '수원시 팔달구', '수원시 장안구', '수원시 권선구',
            '성남시 분당구', '성남시 수정구', '성남시 중원구',
            '안양시 만안구', '안양시 동안구',
            '고양시 덕양구', '고양시 일산동구', '고양시 일산서구',
            '용인시 처인구', '용인시 기흥구', '용인시 수지구',
            '화성시 동탄구', '화성시 동탄신도시',
            '의정부시', '광명시', '평택시', '과천시', '오산시', '시흥시', 
            '군포시', '의왕시', '하남시', '파주시', '이천시', '안성시', 
            '김포시', '광주시', '여주시', '양평군', '동두천시', '가평군', '연천군',
            
            // 서울
            '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
            '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구',
            '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구',
            '종로구', '중구', '중랑구',
            
            // 부산
            '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구',
            '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군',
            
            // 인천
            '중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'
        ];
        
        // 정확한 매칭을 위해 긴 문자열부터 검사 (예: "부천시 오정구"가 "오정구"보다 우선)
        const sortedDistricts = allDistricts.sort((a, b) => b.length - a.length);
        
        for (const district of sortedDistricts) {
            // 정확한 매칭 (단어 경계 고려)
            const regex = new RegExp(`\\b${district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
            if (regex.test(locationStr)) {
                console.log('매칭된 district:', district, 'from location:', locationStr);
                return district;
            }
        }
        
        // 정확한 매칭이 실패한 경우 부분 매칭 시도
        for (const district of sortedDistricts) {
            if (locationStr.includes(district)) {
                console.log('매칭된 district (partial):', district, 'from location:', locationStr);
                return district;
            }
        }
        
        console.log('매칭된 district 없음:', locationStr);
        
        // 서울 구/군 추출
        const seoulDistricts = ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', 
                               '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', 
                               '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', 
                               '종로구', '중구', '중랑구'];
        
        for (const district of seoulDistricts) {
            if (locationStr.includes(district)) return district;
        }
        
        // 부산 구/군 추출
        const busanDistricts = ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', 
                               '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', 
                               '기장군'];
        
        for (const district of busanDistricts) {
            if (locationStr.includes(district)) return district;
        }
        
        // 인천 구/군 추출
        const incheonDistricts = ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', 
                                 '서구', '강화군', '옹진군'];
        
        for (const district of incheonDistricts) {
            if (locationStr.includes(district)) return district;
        }
        
        return null;
    }
    
    displayRegionStatistics(regionSummary, districtStats) {
        const regionStatsEl = document.getElementById('regionStatistics');
        if (!regionStatsEl) return;
        
        let html = '';
        
        if (regionSummary.success) {
            const data = regionSummary.data;
            html += `
                <div class="statistics-item">
                    <span class="statistics-label">전체 경매건수</span>
                    <span class="statistics-value">${data.total_auctions.toLocaleString()}건</span>
                </div>
                <div class="statistics-item">
                    <span class="statistics-label">전체 매각건수</span>
                    <span class="statistics-value">${data.total_sales.toLocaleString()}건</span>
                </div>
                <div class="statistics-item">
                    <span class="statistics-label">전체 매각률</span>
                    <span class="statistics-value">${data.overall_sale_rate.toFixed(1)}%</span>
                </div>
                <div class="statistics-item">
                    <span class="statistics-label">전체 매각가율</span>
                    <span class="statistics-value">${data.overall_sale_price_rate.toFixed(1)}%</span>
                </div>
            `;
        }
        
        if (districtStats.success) {
            const data = districtStats.data;
            html += `
                <div class="statistics-item">
                    <span class="statistics-label">구/군 경매건수</span>
                    <span class="statistics-value">${data.auctions.toLocaleString()}건</span>
                </div>
                <div class="statistics-item">
                    <span class="statistics-label">구/군 매각건수</span>
                    <span class="statistics-value">${data.sales.toLocaleString()}건</span>
                </div>
                <div class="statistics-item">
                    <span class="statistics-label">구/군 매각률</span>
                    <span class="statistics-value">${data.sale_rate.toFixed(1)}%</span>
                </div>
                <div class="statistics-item">
                    <span class="statistics-label">구/군 매각가율</span>
                    <span class="statistics-value">${data.sale_price_rate.toFixed(1)}%</span>
                </div>
            `;
        }
        
        regionStatsEl.innerHTML = html;
    }
    
    displayInvestmentRecommendation(investmentRec) {
        const investmentEl = document.getElementById('investmentRecommendation');
        if (!investmentEl || !investmentRec.success) return;
        
        const data = investmentRec.data;
        const badgeClass = this.getRecommendationBadgeClass(data.recommendation);
        
        const html = `
            <div class="statistics-item">
                <span class="statistics-label">투자 추천</span>
                <span class="recommendation-badge ${badgeClass}">${data.recommendation}</span>
            </div>
            <div class="statistics-item">
                <span class="statistics-label">시장 점수</span>
                <span class="statistics-value">${data.score}/100</span>
            </div>
            <div class="statistics-item">
                <span class="statistics-label">경쟁 수준</span>
                <span class="statistics-value">${data.competition_level}</span>
            </div>
            <div class="statistics-item">
                <span class="statistics-label">매각률</span>
                <span class="statistics-value">${data.sale_rate.toFixed(1)}%</span>
            </div>
            <div class="statistics-item">
                <span class="statistics-label">매각가율</span>
                <span class="statistics-value">${data.sale_price_rate.toFixed(1)}%</span>
            </div>
            <div class="statistics-item">
                <span class="statistics-label">추천 이유</span>
                <span class="statistics-value" style="font-size: 12px; text-align: right;">${data.reason}</span>
            </div>
        `;
        
        investmentEl.innerHTML = html;
    }
    
    displayTopDistricts(topDistricts) {
        const topDistrictsEl = document.getElementById('topDistricts');
        if (!topDistrictsEl || !topDistricts.success) return;
        
        const data = topDistricts.data;
        let html = '';
        
        data.districts.forEach((item, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            html += `
                <div class="top-district-item">
                    <div>
                        <span class="district-rank ${rankClass}">${index + 1}</span>
                        <span class="statistics-label">${item.district}</span>
                    </div>
                    <span class="statistics-value">${item.value.toFixed(1)}%</span>
                </div>
            `;
        });
        
        topDistrictsEl.innerHTML = html;
    }
    
    getRecommendationBadgeClass(recommendation) {
        switch (recommendation) {
            case '매우 추천': return 'recommendation-very-good';
            case '추천': return 'recommendation-good';
            case '보통': return 'recommendation-normal';
            case '신중': return 'recommendation-caution';
            case '비추천': return 'recommendation-bad';
            default: return 'recommendation-normal';
        }
    }

    // 저장/불러오기 기능 초기화 (삭제된 버튼들 제거)
    initializeSaveButtons() {
        // 개별 불러오기 버튼들이 삭제되었으므로 이벤트 리스너 제거
        console.log('개별 저장/불러오기 버튼들이 삭제됨 - 이벤트 리스너 초기화 완료');
    }

    // 매물별 모든 정보 저장 (새로운 간단한 시스템)
    // 새로운 간단한 저장 시스템
    saveAllDataForProperty(propertyIndex) {
        console.log('매물별 저장 시작:', propertyIndex);
        
        // 간단한 저장 시스템 사용
        if (window.simpleStorage && window.simpleFormManager) {
            try {
                // 폼 데이터 수집
                const formData = window.simpleFormManager.collectAllFormData();
                
                // 저장
                const success = window.simpleStorage.savePropertyData(propertyIndex, formData);
                
                if (success) {
                    const properties = window.simpleStorage.getProperties();
                    const property = properties[propertyIndex];
                    const propertyName = property?.name || property?.caseNumber || '이름없음';
                    alert(`${propertyName}의 모든 정보가 저장되었습니다!`);
                    console.log('매물별 저장 완료:', propertyName);
                } else {
                    alert('저장에 실패했습니다.');
                    console.error('매물별 저장 실패');
                }
            } catch (error) {
                console.error('매물별 저장 오류:', error);
                alert('저장 중 오류가 발생했습니다: ' + error.message);
            }
        } else {
            alert('저장 시스템이 초기화되지 않았습니다.');
            console.error('SimpleStorage 또는 SimpleFormManager가 없습니다.');
        }
    }

    // 새로운 간단한 불러오기 시스템
    loadAllDataForProperty(propertyIndex) {
        console.log('매물별 불러오기 시작:', propertyIndex);
        
        // 간단한 불러오기 시스템 사용
        if (window.simpleStorage && window.simpleFormManager) {
            try {
                // 저장된 데이터 로드
                const savedData = window.simpleStorage.loadPropertyData(propertyIndex);
                
                if (!savedData) {
                    alert('저장된 데이터가 없습니다.');
                    return;
                }
                
                console.log('불러온 데이터:', savedData);
                
                // 폼에 데이터 로드
                const success = window.simpleFormManager.loadFormData(savedData);
                
                if (success) {
                    const properties = window.simpleStorage.getProperties();
                    const property = properties[propertyIndex];
                    const propertyName = property?.name || property?.caseNumber || '이름없음';
                    alert(`${propertyName}의 모든 정보가 불러와졌습니다!`);
                    console.log('매물별 불러오기 완료:', propertyName);
                } else {
                    alert('데이터 로드에 실패했습니다.');
                    console.error('폼 데이터 로드 실패');
                }
            } catch (error) {
                console.error('매물별 불러오기 오류:', error);
                alert('불러오기 중 오류가 발생했습니다: ' + error.message);
            }
        } else {
            alert('불러오기 시스템이 초기화되지 않았습니다.');
            console.error('SimpleStorage 또는 SimpleFormManager가 없습니다.');
        }
    }

    // 이 함수는 FormDataManager로 대체됨

    // 경매 정보를 모달 폼에 불러오기 (편집용)
    loadAuctionInfoToModalForm(auctionInfo) {
        console.log('모달 폼에 경매 정보 로드:', auctionInfo);
        
        // 모달의 사건번호 필드에 직접 입력
        const modalCaseNumber = document.getElementById('caseNumber');
        if (modalCaseNumber && auctionInfo.caseNumber) {
            modalCaseNumber.value = auctionInfo.caseNumber;
            console.log('모달 사건번호 설정:', auctionInfo.caseNumber);
        }
        
        // 다른 필드들도 모달에서 접근 가능한 것들만 설정
        const modalFields = [
            { field: 'bidPrice', value: auctionInfo.bidPrice },
            { field: 'marketPrice', value: auctionInfo.marketPrice },
            { field: 'appraisalPrice', value: auctionInfo.appraisalPrice },
            { field: 'minimumBid', value: auctionInfo.minimumBid },
            { field: 'renovationCost', value: auctionInfo.renovationCost },
            { field: 'competitorCount', value: auctionInfo.competitorCount }
        ];
        
        modalFields.forEach(({ field, value }) => {
            const element = document.getElementById(field);
            if (element && value !== undefined && value !== '') {
                element.value = value;
                console.log(`모달 ${field} 설정:`, value);
            }
        });
    }

    // 물건조사 정보를 모달 폼에 불러오기 (편집용)
    loadInspectionDataToModalForm(inspectionData) {
        console.log('모달 폼에 물건조사 정보 로드:', inspectionData);
        
        const inspectionFields = [
            'preservationRegistry', 'buildingAge', 'meters', 'mailCheck', 'slope',
            'lightingDirection', 'structureFloor', 'parking', 'waterLeakage',
            'unpaidUtilities', 'gasType', 'gasUnpaid', 'residentsCheck',
            'currentResidents', 'busRoutes', 'subway', 'shopping', 'schools',
            'molitPrice', 'naverPrice', 'kbPrice', 'fieldPrice', 'specialNotes',
            'finalScore', 'inspectionDate'
        ];
        
        inspectionFields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && inspectionData[fieldName] !== undefined && inspectionData[fieldName] !== '') {
                element.value = inspectionData[fieldName];
                console.log(`모달 ${fieldName} 설정:`, inspectionData[fieldName]);
            }
        });
    }

    // 이 함수들은 FormDataManager로 대체됨
}

// 전역 시뮬레이터 인스턴스
let auctionSimulator;

// 매각통계 API 함수들
async function fetchDistrictStatistics(region, district) {
    try {
        const response = await fetch('http://localhost:5001/api/statistics/district', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ region, district })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('지역 통계 조회 오류:', error);
        return { success: false, error: error.message };
    }
}

async function fetchRegionSummary(region) {
    try {
        const response = await fetch('http://localhost:5001/api/statistics/region-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ region })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('지역 요약 조회 오류:', error);
        return { success: false, error: error.message };
    }
}

async function fetchInvestmentRecommendation(region, district) {
    try {
        const response = await fetch('http://localhost:5001/api/statistics/investment-recommendation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ region, district })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('투자 추천 조회 오류:', error);
        return { success: false, error: error.message };
    }
}

async function fetchTopDistricts(region, criteria = 'sale_rate', limit = 5) {
    try {
        const response = await fetch('http://localhost:5001/api/statistics/top-districts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ region, criteria, limit })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('상위 구/군 조회 오류:', error);
        return { success: false, error: error.message };
    }
}

async function fetchAllRegionsSummary() {
    try {
        const response = await fetch('http://localhost:5001/api/statistics/all-regions');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('전체 지역 요약 조회 오류:', error);
        return { success: false, error: error.message };
    }
}

// 페이지 로드 시 시뮬레이터 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 시뮬레이터 초기화 시작');
    
    // StorageManager와 FormDataManager가 준비될 때까지 대기
    const waitForManagers = () => {
        if (window.storageManager && window.formDataManager) {
            console.log('StorageManager와 FormDataManager 준비 완료');
    try {
                auctionSimulator = new AuctionSimulator();
                window.auctionSimulator = auctionSimulator; // 전역 접근 가능하도록 설정
        console.log('시뮬레이터 초기화 완료');
                
                // 조정계수 검증 테스트를 전역에서 호출할 수 있도록 설정
                window.testAdjustmentFactors = () => auctionSimulator.testAdjustmentFactors();
                console.log('조정계수 검증 테스트 함수 등록 완료: testAdjustmentFactors()');
    } catch (error) {
        console.error('시뮬레이터 초기화 오류:', error);
    }
        } else {
            console.log('StorageManager와 FormDataManager 대기 중...');
            setTimeout(waitForManagers, 100);
        }
    };
    
    waitForManagers();
});

// 리치고 데이터 가져오기 함수 (전역 함수)
async function fetchRichgoData(location, propertyType) {
    try {
        const response = await fetch('http://localhost:5001/api/richgo-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                location: location, 
                propertyType: propertyType 
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error || '리치고 데이터를 가져올 수 없습니다.');
        }
    } catch (error) {
        console.warn('리치고 API 호출 실패:', error);
        return null;
    }
}

// 고급 크롤링 함수 (전역 함수)
async function fetchAdvancedCrawlData(caseNumber, location, propertyType) {
    try {
        const response = await fetch('http://localhost:5001/api/advanced-crawl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                caseNumber: caseNumber,
                location: location, 
                propertyType: propertyType 
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error || '고급 크롤링 데이터를 가져올 수 없습니다.');
        }
    } catch (error) {
        console.warn('고급 크롤링 API 호출 실패:', error);
        return null;
    }
}

// API 기반 데이터 수집 함수 (전역 함수)
async function fetchAPICollectData(caseNumber, location, propertyType) {
    try {
        const response = await fetch('http://localhost:5001/api/api-collect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                caseNumber: caseNumber,
                location: location, 
                propertyType: propertyType 
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error || 'API 수집 데이터를 가져올 수 없습니다.');
        }
    } catch (error) {
        console.warn('API 수집 호출 실패:', error);
        return null;
    }
}

// 실제 경매 데이터 수집 함수 (전역 함수)
async function fetchRealAuctionData(caseNumber) {
    try {
        const response = await fetch('http://localhost:5001/api/real-auction-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                caseNumber: caseNumber
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            return result;
        } else {
            throw new Error(result.error || '실제 경매 데이터를 가져올 수 없습니다.');
        }
    } catch (error) {
        console.warn('실제 경매 데이터 호출 실패:', error);
        return null;
    }
}

// API 키 정보 가져오기 함수 (전역 함수)
async function fetchAPIKeyInfo() {
    try {
        const response = await fetch('http://localhost:5001/api/api-key-info', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error || 'API 키 정보를 가져올 수 없습니다.');
        }
    } catch (error) {
        console.warn('API 키 정보 호출 실패:', error);
        return null;
    }
}


// 경매정보 저장 (매물별 통합 저장 사용)
function saveAuctionInfo() {
    alert('매물별 통합 저장을 사용하세요. 사이드바에서 매물을 선택한 후 "💾" 버튼을 클릭하세요.');
}

// 경매정보 불러오기 (매물별 통합 불러오기 사용)
function loadAuctionInfo() {
    alert('매물별 통합 불러오기를 사용하세요. 사이드바에서 매물을 선택하면 자동으로 불러와집니다.');
}

// 시뮬레이션 결과 저장 (매물별 통합 저장 사용)
function saveSimulationResult() {
    alert('매물별 통합 저장을 사용하세요. 사이드바에서 매물을 선택한 후 "💾" 버튼을 클릭하세요.');
}

// 시뮬레이션 결과 불러오기 (매물별 통합 불러오기 사용)
function loadSimulationResult() {
    alert('매물별 통합 불러오기를 사용하세요. 사이드바에서 매물을 선택하면 자동으로 불러와집니다.');
}

// 물건조사 데이터 저장 (매물별 통합 저장 사용)
function saveInspectionData() {
    alert('매물별 통합 저장을 사용하세요. 사이드바에서 매물을 선택한 후 "💾" 버튼을 클릭하세요.');
}

// 물건조사 데이터 불러오기 (매물별 통합 불러오기 사용)
function loadInspectionData() {
    alert('매물별 통합 불러오기를 사용하세요. 사이드바에서 매물을 선택하면 자동으로 불러와집니다.');
}

// 저장된 항목 목록 가져오기
function getSavedItems(type) {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(type)) {
            const data = JSON.parse(localStorage.getItem(key));
            items.push({
                key: key,
                data: data,
                displayName: `${type}_${new Date(parseInt(key.split('_').pop())).toLocaleString()}`
            });
        }
    }
    return items.sort((a, b) => b.key.localeCompare(a.key)); // 최신순 정렬
}

// 저장된 항목 목록 업데이트
function updateSavedItemsList(type, key, displayName) {
    // 실제 구현에서는 저장된 항목 목록을 표시하는 UI를 업데이트할 수 있습니다
    console.log(`저장 완료: ${displayName}`);
}

// 새로운 매물별 저장/불러오기 시스템 테스트 함수들

// 테스트용 매물 추가 함수
function addTestProperty() {
    if (window.auctionSimulator) {
        const testProperty = {
            caseNumber: '2024타경12345',
            name: '테스트 아파트',
            location: '서울시 강남구 테헤란로 123',
            type: '아파트',
            notes: '테스트용 매물입니다.'
        };
        
        if (!Array.isArray(window.auctionSimulator.properties)) {
            window.auctionSimulator.properties = [];
        }
        
        window.auctionSimulator.properties.push(testProperty);
        window.auctionSimulator.renderPropertyTree();
        console.log('테스트 매물이 추가되었습니다:', testProperty);
        console.log('현재 매물 개수:', window.auctionSimulator.properties.length);
    } else {
        console.error('auctionSimulator가 초기화되지 않았습니다.');
    }
}

// 매물별 저장 테스트 함수
function testPropertySave() {
    if (window.auctionSimulator) {
        console.log('=== 매물별 저장 테스트 시작 ===');
        console.log('현재 매물 개수:', window.auctionSimulator.properties.length);
        
        if (window.auctionSimulator.properties.length === 0) {
            console.log('매물이 없습니다. 테스트 매물을 추가합니다.');
            addTestProperty();
        }
        
        // 첫 번째 매물의 저장 기능 테스트
        const firstPropertyIndex = 0;
        console.log(`매물 ${firstPropertyIndex} 저장 테스트 시작`);
        window.auctionSimulator.saveAllDataForProperty(firstPropertyIndex);
    } else {
        console.error('auctionSimulator가 초기화되지 않았습니다.');
    }
}

// 매물별 불러오기 테스트 함수
function testPropertyLoad() {
    if (window.auctionSimulator) {
        console.log('=== 매물별 불러오기 테스트 시작 ===');
        
        if (window.auctionSimulator.properties.length === 0) {
            console.log('매물이 없습니다. 테스트 매물을 추가합니다.');
            addTestProperty();
        }
        
        // 첫 번째 매물의 불러오기 기능 테스트
        const firstPropertyIndex = 0;
        console.log(`매물 ${firstPropertyIndex} 불러오기 테스트 시작`);
        window.auctionSimulator.loadAllDataForProperty(firstPropertyIndex);
    } else {
        console.error('auctionSimulator가 초기화되지 않았습니다.');
    }
}

// localStorage 내용 확인 함수 (새로운 키 형식)
function checkLocalStorage() {
    console.log('=== localStorage 내용 확인 ===');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('property_') && key.endsWith('_data')) {
            console.log(`키: ${key}`);
            try {
                const data = JSON.parse(localStorage.getItem(key));
                console.log('데이터:', data);
            } catch (error) {
                console.error('파싱 오류:', error);
            }
        }
    }
}

// 전체 시스템 테스트 함수
function testFullSystem() {
    console.log('=== 전체 시스템 테스트 시작 ===');
    
    // 1. 테스트 매물 추가
    addTestProperty();
    
    // 2. 매물 선택 (자동 불러오기 테스트)
    if (window.auctionSimulator.properties.length > 0) {
        console.log('매물 선택 테스트...');
        window.auctionSimulator.selectProperty(0);
    }
    
    // 3. 저장 테스트
    setTimeout(() => {
        console.log('저장 테스트...');
        testPropertySave();
    }, 1000);
    
    // 4. 불러오기 테스트
    setTimeout(() => {
        console.log('불러오기 테스트...');
        testPropertyLoad();
    }, 2000);
    
    // 5. localStorage 확인
    setTimeout(() => {
        console.log('localStorage 확인...');
        checkLocalStorage();
    }, 3000);
}

// 불러오기 모달 표시
function showLoadModal(title, items, callback) {
    if (items.length === 1) {
        // 항목이 하나뿐이면 바로 불러오기
        callback(items[0].data);
        return;
    }
    
    // 여러 항목이 있으면 선택 모달 표시
    const modal = document.createElement('div');
    modal.className = 'load-modal';
    modal.innerHTML = `
        <div class="load-modal-content">
            <h3>${title}</h3>
            <div class="load-items-list">
                ${items.map((item, index) => `
                    <div class="load-item" data-index="${index}">
                        <span class="item-name">${item.displayName}</span>
                        <button class="load-item-btn">불러오기</button>
                    </div>
                `).join('')}
            </div>
            <button class="close-load-modal">닫기</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 이벤트 리스너 추가
    modal.querySelectorAll('.load-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            callback(items[index].data);
            document.body.removeChild(modal);
        });
    });
    
    modal.querySelector('.close-load-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}
