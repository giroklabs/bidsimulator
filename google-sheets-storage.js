/**
 * 구글 시트 저장소 클래스 (간단한 방법)
 * 구글 시트를 데이터베이스로 사용하여 데이터 저장
 */

class GoogleSheetsStorage {
    constructor() {
        this.SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // 구글 시트 ID
        this.SHEET_NAME = '경매매물데이터';
        this.API_KEY = 'YOUR_API_KEY'; // Google Cloud Console에서 발급
        this.isInitialized = false;
    }

    // 구글 시트 API 초기화
    async initialize() {
        try {
            await this.loadGoogleSheetsAPI();
            await this.createOrPrepareSheet();
            this.isInitialized = true;
            console.log('Google Sheets Storage 초기화 완료');
            return true;
        } catch (error) {
            console.error('Google Sheets Storage 초기화 실패:', error);
            return false;
        }
    }

    // Google Sheets API 로드
    loadGoogleSheetsAPI() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window.gapi.load('client', () => {
                    window.gapi.client.init({
                        apiKey: this.API_KEY,
                        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
                    }).then(() => {
                        resolve();
                    }).catch(reject);
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 시트 생성 또는 준비
    async createOrPrepareSheet() {
        try {
            // 시트 존재 확인
            const response = await window.gapi.client.sheets.spreadsheets.get({
                spreadsheetId: this.SPREADSHEET_ID
            });

            const sheets = response.result.sheets;
            const targetSheet = sheets.find(sheet => sheet.properties.title === this.SHEET_NAME);

            if (!targetSheet) {
                // 새 시트 생성
                await window.gapi.client.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.SPREADSHEET_ID,
                    resource: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: this.SHEET_NAME
                                }
                            }
                        }]
                    }
                });

                // 헤더 추가
                await this.addHeaders();
            }

            console.log('시트 준비 완료');
        } catch (error) {
            console.error('시트 준비 실패:', error);
            throw error;
        }
    }

    // 헤더 추가
    async addHeaders() {
        const headers = [
            'ID', '매물명', '사건번호', '입찰가격', '시세', '감정가', 
            '최저입찰가', '경매유형', '경쟁자수', '시장상황', '입찰긴급도',
            '유찰횟수', '수리비', '매각가율', '권장입찰가', '낙찰확률',
            '저장일시'
        ];

        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: this.SPREADSHEET_ID,
            range: `${this.SHEET_NAME}!A1:Q1`,
            valueInputOption: 'RAW',
            resource: {
                values: [headers]
            }
        });
    }

    // 매물 데이터 저장
    async savePropertyData(propertyData) {
        try {
            if (!this.isInitialized) {
                throw new Error('Google Sheets Storage가 초기화되지 않았습니다');
            }

            const rowData = [
                Date.now(), // ID
                propertyData.name || '',
                propertyData.caseNumber || '',
                propertyData.bidPrice || '',
                propertyData.marketPrice || '',
                propertyData.appraisalPrice || '',
                propertyData.minimumBid || '',
                propertyData.auctionType || '',
                propertyData.competitorCount || '',
                propertyData.marketCondition || '',
                propertyData.urgency || '',
                propertyData.failedCount || '',
                propertyData.renovationCost || '',
                propertyData.saleRate || '',
                propertyData.recommendedBid || '',
                propertyData.winProbability || '',
                new Date().toISOString()
            ];

            // 새 행 추가
            await window.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.SPREADSHEET_ID,
                range: `${this.SHEET_NAME}!A:Q`,
                valueInputOption: 'RAW',
                resource: {
                    values: [rowData]
                }
            });

            console.log('매물 데이터 저장 완료:', propertyData.name);
            return true;
        } catch (error) {
            console.error('매물 데이터 저장 실패:', error);
            throw error;
        }
    }

    // 모든 매물 데이터 불러오기
    async loadAllProperties() {
        try {
            if (!this.isInitialized) {
                throw new Error('Google Sheets Storage가 초기화되지 않았습니다');
            }

            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.SPREADSHEET_ID,
                range: `${this.SHEET_NAME}!A2:Q`
            });

            const rows = response.result.values || [];
            const properties = rows.map(row => ({
                id: row[0],
                name: row[1],
                caseNumber: row[2],
                bidPrice: row[3],
                marketPrice: row[4],
                appraisalPrice: row[5],
                minimumBid: row[6],
                auctionType: row[7],
                competitorCount: row[8],
                marketCondition: row[9],
                urgency: row[10],
                failedCount: row[11],
                renovationCost: row[12],
                saleRate: row[13],
                recommendedBid: row[14],
                winProbability: row[15],
                savedAt: row[16]
            }));

            console.log('매물 데이터 불러오기 완료:', properties.length + '개');
            return properties;
        } catch (error) {
            console.error('매물 데이터 불러오기 실패:', error);
            throw error;
        }
    }

    // 특정 매물 데이터 업데이트
    async updatePropertyData(propertyId, propertyData) {
        try {
            // 먼저 해당 ID의 행 찾기
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.SPREADSHEET_ID,
                range: `${this.SHEET_NAME}!A:A`
            });

            const rows = response.result.values || [];
            const rowIndex = rows.findIndex(row => row[0] === propertyId.toString());

            if (rowIndex === -1) {
                throw new Error('해당 ID의 매물을 찾을 수 없습니다');
            }

            const actualRow = rowIndex + 2; // 시트는 1부터 시작, 헤더 포함

            const rowData = [
                propertyId,
                propertyData.name || '',
                propertyData.caseNumber || '',
                propertyData.bidPrice || '',
                propertyData.marketPrice || '',
                propertyData.appraisalPrice || '',
                propertyData.minimumBid || '',
                propertyData.auctionType || '',
                propertyData.competitorCount || '',
                propertyData.marketCondition || '',
                propertyData.urgency || '',
                propertyData.failedCount || '',
                propertyData.renovationCost || '',
                propertyData.saleRate || '',
                propertyData.recommendedBid || '',
                propertyData.winProbability || '',
                new Date().toISOString()
            ];

            await window.gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.SPREADSHEET_ID,
                range: `${this.SHEET_NAME}!A${actualRow}:Q${actualRow}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [rowData]
                }
            });

            console.log('매물 데이터 업데이트 완료:', propertyData.name);
            return true;
        } catch (error) {
            console.error('매물 데이터 업데이트 실패:', error);
            throw error;
        }
    }

    // 매물 데이터 삭제
    async deletePropertyData(propertyId) {
        try {
            // 해당 ID의 행 찾기
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.SPREADSHEET_ID,
                range: `${this.SHEET_NAME}!A:A`
            });

            const rows = response.result.values || [];
            const rowIndex = rows.findIndex(row => row[0] === propertyId.toString());

            if (rowIndex === -1) {
                throw new Error('해당 ID의 매물을 찾을 수 없습니다');
            }

            const actualRow = rowIndex + 2; // 시트는 1부터 시작, 헤더 포함

            // 행 삭제
            await window.gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.SPREADSHEET_ID,
                resource: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: 0, // 첫 번째 시트
                                dimension: 'ROWS',
                                startIndex: actualRow - 1,
                                endIndex: actualRow
                            }
                        }
                    }]
                }
            });

            console.log('매물 데이터 삭제 완료:', propertyId);
            return true;
        } catch (error) {
            console.error('매물 데이터 삭제 실패:', error);
            throw error;
        }
    }
}

// 전역 인스턴스 생성
window.googleSheetsStorage = new GoogleSheetsStorage();

// 경매 시뮬레이터와 연동하는 래퍼 함수들
window.googleSheetsHelpers = {
    // 초기화
    async initialize() {
        return await window.googleSheetsStorage.initialize();
    },

    // 매물 저장
    async saveProperty(propertyData) {
        return await window.googleSheetsStorage.savePropertyData(propertyData);
    },

    // 모든 매물 불러오기
    async loadAllProperties() {
        return await window.googleSheetsStorage.loadAllProperties();
    },

    // 매물 업데이트
    async updateProperty(propertyId, propertyData) {
        return await window.googleSheetsStorage.updatePropertyData(propertyId, propertyData);
    },

    // 매물 삭제
    async deleteProperty(propertyId) {
        return await window.googleSheetsStorage.deletePropertyData(propertyId);
    }
};

console.log('Google Sheets Storage 모듈이 로드되었습니다.');
console.log('사용법:');
console.log('1. window.googleSheetsHelpers.initialize() - 초기화');
console.log('2. window.googleSheetsHelpers.saveProperty(data) - 매물 저장');
console.log('3. window.googleSheetsHelpers.loadAllProperties() - 모든 매물 불러오기');
