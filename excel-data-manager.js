/**
 * 엑셀 데이터 관리 시스템
 * 매물 데이터를 엑셀로 내보내고 엑셀에서 데이터를 가져오는 기능
 */

class ExcelDataManager {
    constructor() {
        console.log('=== 엑셀 데이터 관리자 초기화 ===');
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

    // 엑셀로 데이터 내보내기
    exportToExcel() {
        console.log('=== 엑셀 내보내기 시작 ===');
        
        try {
            // 현재 매물 데이터 가져오기
            const properties = this.getCurrentProperties();
            console.log('내보낼 매물 데이터:', properties);

            if (properties.length === 0) {
                alert('내보낼 매물 데이터가 없습니다.');
                return;
            }

            // CSV 형식으로 데이터 변환
            const csvData = this.convertToCSV(properties);
            console.log('CSV 데이터 생성 완료');

            // 파일 다운로드
            this.downloadCSV(csvData, '매물데이터.csv');
            
            console.log('엑셀 내보내기 완료');
            alert(`${properties.length}개의 매물 데이터가 엑셀 파일로 내보내졌습니다.`);

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

    // 데이터를 CSV 형식으로 변환
    convertToCSV(properties) {
        console.log('CSV 형식으로 데이터 변환');
        
        // 헤더 정의
        const headers = [
            '사건번호',
            '매물명',
            '매물유형',
            '위치',
            '지역',
            '구/군',
            '메모',
            '생성일시',
            '수정일시'
        ];

        // 헤더 행 생성
        let csv = headers.join(',') + '\n';

        // 데이터 행 생성
        properties.forEach(property => {
            const row = [
                this.escapeCSV(property.caseNumber || ''),
                this.escapeCSV(property.name || ''),
                this.escapeCSV(property.type || ''),
                this.escapeCSV(property.location || ''),
                this.escapeCSV(property.region || ''),
                this.escapeCSV(property.district || ''),
                this.escapeCSV(property.notes || ''),
                this.escapeCSV(property.createdAt || ''),
                this.escapeCSV(property.updatedAt || '')
            ];
            csv += row.join(',') + '\n';
        });

        console.log('CSV 변환 완료, 총 행 수:', properties.length + 1);
        return csv;
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
        
        try {
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                alert('유효한 데이터가 없습니다. 헤더와 최소 1개 이상의 데이터 행이 필요합니다.');
                return;
            }

            // 헤더 파싱
            const headers = this.parseCSVLine(lines[0]);
            console.log('CSV 헤더:', headers);

            // 데이터 행 파싱
            const properties = [];
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length > 0 && values[0].trim()) { // 빈 행 제외
                    const property = this.createPropertyFromCSV(headers, values);
                    if (property) {
                        properties.push(property);
                    }
                }
            }

            console.log('파싱된 매물 데이터:', properties);

            if (properties.length === 0) {
                alert('유효한 매물 데이터가 없습니다.');
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
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    // CSV 데이터로부터 매물 객체 생성
    createPropertyFromCSV(headers, values) {
        try {
            const property = {};
            
            // 헤더와 값 매핑
            headers.forEach((header, index) => {
                const value = values[index] || '';
                
                switch (header) {
                    case '사건번호':
                        property.caseNumber = value;
                        break;
                    case '매물명':
                        property.name = value;
                        break;
                    case '매물유형':
                        property.type = value;
                        break;
                    case '위치':
                        property.location = value;
                        break;
                    case '지역':
                        property.region = value;
                        break;
                    case '구/군':
                        property.district = value;
                        break;
                    case '메모':
                        property.notes = value;
                        break;
                    case '생성일시':
                        property.createdAt = value || new Date().toISOString();
                        break;
                    case '수정일시':
                        property.updatedAt = value || new Date().toISOString();
                        break;
                }
            });

            // 필수 필드 확인
            if (!property.caseNumber && !property.name) {
                console.warn('필수 필드가 없는 매물 데이터 건너뛰기:', property);
                return null;
            }

            // ID 생성
            property.id = Date.now() + Math.random();
            
            return property;
            
        } catch (error) {
            console.error('매물 객체 생성 오류:', error);
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
        console.log('=== 가져오기 실행 ===');
        
        try {
            // StorageManager 우선 사용
            if (window.storageManager) {
                console.log('StorageManager로 데이터 가져오기');
                
                // 기존 데이터 초기화
                window.storageManager.clearAllProperties();
                
                // 새 데이터 추가
                properties.forEach(property => {
                    window.storageManager.addProperty(property);
                });
                
                // 저장
                const saveResult = window.storageManager.saveData();
                console.log('StorageManager 가져오기 결과:', saveResult);
                
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

console.log('엑셀 데이터 관리 시스템이 로드되었습니다.');
console.log('사용법:');
console.log('- excelDataManager.exportToExcel(): 매물 데이터를 엑셀로 내보내기');
console.log('- excelDataManager.showImportModal(): 엑셀 파일에서 데이터 가져오기');
