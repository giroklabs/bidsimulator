/**
 * 네이버 클라우드 플랫폼 Object Storage 클래스
 * 네이버 클라우드 플랫폼을 사용하여 데이터 저장
 */

class NaverCloudStorage {
    constructor() {
        this.ACCESS_KEY = 'YOUR_ACCESS_KEY'; // 네이버 클라우드 플랫폼에서 발급
        this.SECRET_KEY = 'YOUR_SECRET_KEY'; // 네이버 클라우드 플랫폼에서 발급
        this.REGION = 'KR-standard'; // 리전
        this.BUCKET_NAME = 'auction-simulator'; // 버킷 이름
        this.ENDPOINT = 'https://kr.object.ncloudstorage.com';
        this.isInitialized = false;
    }

    // 네이버 클라우드 스토리지 초기화
    async initialize() {
        try {
            await this.createBucketIfNotExists();
            this.isInitialized = true;
            console.log('네이버 클라우드 Storage 초기화 완료');
            return true;
        } catch (error) {
            console.error('네이버 클라우드 Storage 초기화 실패:', error);
            return false;
        }
    }

    // AWS Signature V4 생성
    generateSignature(method, uri, headers, payload) {
        // AWS Signature V4 알고리즘 구현
        // 실제 구현에서는 AWS SDK나 별도 라이브러리 사용 권장
        const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const date = timestamp.substr(0, 8);
        
        // 간단한 시그니처 생성 (실제로는 더 복잡한 알고리즘 필요)
        const signature = btoa(`${this.ACCESS_KEY}:${timestamp}:${method}:${uri}`);
        return {
            timestamp,
            signature,
            authorization: `AWS4-HMAC-SHA256 Credential=${this.ACCESS_KEY}/${date}/${this.REGION}/s3/aws4_request, SignedHeaders=host;x-amz-date, Signature=${signature}`
        };
    }

    // 버킷 생성 (없는 경우)
    async createBucketIfNotExists() {
        try {
            // 버킷 존재 확인
            const exists = await this.bucketExists();
            if (!exists) {
                await this.createBucket();
                console.log('버킷 생성 완료:', this.BUCKET_NAME);
            } else {
                console.log('기존 버킷 사용:', this.BUCKET_NAME);
            }
        } catch (error) {
            console.error('버킷 처리 실패:', error);
            throw error;
        }
    }

    // 버킷 존재 확인
    async bucketExists() {
        try {
            const response = await this.makeRequest('HEAD', `/${this.BUCKET_NAME}`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    // 버킷 생성
    async createBucket() {
        try {
            const response = await this.makeRequest('PUT', `/${this.BUCKET_NAME}`);
            if (!response.ok) {
                throw new Error(`버킷 생성 실패: ${response.statusText}`);
            }
            return true;
        } catch (error) {
            console.error('버킷 생성 실패:', error);
            throw error;
        }
    }

    // HTTP 요청 생성
    async makeRequest(method, uri, body = null, headers = {}) {
        const url = `${this.ENDPOINT}${uri}`;
        const signature = this.generateSignature(method, uri, headers, body);
        
        const requestHeaders = {
            'Host': 'kr.object.ncloudstorage.com',
            'x-amz-date': signature.timestamp,
            'Authorization': signature.authorization,
            ...headers
        };

        const options = {
            method,
            headers: requestHeaders
        };

        if (body) {
            options.body = body;
        }

        return await fetch(url, options);
    }

    // 데이터 저장
    async saveData(filename, data) {
        try {
            if (!this.isInitialized) {
                throw new Error('네이버 클라우드 스토리지가 초기화되지 않았습니다');
            }

            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            const uri = `/${this.BUCKET_NAME}/auction-simulator/${filename}`;
            const response = await this.makeRequest('PUT', uri, blob, {
                'Content-Type': 'application/json'
            });

            if (!response.ok) {
                throw new Error(`데이터 저장 실패: ${response.statusText}`);
            }

            console.log(`데이터 저장 완료: ${filename}`);
            return true;
        } catch (error) {
            console.error('데이터 저장 실패:', error);
            throw error;
        }
    }

    // 데이터 불러오기
    async loadData(filename) {
        try {
            if (!this.isInitialized) {
                throw new Error('네이버 클라우드 스토리지가 초기화되지 않았습니다');
            }

            const uri = `/${this.BUCKET_NAME}/auction-simulator/${filename}`;
            const response = await this.makeRequest('GET', uri);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`파일을 찾을 수 없습니다: ${filename}`);
                    return null;
                }
                throw new Error(`데이터 불러오기 실패: ${response.statusText}`);
            }

            const text = await response.text();
            const data = JSON.parse(text);
            console.log(`데이터 불러오기 완료: ${filename}`);
            return data;
        } catch (error) {
            console.error('데이터 불러오기 실패:', error);
            throw error;
        }
    }

    // 파일 목록 조회
    async listFiles() {
        try {
            if (!this.isInitialized) {
                throw new Error('네이버 클라우드 스토리지가 초기화되지 않았습니다');
            }

            const uri = `/${this.BUCKET_NAME}?prefix=auction-simulator/`;
            const response = await this.makeRequest('GET', uri);

            if (!response.ok) {
                throw new Error(`파일 목록 조회 실패: ${response.statusText}`);
            }

            const xmlText = await response.text();
            const files = this.parseFileList(xmlText);
            return files;
        } catch (error) {
            console.error('파일 목록 조회 실패:', error);
            throw error;
        }
    }

    // XML 파싱 (파일 목록)
    parseFileList(xmlText) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const contents = xmlDoc.getElementsByTagName('Contents');
            
            const files = [];
            for (let i = 0; i < contents.length; i++) {
                const key = contents[i].getElementsByTagName('Key')[0].textContent;
                const lastModified = contents[i].getElementsByTagName('LastModified')[0].textContent;
                const size = contents[i].getElementsByTagName('Size')[0].textContent;
                
                files.push({
                    key: key,
                    name: key.replace('auction-simulator/', ''),
                    lastModified: lastModified,
                    size: size
                });
            }
            
            return files;
        } catch (error) {
            console.error('XML 파싱 실패:', error);
            return [];
        }
    }

    // 파일 삭제
    async deleteFile(filename) {
        try {
            if (!this.isInitialized) {
                throw new Error('네이버 클라우드 스토리지가 초기화되지 않았습니다');
            }

            const uri = `/${this.BUCKET_NAME}/auction-simulator/${filename}`;
            const response = await this.makeRequest('DELETE', uri);

            if (!response.ok) {
                throw new Error(`파일 삭제 실패: ${response.statusText}`);
            }

            console.log(`파일 삭제 완료: ${filename}`);
            return true;
        } catch (error) {
            console.error('파일 삭제 실패:', error);
            throw error;
        }
    }

    // 파일 존재 확인
    async fileExists(filename) {
        try {
            const uri = `/${this.BUCKET_NAME}/auction-simulator/${filename}`;
            const response = await this.makeRequest('HEAD', uri);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

// 전역 인스턴스 생성
window.naverCloudStorage = new NaverCloudStorage();

// 경매 시뮬레이터와 연동하는 래퍼 함수들
window.naverCloudHelpers = {
    // 매물 데이터 저장
    async savePropertyData(propertyIndex, data) {
        const filename = `매물_${propertyIndex}_${Date.now()}.json`;
        return await window.naverCloudStorage.saveData(filename, data);
    },

    // 매물 데이터 불러오기
    async loadPropertyData(filename) {
        return await window.naverCloudStorage.loadData(filename);
    },

    // 모든 매물 데이터 저장
    async saveAllProperties(properties) {
        const filename = `모든매물_${Date.now()}.json`;
        return await window.naverCloudStorage.saveData(filename, properties);
    },

    // 백업 데이터 저장
    async createBackup(allData) {
        const filename = `백업_${new Date().toISOString().split('T')[0]}.json`;
        return await window.naverCloudStorage.saveData(filename, allData);
    }
};

console.log('네이버 클라우드 Storage 모듈이 로드되었습니다.');
console.log('사용법:');
console.log('1. window.naverCloudStorage.initialize() - 초기화');
console.log('2. window.naverCloudHelpers.savePropertyData(index, data) - 매물 저장');
console.log('3. window.naverCloudHelpers.loadPropertyData(filename) - 매물 불러오기');
