/**
 * 네이버 클라우드 데이터베이스 (MongoDB) 클래스
 * 네이버 클라우드 플랫폼의 Cloud DB for MongoDB를 사용하여 데이터 저장
 */

class NaverCloudDB {
    constructor() {
        this.API_ENDPOINT = 'https://mongodb.ap-northeast-2.ncloud.com';
        this.API_KEY = 'YOUR_API_KEY'; // 네이버 클라우드 플랫폼에서 발급
        this.SECRET_KEY = 'YOUR_SECRET_KEY'; // 네이버 클라우드 플랫폼에서 발급
        this.DATABASE_NAME = 'auction_simulator';
        this.COLLECTION_NAME = 'properties';
        this.isInitialized = false;
    }

    // 네이버 클라우드 DB 초기화
    async initialize() {
        try {
            await this.createDatabaseIfNotExists();
            await this.createCollectionIfNotExists();
            this.isInitialized = true;
            console.log('네이버 클라우드 DB 초기화 완료');
            return true;
        } catch (error) {
            console.error('네이버 클라우드 DB 초기화 실패:', error);
            return false;
        }
    }

    // 인증 헤더 생성
    generateAuthHeaders() {
        const timestamp = Date.now().toString();
        const nonce = Math.random().toString(36).substring(2, 15);
        const signature = btoa(`${this.API_KEY}:${timestamp}:${nonce}`);
        
        return {
            'Authorization': `Bearer ${signature}`,
            'x-ncp-apigw-timestamp': timestamp,
            'x-ncp-apigw-api-key': this.API_KEY,
            'Content-Type': 'application/json'
        };
    }

    // 데이터베이스 생성 (없는 경우)
    async createDatabaseIfNotExists() {
        try {
            // 데이터베이스 존재 확인
            const exists = await this.databaseExists();
            if (!exists) {
                await this.createDatabase();
                console.log('데이터베이스 생성 완료:', this.DATABASE_NAME);
            } else {
                console.log('기존 데이터베이스 사용:', this.DATABASE_NAME);
            }
        } catch (error) {
            console.error('데이터베이스 처리 실패:', error);
            throw error;
        }
    }

    // 데이터베이스 존재 확인
    async databaseExists() {
        try {
            const response = await this.makeRequest('GET', `/databases/${this.DATABASE_NAME}`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    // 데이터베이스 생성
    async createDatabase() {
        try {
            const response = await this.makeRequest('POST', '/databases', {
                name: this.DATABASE_NAME,
                description: '경매 시뮬레이터 데이터베이스'
            });
            
            if (!response.ok) {
                throw new Error(`데이터베이스 생성 실패: ${response.statusText}`);
            }
            return true;
        } catch (error) {
            console.error('데이터베이스 생성 실패:', error);
            throw error;
        }
    }

    // 컬렉션 생성 (없는 경우)
    async createCollectionIfNotExists() {
        try {
            // 컬렉션 존재 확인
            const exists = await this.collectionExists();
            if (!exists) {
                await this.createCollection();
                console.log('컬렉션 생성 완료:', this.COLLECTION_NAME);
            } else {
                console.log('기존 컬렉션 사용:', this.COLLECTION_NAME);
            }
        } catch (error) {
            console.error('컬렉션 처리 실패:', error);
            throw error;
        }
    }

    // 컬렉션 존재 확인
    async collectionExists() {
        try {
            const response = await this.makeRequest('GET', `/databases/${this.DATABASE_NAME}/collections/${this.COLLECTION_NAME}`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    // 컬렉션 생성
    async createCollection() {
        try {
            const response = await this.makeRequest('POST', `/databases/${this.DATABASE_NAME}/collections`, {
                name: this.COLLECTION_NAME,
                description: '경매 매물 정보 컬렉션'
            });
            
            if (!response.ok) {
                throw new Error(`컬렉션 생성 실패: ${response.statusText}`);
            }
            return true;
        } catch (error) {
            console.error('컬렉션 생성 실패:', error);
            throw error;
        }
    }

    // HTTP 요청 생성
    async makeRequest(method, uri, body = null) {
        const url = `${this.API_ENDPOINT}${uri}`;
        const headers = this.generateAuthHeaders();
        
        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        return await fetch(url, options);
    }

    // 매물 데이터 저장
    async savePropertyData(propertyIndex, data) {
        try {
            if (!this.isInitialized) {
                throw new Error('네이버 클라우드 DB가 초기화되지 않았습니다');
            }

            const document = {
                _id: `property_${propertyIndex}`,
                propertyIndex: propertyIndex,
                data: data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 기존 문서 존재 확인
            const existing = await this.getPropertyData(propertyIndex);
            
            if (existing) {
                // 업데이트
                document.updatedAt = new Date().toISOString();
                const response = await this.makeRequest('PUT', 
                    `/databases/${this.DATABASE_NAME}/collections/${this.COLLECTION_NAME}/documents/property_${propertyIndex}`,
                    document
                );
                
                if (!response.ok) {
                    throw new Error(`매물 데이터 업데이트 실패: ${response.statusText}`);
                }
                console.log(`매물 데이터 업데이트 완료: ${propertyIndex}`);
            } else {
                // 새로 생성
                const response = await this.makeRequest('POST', 
                    `/databases/${this.DATABASE_NAME}/collections/${this.COLLECTION_NAME}/documents`,
                    document
                );
                
                if (!response.ok) {
                    throw new Error(`매물 데이터 저장 실패: ${response.statusText}`);
                }
                console.log(`매물 데이터 저장 완료: ${propertyIndex}`);
            }

            return true;
        } catch (error) {
            console.error('매물 데이터 저장 실패:', error);
            throw error;
        }
    }

    // 매물 데이터 불러오기
    async getPropertyData(propertyIndex) {
        try {
            if (!this.isInitialized) {
                throw new Error('네이버 클라우드 DB가 초기화되지 않았습니다');
            }

            const response = await this.makeRequest('GET', 
                `/databases/${this.DATABASE_NAME}/collections/${this.COLLECTION_NAME}/documents/property_${propertyIndex}`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`매물 데이터를 찾을 수 없습니다: ${propertyIndex}`);
                    return null;
                }
                throw new Error(`매물 데이터 불러오기 실패: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`매물 데이터 불러오기 완료: ${propertyIndex}`);
            return result.data;
        } catch (error) {
            console.error('매물 데이터 불러오기 실패:', error);
            throw error;
        }
    }

    // 모든 매물 데이터 불러오기
    async getAllProperties() {
        try {
            if (!this.isInitialized) {
                throw new Error('네이버 클라우드 DB가 초기화되지 않았습니다');
            }

            const response = await this.makeRequest('GET', 
                `/databases/${this.DATABASE_NAME}/collections/${this.COLLECTION_NAME}/documents`
            );

            if (!response.ok) {
                throw new Error(`모든 매물 데이터 불러오기 실패: ${response.statusText}`);
            }

            const result = await response.json();
            const properties = result.documents.map(doc => ({
                propertyIndex: doc.propertyIndex,
                data: doc.data,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt
            }));

            console.log(`모든 매물 데이터 불러오기 완료: ${properties.length}개`);
            return properties;
        } catch (error) {
            console.error('모든 매물 데이터 불러오기 실패:', error);
            throw error;
        }
    }

    // 매물 데이터 삭제
    async deletePropertyData(propertyIndex) {
        try {
            if (!this.isInitialized) {
                throw new Error('네이버 클라우드 DB가 초기화되지 않았습니다');
            }

            const response = await this.makeRequest('DELETE', 
                `/databases/${this.DATABASE_NAME}/collections/${this.COLLECTION_NAME}/documents/property_${propertyIndex}`
            );

            if (!response.ok) {
                throw new Error(`매물 데이터 삭제 실패: ${response.statusText}`);
            }

            console.log(`매물 데이터 삭제 완료: ${propertyIndex}`);
            return true;
        } catch (error) {
            console.error('매물 데이터 삭제 실패:', error);
            throw error;
        }
    }

    // 백업 데이터 저장
    async createBackup(allData) {
        try {
            if (!this.isInitialized) {
                throw new Error('네이버 클라우드 DB가 초기화되지 않았습니다');
            }

            const backupDocument = {
                _id: `backup_${new Date().toISOString().split('T')[0]}`,
                type: 'backup',
                data: allData,
                createdAt: new Date().toISOString(),
                description: '전체 데이터 백업'
            };

            const response = await this.makeRequest('POST', 
                `/databases/${this.DATABASE_NAME}/collections/${this.COLLECTION_NAME}/documents`,
                backupDocument
            );

            if (!response.ok) {
                throw new Error(`백업 생성 실패: ${response.statusText}`);
            }

            console.log('백업 생성 완료');
            return true;
        } catch (error) {
            console.error('백업 생성 실패:', error);
            throw error;
        }
    }

    // 통계 조회
    async getStatistics() {
        try {
            if (!this.isInitialized) {
                throw new Error('네이버 클라우드 DB가 초기화되지 않았습니다');
            }

            const response = await this.makeRequest('GET', 
                `/databases/${this.DATABASE_NAME}/collections/${this.COLLECTION_NAME}/stats`
            );

            if (!response.ok) {
                throw new Error(`통계 조회 실패: ${response.statusText}`);
            }

            const stats = await response.json();
            console.log('통계 조회 완료:', stats);
            return stats;
        } catch (error) {
            console.error('통계 조회 실패:', error);
            throw error;
        }
    }
}

// 전역 인스턴스 생성
window.naverCloudDB = new NaverCloudDB();

// 경매 시뮬레이터와 연동하는 래퍼 함수들
window.naverCloudDBHelpers = {
    // 매물 데이터 저장
    async savePropertyData(propertyIndex, data) {
        return await window.naverCloudDB.savePropertyData(propertyIndex, data);
    },

    // 매물 데이터 불러오기
    async loadPropertyData(propertyIndex) {
        return await window.naverCloudDB.getPropertyData(propertyIndex);
    },

    // 모든 매물 데이터 불러오기
    async loadAllProperties() {
        return await window.naverCloudDB.getAllProperties();
    },

    // 매물 데이터 삭제
    async deletePropertyData(propertyIndex) {
        return await window.naverCloudDB.deletePropertyData(propertyIndex);
    },

    // 백업 생성
    async createBackup(allData) {
        return await window.naverCloudDB.createBackup(allData);
    },

    // 통계 조회
    async getStatistics() {
        return await window.naverCloudDB.getStatistics();
    }
};

console.log('네이버 클라우드 DB 모듈이 로드되었습니다.');
console.log('사용법:');
console.log('1. window.naverCloudDB.initialize() - 초기화');
console.log('2. window.naverCloudDBHelpers.savePropertyData(index, data) - 매물 저장');
console.log('3. window.naverCloudDBHelpers.loadPropertyData(index) - 매물 불러오기');
