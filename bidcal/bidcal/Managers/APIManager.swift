import Foundation
import Combine

/// 백엔드 API 호출 관리 클래스
@MainActor
class APIManager: ObservableObject {
    static let shared = APIManager()
    
    // 백엔드 서버 URL (로컬 개발용, 실제 배포시 변경 필요)
    private let baseURL = "http://localhost:5001/api"
    
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private init() {}
    
    /// 사건번호로 경매 데이터 조회
    func fetchAuctionData(caseNumber: String) async throws -> AuctionPropertyData? {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        // URL 구성
        guard let url = URL(string: "\(baseURL)/auction-data") else {
            throw APIError.invalidURL
        }
        
        // 요청 생성
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // 요청 바디
        let body: [String: Any] = ["caseNumber": caseNumber]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        // 네트워크 요청
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                throw APIError.httpError(statusCode: httpResponse.statusCode)
            }
            
            // JSON 파싱
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                throw APIError.invalidResponse
            }
            
            // 성공 여부 확인
            guard let success = json["success"] as? Bool, success else {
                let error = json["error"] as? String ?? "알 수 없는 오류"
                errorMessage = error
                throw APIError.serverError(message: error)
            }
            
            // 데이터 추출
            guard let dataDict = json["data"] as? [String: Any] else {
                throw APIError.invalidResponse
            }
            
            // AuctionPropertyData로 변환
            return try parseAuctionData(from: dataDict)
            
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            throw error
        } catch {
            errorMessage = "네트워크 오류가 발생했습니다."
            throw APIError.networkError(error)
        }
    }
    
    /// API 응답 데이터를 AuctionPropertyData로 파싱
    private func parseAuctionData(from dict: [String: Any]) throws -> AuctionPropertyData {
        var data = AuctionPropertyData()
        
        // 기본 정보
        data.caseNumber = dict["caseNumber"] as? String ?? ""
        data.propertyLocation = dict["location"] as? String ?? dict["propertyLocation"] as? String ?? ""
        data.court = dict["court"] as? String ?? ""
        
        // 가격 정보
        if let marketPrice = dict["marketPrice"] as? Double {
            data.marketPrice = String(format: "%.0f", marketPrice)
        } else if let marketPrice = dict["marketPrice"] as? Int {
            data.marketPrice = String(marketPrice)
        }
        
        if let appraisalPrice = dict["appraisalPrice"] as? Double {
            data.appraisalPrice = String(format: "%.0f", appraisalPrice)
        } else if let appraisalPrice = dict["appraisalPrice"] as? Int {
            data.appraisalPrice = String(appraisalPrice)
        }
        
        if let minimumBid = dict["minimumBid"] as? Double {
            data.minimumBid = String(format: "%.0f", minimumBid)
        } else if let minimumBid = dict["minimumBid"] as? Int {
            data.minimumBid = String(minimumBid)
        }
        
        // 경매일
        if let auctionDateString = dict["auctionDate"] as? String {
            let formatter = ISO8601DateFormatter()
            if let date = formatter.date(from: auctionDateString) {
                data.auctionDate = date
            }
        }
        
        // 물건 종류
        if let propertyTypeString = dict["propertyType"] as? String {
            data.propertyType = PropertyType.from(string: propertyTypeString)
        }
        
        return data
    }
}

/// API 응답 데이터 구조
struct AuctionPropertyData {
    var caseNumber: String = ""
    var propertyLocation: String = ""
    var court: String = ""
    var marketPrice: String = ""
    var appraisalPrice: String = ""
    var minimumBid: String = ""
    var auctionDate: Date = Date()
    var propertyType: PropertyType = .apartment
}

/// API 에러 타입
enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case serverError(message: String)
    case networkError(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "유효하지 않은 URL입니다."
        case .invalidResponse:
            return "응답 형식이 올바르지 않습니다."
        case .httpError(let statusCode):
            return "HTTP 오류 (\(statusCode))"
        case .serverError(let message):
            return message
        case .networkError(let error):
            return "네트워크 오류: \(error.localizedDescription)"
        }
    }
}

