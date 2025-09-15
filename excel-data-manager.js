/**
 * 엑셀 데이터 관리 시스템 (확장 버전)
 * 매물 데이터를 엑셀로 내보내고 엑셀에서 데이터를 가져오는 기능
 * 경매정보, 물건조사, 시뮬레이션 결과 등 모든 데이터 포함
 */

class ExcelDataManager {
    constructor() {
        console.log('=== 엑셀 데이터 관리자 초기화 (확장 버전) ===');
        this.init();
    }

    init() {
        console.log('엑셀 데이터 관리자 초기화 시작');
        this.setupEventListeners();
        console.log('엑셀 데이터 관리자 초기화 완료');
    }

    setupEventListeners() {
        // 엑셀 내보내기 버튼
        const exportBtn = document.getElementById('excelExportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                console.log('엑셀 내보내기 버튼 클릭');
                this.exportToExcel();
            });
            console.log('엑셀 내보내기 버튼 이벤트 리스너 등록 완료');
        } else {
            console.warn('excelExportBtn 버튼을 찾을 수 없습니다');
        }

        // 엑셀 가져오기 버튼
        const importBtn = document.getElementById('excelImportBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                console.log('엑셀 가져오기 버튼 클릭');
                this.showImportModal();
            });
            console.log('엑셀 가져오기 버튼 이벤트 리스너 등록 완료');
        } else {
            console.warn('excelImportBtn 버튼을 찾을 수 없습니다');
        }

        // 파일 선택 input
        const fileInput = document.getElementById('excelFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                console.log('엑셀 파일 선택됨');
                this.handleFileSelect(e);
            });
            console.log('엑셀 파일 선택 이벤트 리스너 등록 완료');
        } else {
            console.warn('excelFileInput 요소를 찾을 수 없습니다');
        }

        // 가져오기 모달 닫기 버튼
        const closeImportBtn = document.getElementById('closeImportModal');
        if (closeImportBtn) {
            closeImportBtn.addEventListener('click', () => {
                console.log('가져오기 모달 닫기 버튼 클릭');
                this.hideImportModal();
            });
            console.log('가져오기 모달 닫기 버튼 이벤트 리스너 등록 완료');
        } else {
            console.warn('closeImportModal 버튼을 찾을 수 없습니다');
        }
    }

    // 엑셀로 데이터 내보내기 (모든 데이터 포함)
    exportToExcel() {
        console.log('=== 엑셀 내보내기 시작 (모든 데이터 포함) ===');

        try {
            // 현재 매물 데이터 가져오기
            const properties = this.getCurrentProperties();
            console.log('내보낼 매물 데이터:', properties);

            if (properties.length === 0) {
                alert('내보낼 매물 데이터가 없습니다.');
                return;
            }

            // CSV 형식으로 데이터 변환 (모든 데이터 포함)
            const csvData = this.convertToCSV(properties);
            console.log('CSV 데이터 생성 완료');

            // 파일 다운로드
            this.downloadCSV(csvData, '매물데이터_전체.csv');

            console.log('엑셀 내보내기 완료');
            alert(`${properties.length}개의 매물 데이터가 엑셀 파일로 내보내졌습니다.\n(경매정보, 물건조사, 시뮬레이션 결과 포함)`);

        } catch (error) {
            console.error('엑셀 내보내기 오류:', error);
            alert('엑셀 내보내기 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 현재 매물 데이터 가져오기
    getCurrentProperties() {
        console.log('현재 매물 데이터 가져오기');
        
        try {
            if (window.storageManager) {
                const properties = window.storageManager.getProperties();
                console.log('StorageManager에서 매물 데이터 가져옴:', properties.length, '개');
                return properties;
            } else if (window.simpleStorage) {
                const properties = window.simpleStorage.getProperties();
                console.log('SimpleStorage에서 매물 데이터 가져옴:', properties.length, '개');
                return properties;
            } else {
                console.warn('저장소가 없습니다');
                return [];
            }
        } catch (error) {
            console.error('매물 데이터 가져오기 오류:', error);
            return [];
        }
    }

    // 데이터를 CSV 형식으로 변환 (모든 데이터 포함)
    convertToCSV(properties) {
        console.log('CSV 형식으로 데이터 변환 (모든 데이터 포함)');

        // 확장된 헤더 정의
        const headers = [
            // 기본 매물 정보
            '사건번호',
            '매물명',
            '매물유형',
            '위치',
            '지역',
            '구/군',
            '메모',
            '생성일시',
            '수정일시',

            // 경매 기본 정보
            '법원',
            '경매일',
            '경매상태',
            '입찰가',
            '감정가',
            '최저가',
            '보증금',
            '경매유형',
            '유찰횟수',

            // 경매 결과 정보
            '낙찰일',
            '낙찰가',
            '2순위와의차이',
            '시세대비낙찰액비율',
            '경매결과메모',

            // 물건조사 정보
            '건물연도',
            '층수',
            '전용면적',
            '공급면적',
            '방수',
            '욕실수',
            '주차대수',
            '엘리베이터',
            '난방방식',
            '관리비',
            '관리사무소',
            '보안시설',
            'CCTV',
            '경비실',
            '출입통제',
            '주변환경',
            '교통편의성',
            '교육시설',
            '의료시설',
            '상업시설',
            '기타특이사항',

            // 시뮬레이션 결과
            '추천입찰가',
            '낙찰확률',
            '예상수익률',
            '시장상황',
            '긴급도',
            '입찰전략',
            '위험도',
            '투자가치'
        ];

        // 헤더 행 생성
        let csv = headers.join(',') + '\n';

        // 데이터 행 생성
        properties.forEach(property => {
            // 매물별 저장된 모든 데이터 가져오기
            const allData = this.getPropertyAllData(property);

            const row = [
                // 기본 매물 정보
                this.escapeCSV(property.caseNumber || ''),
                this.escapeCSV(property.name || ''),
                this.escapeCSV(property.type || ''),
                this.escapeCSV(property.location || ''),
                this.escapeCSV(property.region || ''),
                this.escapeCSV(property.district || ''),
                this.escapeCSV(property.notes || ''),
                this.escapeCSV(property.createdAt || ''),
                this.escapeCSV(property.updatedAt || ''),

                // 경매 기본 정보
                this.escapeCSV(allData.auctionInfo?.court || ''),
                this.escapeCSV(allData.auctionInfo?.auctionDate || ''),
                this.escapeCSV(allData.auctionInfo?.auctionStatus || ''),
                this.escapeCSV(allData.auctionInfo?.bidPrice || ''),
                this.escapeCSV(allData.auctionInfo?.appraisalValue || ''),
                this.escapeCSV(allData.auctionInfo?.minimumBid || ''),
                this.escapeCSV(allData.auctionInfo?.deposit || ''),
                this.escapeCSV(allData.auctionInfo?.auctionType || ''),
                this.escapeCSV(allData.auctionInfo?.failedCount || ''),

                // 경매 결과 정보
                this.escapeCSV(allData.auctionResult?.auctionDate || ''),
                this.escapeCSV(allData.auctionResult?.winningBid || ''),
                this.escapeCSV(allData.auctionResult?.secondBidDifference || ''),
                this.escapeCSV(allData.auctionResult?.marketRatio || ''),
                this.escapeCSV(allData.auctionResult?.auctionResultMemo || ''),

                // 물건조사 정보
                this.escapeCSV(allData.inspectionData?.buildingYear || ''),
                this.escapeCSV(allData.inspectionData?.floor || ''),
                this.escapeCSV(allData.inspectionData?.exclusiveArea || ''),
                this.escapeCSV(allData.inspectionData?.supplyArea || ''),
                this.escapeCSV(allData.inspectionData?.rooms || ''),
                this.escapeCSV(allData.inspectionData?.bathrooms || ''),
                this.escapeCSV(allData.inspectionData?.parkingSpaces || ''),
                this.escapeCSV(allData.inspectionData?.elevator || ''),
                this.escapeCSV(allData.inspectionData?.heatingSystem || ''),
                this.escapeCSV(allData.inspectionData?.managementFee || ''),
                this.escapeCSV(allData.inspectionData?.managementOffice || ''),
                this.escapeCSV(allData.inspectionData?.securityFacilities || ''),
                this.escapeCSV(allData.inspectionData?.cctv || ''),
                this.escapeCSV(allData.inspectionData?.securityRoom || ''),
                this.escapeCSV(allData.inspectionData?.accessControl || ''),
                this.escapeCSV(allData.inspectionData?.surroundingEnvironment || ''),
                this.escapeCSV(allData.inspectionData?.transportation || ''),
                this.escapeCSV(allData.inspectionData?.educationalFacilities || ''),
                this.escapeCSV(allData.inspectionData?.medicalFacilities || ''),
                this.escapeCSV(allData.inspectionData?.commercialFacilities || ''),
                this.escapeCSV(allData.inspectionData?.otherNotes || ''),

                // 시뮬레이션 결과
                this.escapeCSV(allData.simulationResult?.recommendedBidPrice || ''),
                this.escapeCSV(allData.simulationResult?.winProbability || ''),
                this.escapeCSV(allData.simulationResult?.expectedReturn || ''),
                this.escapeCSV(allData.auctionInfo?.marketCondition || ''),
                this.escapeCSV(allData.auctionInfo?.urgency || ''),
                this.escapeCSV(allData.simulationResult?.strategy || ''),
                this.escapeCSV(allData.simulationResult?.riskLevel || ''),
                this.escapeCSV(allData.simulationResult?.investmentValue || '')
            ];
            csv += row.join(',') + '\n';
        });

        console.log('CSV 변환 완료, 총 행 수:', properties.length + 1);
        return csv;
    }

    // 매물별 저장된 모든 데이터 가져오기
    getPropertyAllData(property) {
        console.log('=== 매물별 모든 데이터 가져오기 시작 ===');
        console.log('입력 매물 정보:', property);

        try {
            // StorageManager의 데이터 구조 확인
            const storageKey = 'auctionSimulatorData';
            const storageData = localStorage.getItem(storageKey);

            if (!storageData) {
                console.warn('❌ StorageManager 데이터가 없습니다');
                return { auctionInfo: {}, inspectionData: {}, simulationResult: {} };
            }

            console.log('StorageManager 원본 데이터:', storageData);
            const parsedData = JSON.parse(storageData);
            console.log('StorageManager 파싱된 데이터:', parsedData);

            // 현재 선택된 매물의 인덱스 찾기
            const properties = parsedData.properties || [];
            console.log('저장된 전체 매물 목록:', properties);

            // 매물 매칭을 위한 함수
            const findMatchingProperty = (targetProperty, propertyList) => {
                return propertyList.findIndex(p =>
                    (p.caseNumber && p.caseNumber === targetProperty.caseNumber) ||
                    (p.name && p.name === targetProperty.name) ||
                    (p.location && p.location === targetProperty.location)
                );
            };

            const matchingIndex = findMatchingProperty(property, properties);
            console.log('매칭되는 매물 인덱스:', matchingIndex);

            if (matchingIndex === -1) {
                console.warn('❌ 매칭되는 매물을 찾을 수 없습니다');
                return { auctionInfo: {}, inspectionData: {}, simulationResult: {} };
            }

            const matchedProperty = properties[matchingIndex];
            console.log('매칭된 매물:', matchedProperty);

            // 매물별 상세 데이터 키 생성 및 조회
            const propertyKey = `property_all_${matchingIndex}`;
            console.log('매물별 데이터 키:', propertyKey);

            const propertyData = localStorage.getItem(propertyKey);
            if (!propertyData) {
                console.warn(`❌ ${propertyKey} 키에 데이터가 없습니다`);
                return { auctionInfo: {}, inspectionData: {}, simulationResult: {} };
            }

            console.log('매물별 원본 데이터:', propertyData);
            const parsedPropertyData = JSON.parse(propertyData);
            console.log('매물별 파싱된 데이터:', parsedPropertyData);

            const result = {
                auctionInfo: parsedPropertyData.auctionInfo || {},
                inspectionData: parsedPropertyData.inspectionData || {},
                simulationResult: parsedPropertyData.simulationResult || {}
            };

            console.log('✅ 최종 반환 데이터:', result);
            return result;

        } catch (error) {
            console.error('매물별 데이터 가져오기 오류:', error);
            return { auctionInfo: {}, inspectionData: {}, simulationResult: {} };
        }
    }

    // CSV 필드 이스케이프 처리
    escapeCSV(field) {
        if (field === null || field === undefined) {
            return '';
        }
        
        const str = String(field);
        // 쉼표, 따옴표, 줄바꿈이 포함된 경우 따옴표로 감싸고 내부 따옴표는 이스케이프
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    // CSV 파일 다운로드
    downloadCSV(csvData, filename) {
        console.log('CSV 파일 다운로드 시작:', filename);
        
        // BOM 추가 (엑셀에서 한글 깨짐 방지)
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });
        
        // 다운로드 링크 생성
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        
        console.log('CSV 파일 다운로드 완료');
    }

    // 엑셀 가져오기 모달 표시
    showImportModal() {
        console.log('=== 엑셀 가져오기 모달 표시 ===');
        
        const modal = document.getElementById('excelImportModal');
        if (!modal) {
            console.error('엑셀 가져오기 모달을 찾을 수 없습니다');
            alert('엑셀 가져오기 모달을 찾을 수 없습니다.');
            return;
        }

        // 파일 입력 초기화
        const fileInput = document.getElementById('excelFileInput');
        if (fileInput) {
            fileInput.value = '';
        }

        // 모달 표시
        modal.style.display = 'block';
        
        console.log('엑셀 가져오기 모달 표시 완료');
    }

    // 엑셀 가져오기 모달 숨김
    hideImportModal() {
        console.log('=== 엑셀 가져오기 모달 숨김 ===');
        
        const modal = document.getElementById('excelImportModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        console.log('엑셀 가져오기 모달 숨김 완료');
    }

    // 파일 선택 처리
    handleFileSelect(event) {
        console.log('=== 파일 선택 처리 ===');
        
        const file = event.target.files[0];
        if (!file) {
            console.log('선택된 파일이 없습니다');
            return;
        }

        console.log('선택된 파일:', file.name, file.type, file.size);

        // 파일 타입 확인
        if (!this.isValidFileType(file)) {
            alert('CSV 또는 Excel 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 읽기
        this.readFile(file);
    }

    // 유효한 파일 타입 확인
    isValidFileType(file) {
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        const validExtensions = ['.csv', '.xls', '.xlsx'];
        const fileName = file.name.toLowerCase();
        
        return validTypes.includes(file.type) || 
               validExtensions.some(ext => fileName.endsWith(ext));
    }

    // 파일 읽기
    readFile(file) {
        console.log('=== 파일 읽기 시작 ===');
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                console.log('파일 읽기 완료');
                const content = e.target.result;
                
                // CSV 파일인 경우
                if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
                    this.parseCSV(content);
                } else {
                    // Excel 파일인 경우 (간단한 CSV 변환 필요)
                    alert('Excel 파일은 CSV 형식으로 저장 후 업로드해주세요.');
                    console.warn('Excel 파일 직접 지원은 아직 구현되지 않음');
                }
                
            } catch (error) {
                console.error('파일 읽기 오류:', error);
                alert('파일 읽기 중 오류가 발생했습니다: ' + error.message);
            }
        };

        reader.onerror = (error) => {
            console.error('파일 읽기 실패:', error);
            alert('파일 읽기에 실패했습니다.');
        };

        // CSV 파일로 읽기
        reader.readAsText(file, 'utf-8');
    }

    // CSV 데이터 파싱
    parseCSV(content) {
        console.log('=== CSV 데이터 파싱 시작 ===');
        console.log('원본 CSV 내용:', content);
        
        try {
            // BOM 제거 (UTF-8 BOM이 있는 경우)
            let cleanContent = content;
            if (content.charCodeAt(0) === 0xFEFF) {
                cleanContent = content.slice(1);
                console.log('BOM 제거됨');
            }
            
            const lines = cleanContent.split('\n').filter(line => line.trim());
            console.log('분할된 라인 수:', lines.length);
            console.log('분할된 라인들:', lines);
            
            if (lines.length < 2) {
                alert('유효한 데이터가 없습니다. 헤더와 최소 1개 이상의 데이터 행이 필요합니다.');
                return;
            }

            // 헤더 파싱
            const headers = this.parseCSVLine(lines[0]);
            console.log('CSV 헤더:', headers);
            console.log('헤더 개수:', headers.length);

            // 데이터 행 파싱
            const properties = [];
            for (let i = 1; i < lines.length; i++) {
                console.log(`--- 데이터 행 ${i} 파싱 ---`);
                console.log('원본 라인:', lines[i]);
                
                const values = this.parseCSVLine(lines[i]);
                console.log('파싱된 값들:', values);
                console.log('값 개수:', values.length);
                
                // 빈 행이 아닌 경우에만 처리
                if (values.length > 0 && values.some(v => v.trim())) {
                    console.log('매물 객체 생성 시도...');
                    const property = this.createPropertyFromCSV(headers, values);
                    if (property) {
                        console.log('✅ 매물 객체 생성 성공:', property);
                        properties.push(property);
                    } else {
                        console.warn('❌ 매물 객체 생성 실패');
                    }
                } else {
                    console.log('빈 행 건너뛰기');
                }
            }

            console.log('파싱된 매물 데이터:', properties);
            console.log('파싱된 매물 개수:', properties.length);

            if (properties.length === 0) {
                alert('유효한 매물 데이터가 없습니다.\n\nCSV 파일 형식을 확인해주세요:\n- 첫 번째 행: 헤더\n- 두 번째 행부터: 데이터\n- 필수 필드: 사건번호 또는 매물명');
                return;
            }

            // 데이터 가져오기 확인
            this.confirmImport(properties);

        } catch (error) {
            console.error('CSV 파싱 오류:', error);
            alert('CSV 파일 파싱 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // CSV 라인 파싱 (쉼표와 따옴표 처리)
    parseCSVLine(line) {
        console.log('CSV 라인 파싱 시작:', line);
        
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // 이스케이프된 따옴표
                    current += '"';
                    i++; // 다음 따옴표 건너뛰기
                } else {
                    // 따옴표 시작/끝
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 필드 구분자
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // 마지막 필드 추가
        result.push(current.trim());
        
        console.log('파싱 결과:', result);
        return result;
    }

    // CSV 데이터로부터 매물 객체 생성 (모든 데이터 포함)
    createPropertyFromCSV(headers, values) {
        console.log('=== 매물 객체 생성 시작 (모든 데이터 포함) ===');
        console.log('헤더:', headers);
        console.log('값:', values);
        
        try {
            const property = {
                // 기본 매물 정보
                basicInfo: {},
                // 상세 데이터
                auctionInfo: {},
                inspectionData: {},
                simulationResult: {},
                auctionResult: {}
            };
            
            // 헤더와 값 매핑
            headers.forEach((header, index) => {
                const value = values[index] || '';
                console.log(`매핑: ${header} = "${value}"`);
                
                // 헤더 정규화 (공백 제거)
                const normalizedHeader = header.trim();
                
                // 기본 매물 정보 매핑
                switch (normalizedHeader) {
                    case '사건번호':
                        property.basicInfo.caseNumber = value;
                        break;
                    case '매물명':
                        property.basicInfo.name = value;
                        break;
                    case '매물유형':
                        property.basicInfo.type = value;
                        break;
                    case '위치':
                        property.basicInfo.location = value;
                        break;
                    case '지역':
                        property.basicInfo.region = value;
                        break;
                    case '구/군':
                        property.basicInfo.district = value;
                        break;
                    case '메모':
                        property.basicInfo.notes = value;
                        break;
                    case '생성일시':
                        property.basicInfo.createdAt = value || new Date().toISOString();
                        break;
                    case '수정일시':
                        property.basicInfo.updatedAt = value || new Date().toISOString();
                        break;
                    
                    // 경매 기본 정보
                    case '법원':
                        property.auctionInfo.court = value;
                        break;
                    case '경매일':
                        property.auctionInfo.auctionDate = value;
                        break;
                    case '경매상태':
                        property.auctionInfo.auctionStatus = value;
                        break;
                    case '입찰가':
                        property.auctionInfo.bidPrice = value;
                        break;
                    case '감정가':
                        property.auctionInfo.appraisalValue = value;
                        break;
                    case '최저가':
                        property.auctionInfo.minimumBid = value;
                        break;
                    case '보증금':
                        property.auctionInfo.deposit = value;
                        break;
                    case '경매유형':
                        property.auctionInfo.auctionType = value;
                        break;
                    case '유찰횟수':
                        property.auctionInfo.failedCount = value;
                        break;
                    
                    // 경매 결과 정보
                    case '낙찰일':
                        property.auctionResult.auctionDate = value;
                        break;
                    case '낙찰가':
                        property.auctionResult.winningBid = value;
                        break;
                    case '2순위와의차이':
                        property.auctionResult.secondBidDifference = value;
                        break;
                    case '시세대비낙찰액비율':
                        property.auctionResult.marketRatio = value;
                        break;
                    case '경매결과메모':
                        property.auctionResult.auctionResultMemo = value;
                        break;
                    
                    // 물건조사 정보
                    case '건물연도':
                        property.inspectionData.buildingYear = value;
                        break;
                    case '층수':
                        property.inspectionData.floor = value;
                        break;
                    case '전용면적':
                        property.inspectionData.exclusiveArea = value;
                        break;
                    case '공급면적':
                        property.inspectionData.supplyArea = value;
                        break;
                    case '방수':
                        property.inspectionData.rooms = value;
                        break;
                    case '욕실수':
                        property.inspectionData.bathrooms = value;
                        break;
                    case '주차대수':
                        property.inspectionData.parkingSpaces = value;
                        break;
                    case '엘리베이터':
                        property.inspectionData.elevator = value;
                        break;
                    case '난방방식':
                        property.inspectionData.heatingSystem = value;
                        break;
                    case '관리비':
                        property.inspectionData.managementFee = value;
                        break;
                    case '관리사무소':
                        property.inspectionData.managementOffice = value;
                        break;
                    case '보안시설':
                        property.inspectionData.securityFacilities = value;
                        break;
                    case 'CCTV':
                        property.inspectionData.cctv = value;
                        break;
                    case '경비실':
                        property.inspectionData.securityRoom = value;
                        break;
                    case '출입통제':
                        property.inspectionData.accessControl = value;
                        break;
                    case '주변환경':
                        property.inspectionData.surroundingEnvironment = value;
                        break;
                    case '교통편의성':
                        property.inspectionData.transportation = value;
                        break;
                    case '교육시설':
                        property.inspectionData.educationalFacilities = value;
                        break;
                    case '의료시설':
                        property.inspectionData.medicalFacilities = value;
                        break;
                    case '상업시설':
                        property.inspectionData.commercialFacilities = value;
                        break;
                    case '기타특이사항':
                        property.inspectionData.otherNotes = value;
                        break;
                    
                    // 시뮬레이션 결과
                    case '추천입찰가':
                        property.simulationResult.recommendedBidPrice = value;
                        break;
                    case '낙찰확률':
                        property.simulationResult.winProbability = value;
                        break;
                    case '예상수익률':
                        property.simulationResult.expectedReturn = value;
                        break;
                    case '시장상황':
                        property.auctionInfo.marketCondition = value;
                        break;
                    case '긴급도':
                        property.auctionInfo.urgency = value;
                        break;
                    case '입찰전략':
                        property.simulationResult.strategy = value;
                        break;
                    case '위험도':
                        property.simulationResult.riskLevel = value;
                        break;
                    case '투자가치':
                        property.simulationResult.investmentValue = value;
                        break;
                    
                    default:
                        // 알 수 없는 헤더는 무시
                        console.log(`알 수 없는 헤더 무시: ${normalizedHeader}`);
                        break;
                }
            });

            console.log('생성된 매물 객체 (필수 필드 확인 전):', property);

            // 필수 필드 확인 (기본 정보에서)
            if (!property.basicInfo.caseNumber && !property.basicInfo.name) {
                console.warn('❌ 필수 필드가 없는 매물 데이터 건너뛰기:', property);
                console.warn('필수 필드: 사건번호 또는 매물명 중 하나');
                return null;
            }

            // ID 생성
            property.basicInfo.id = Date.now() + Math.random();
            
            console.log('✅ 매물 객체 생성 성공 (모든 데이터 포함):', property);
            return property;
            
        } catch (error) {
            console.error('❌ 매물 객체 생성 오류:', error);
            return null;
        }
    }

    // 가져오기 확인
    confirmImport(properties) {
        console.log('=== 가져오기 확인 ===');
        
        const message = `총 ${properties.length}개의 매물 데이터를 가져오시겠습니까?\n\n주의: 기존 데이터는 덮어쓰여집니다.`;
        
        if (confirm(message)) {
            this.executeImport(properties);
        } else {
            console.log('가져오기 취소됨');
        }
    }

    // 가져오기 실행
    executeImport(properties) {
        console.log('=== 가져오기 실행 (모든 데이터 포함) ===');
        
        try {
            // StorageManager 우선 사용
            if (window.storageManager) {
                console.log('StorageManager로 데이터 가져오기 (모든 데이터 포함)');
                
                // 기존 데이터 초기화
                window.storageManager.clearAllProperties();
                
                // 새 데이터 추가 (기본 정보와 상세 데이터 분리)
                properties.forEach((property, index) => {
                    console.log(`--- 매물 ${index} 데이터 처리 ---`);
                    console.log('처리할 매물:', property);
                    
                    // 기본 매물 정보만 StorageManager에 추가
                    const basicProperty = property.basicInfo;
                    window.storageManager.addProperty(basicProperty);
                    
                    // 상세 데이터는 별도 키로 저장
                    const detailedData = {
                        auctionInfo: property.auctionInfo,
                        inspectionData: property.inspectionData,
                        simulationResult: property.simulationResult,
                        auctionResult: property.auctionResult
                    };
                    
                    // 매물별 상세 데이터 저장
                    const propertyKey = `property_all_${index}`;
                    localStorage.setItem(propertyKey, JSON.stringify(detailedData));
                    console.log(`✅ 매물 ${index} 상세 데이터 저장 완료: ${propertyKey}`);
                });
                
                // 기본 데이터 저장
                const saveResult = window.storageManager.saveData();
                console.log('StorageManager 기본 데이터 저장 결과:', saveResult);
                
            } else if (window.simpleStorage) {
                console.log('SimpleStorage로 데이터 가져오기 (폴백)');
                
                // SimpleStorage 방식으로 가져오기
                const allData = {
                    properties: properties,
                    currentPropertyIndex: 0,
                    lastUpdated: new Date().toISOString()
                };
                
                const saveResult = window.simpleStorage.saveAllData(allData);
                console.log('SimpleStorage 가져오기 결과:', saveResult);
                
            } else {
                throw new Error('저장소가 없습니다');
            }

            // UI 새로고침
            this.refreshUI();
            
            // 모달 닫기
            this.hideImportModal();
            
            alert(`${properties.length}개의 매물 데이터를 성공적으로 가져왔습니다.`);
            console.log('가져오기 완료');

        } catch (error) {
            console.error('가져오기 실행 오류:', error);
            alert('데이터 가져오기 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // UI 새로고침
    refreshUI() {
        console.log('=== UI 새로고침 ===');
        
        try {
            // 기존 AuctionSimulator의 renderPropertyTree 호출
            if (window.auctionSimulator && window.auctionSimulator.renderPropertyTree) {
                window.auctionSimulator.renderPropertyTree();
                console.log('AuctionSimulator를 통한 UI 새로고침 완료');
            } else {
                console.warn('AuctionSimulator를 찾을 수 없습니다');
            }
        } catch (error) {
            console.error('UI 새로고침 오류:', error);
        }
    }
}

// 전역 인스턴스 생성
window.excelDataManager = new ExcelDataManager();

// 디버깅 함수들
window.debugLocalStorage = function() {
    console.log('=== localStorage 디버깅 ===');
    console.log('총 키 개수:', localStorage.length);

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${i}: ${key}`);
        try {
            const value = localStorage.getItem(key);
            const parsed = JSON.parse(value);
            console.log('  데이터:', parsed);
        } catch (e) {
            console.log('  원본 데이터:', localStorage.getItem(key));
        }
    }
};

window.debugPropertyData = function() {
    console.log('=== 매물 데이터 디버깅 ===');
    if (window.storageManager) {
        const properties = window.storageManager.getProperties();
        console.log('StorageManager 매물 목록:', properties);

        // 각 매물의 상세 데이터 확인
        properties.forEach((property, index) => {
            console.log(`--- 매물 ${index}: ${property.name || property.caseNumber} ---`);
            const key = `property_all_${index}`;
            const data = localStorage.getItem(key);
            if (data) {
                console.log(`  ${key} 데이터:`, JSON.parse(data));
            } else {
                console.log(`  ${key} 데이터 없음`);
            }
        });
    }
    if (window.simpleStorage) {
        const properties = window.simpleStorage.getProperties();
        console.log('SimpleStorage 매물 목록:', properties);
    }
};

window.testPropertyMatching = function() {
    console.log('=== 매물 매칭 테스트 ===');
    if (window.storageManager) {
        const properties = window.storageManager.getProperties();
        console.log('테스트할 매물들:', properties);

        properties.forEach(property => {
            console.log(`--- ${property.name || property.caseNumber} 매칭 테스트 ---`);
            const result = window.excelDataManager.getPropertyAllData(property);
            console.log('매칭 결과:', result);
        });
    }
};

// CSV 테스트 파일 생성
window.createTestCSV = function() {
    console.log('=== 테스트 CSV 파일 생성 ===');
    
    const testData = `사건번호,매물명,매물유형,위치,지역,구/군,메모,생성일시,수정일시
2024타경12345,강남구 아파트,아파트,서울시 강남구,서울,강남구,매각예정,2024-01-15T10:00:00Z,2024-01-15T10:00:00Z
2024타경67890,부산시 오피스텔,오피스텔,부산시 해운대구,부산,해운대구,경매진행중,2024-01-16T10:00:00Z,2024-01-16T10:00:00Z`;
    
    // BOM 추가
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + testData], { type: 'text/csv;charset=utf-8;' });
    
    // 다운로드 링크 생성
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', '매물데이터_테스트.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    console.log('✅ 테스트 CSV 파일 생성 완료: 매물데이터_테스트.csv');
    alert('테스트 CSV 파일이 생성되었습니다: 매물데이터_테스트.csv\n\n이 파일을 사용하여 엑셀 가져오기 기능을 테스트해보세요.');
};

// CSV 불러오기 테스트
window.testCSVImport = function() {
    console.log('=== CSV 불러오기 테스트 시작 ===');
    
    if (!window.excelDataManager) {
        console.error('❌ ExcelDataManager가 없습니다');
        return;
    }
    
    // 테스트 CSV 데이터 생성
    const testCSVData = `사건번호,매물명,매물유형,위치,지역,구/군,메모,생성일시,수정일시,법원,경매일,경매상태,입찰가,감정가,최저가,보증금,경매유형,유찰횟수,낙찰일,낙찰가,2순위와의차이,시세대비낙찰액비율,경매결과메모,건물연도,층수,전용면적,공급면적,방수,욕실수,주차대수,엘리베이터,난방방식,관리비,관리사무소,보안시설,CCTV,경비실,출입통제,주변환경,교통편의성,교육시설,의료시설,상업시설,기타특이사항,추천입찰가,낙찰확률,예상수익률,시장상황,긴급도,입찰전략,위험도,투자가치
2024타경12345,강남구 아파트,아파트,서울시 강남구,서울,강남구,매각예정,2024-01-15T10:00:00Z,2024-01-15T10:00:00Z,서울중앙지법,2024-02-15,진행중,500000000,600000000,400000000,50000000,강제경매,0,2024-02-15,520000000,5000000,86.7,성공,2010,15,84.5,105.2,3,2,1,있음,개별난방,150000,있음,있음,있음,있음,출입카드,주택가,지하철5분,초등학교1km,병원500m,백화점2km,조용한주거지,480000000,65,12,보통,보통,공격적,중,높음`;
    
    console.log('테스트 CSV 데이터:', testCSVData);
    
    // CSV 파싱 테스트
    console.log('CSV 파싱 테스트 시작...');
    window.excelDataManager.parseCSV(testCSVData);
};

console.log('엑셀 데이터 관리 시스템이 로드되었습니다. (확장 버전)');
console.log('사용법:');
console.log('- excelDataManager.exportToExcel(): 매물 데이터를 엑셀로 내보내기 (모든 데이터 포함)');
console.log('- excelDataManager.showImportModal(): 엑셀 파일에서 데이터 가져오기');
console.log('디버깅 함수들:');
console.log('- debugLocalStorage(): localStorage의 모든 데이터 확인');
console.log('- debugPropertyData(): 매물 데이터 확인');
console.log('- testPropertyMatching(): 매물 매칭 테스트');
console.log('- createTestCSV(): 테스트용 CSV 파일 생성');
console.log('- testCSVImport(): CSV 불러오기 테스트');
