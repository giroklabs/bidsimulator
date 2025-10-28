import SwiftUI

struct SettingsRootView: View {
	@StateObject private var firebase = FirebaseManager()
	
	var body: some View {
		NavigationStack {
			Form {
				Section(header: Text("계정")) {
					if let user = firebase.currentUser {
						HStack {
							Image(systemName: "person.crop.circle.fill").font(.title2)
							VStack(alignment: .leading) {
								Text(user.email ?? user.uid).font(.subheadline)
								Text("로그인됨").foregroundColor(.secondary).font(.caption)
							}
							Spacer()
							Button("로그아웃") { firebase.signOut() }
						}
					} else {
						Button {
							if let vc = UIApplication.shared.connectedScenes
								.compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController })
								.first {
								Task {
									do { try await firebase.signInWithGoogle(presenting: vc) }
									catch { print("Google 로그인 실패: \(error)") }
								}
							}
						} label: {
							Label("Google로 로그인", systemImage: "g.circle")
						}
					}
				}
			}
			.navigationTitle("설정")
		}
	}
}
