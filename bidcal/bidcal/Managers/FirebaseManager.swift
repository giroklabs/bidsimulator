import SwiftUI
import FirebaseCore
import FirebaseAuth
import FirebaseFirestore
import GoogleSignIn

// MARK: - Firebase Manager
class FirebaseManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var errorMessage: String?
    
    private let auth = Auth.auth()
    private let db = Firestore.firestore()
    
    init() {
        observeAuthState()
    }
    
    // MARK: - 인증 상태 관찰
    private func observeAuthState() {
        _ = auth.addStateDidChangeListener { [weak self] _, user in
            DispatchQueue.main.async {
                self?.isAuthenticated = user != nil
                self?.currentUser = user
            }
        }
    }
    
    // MARK: - Google 로그인
    func signInWithGoogle(presenting: UIViewController) async throws {
        guard let clientID = FirebaseApp.app()?.options.clientID else {
            throw NSError(domain: "FirebaseManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Firebase ClientID not found"])
        }
        
        let config = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = config
        
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenting)
        
        guard let idToken = result.user.idToken?.tokenString else {
            throw NSError(domain: "FirebaseManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "ID Token not found"])
        }
        
        let credential = GoogleAuthProvider.credential(withIDToken: idToken, accessToken: result.user.accessToken.tokenString)
        
        try await auth.signIn(with: credential)
    }
    
    // MARK: - Apple 로그인
    func signInWithApple(idToken: String, nonce: String) async throws {
        let credential = OAuthProvider.appleCredential(
            withIDToken: idToken,
            rawNonce: nonce,
            fullName: nil
        )
        try await auth.signIn(with: credential)
    }
    
    // MARK: - 로그아웃
    func signOut() {
        do {
            try auth.signOut()
            GIDSignIn.sharedInstance.signOut()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    // MARK: - 경매 데이터 조회
    func searchAuctions(filters: [String: Any] = [:], limit: Int = 100) async throws -> [[String: Any]] {
        var query: Query = db.collection("auction_details")
        
        // 필터 적용
        if let court = filters["court"] as? String {
            query = query.whereField("court", isEqualTo: court)
        }
        if let propertyType = filters["propertyType"] as? String {
            query = query.whereField("property_type", isEqualTo: propertyType)
        }
        if let status = filters["status"] as? String {
            query = query.whereField("status", isEqualTo: status)
        }
        
        // 결과 제한
        query = query.limit(to: limit)
        
        // 쿼리 실행
        let snapshot = try await query.getDocuments()
        
        // Dictionary 배열로 변환
        return snapshot.documents.map { doc in
            var data = doc.data()
            data["id"] = doc.documentID
            return data
        }
    }
    
    func getAuctionDetail(caseNumber: String) async throws -> [String: Any]? {
        let docRef = db.collection("auction_details").document(caseNumber)
        let doc = try await docRef.getDocument()
        
        guard doc.exists, var data = doc.data() else { return nil }
        
        data["id"] = doc.documentID
        return data
    }
}
