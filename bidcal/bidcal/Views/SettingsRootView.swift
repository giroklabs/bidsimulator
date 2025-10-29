import SwiftUI
import AuthenticationServices

struct SettingsRootView: View {
	@StateObject private var firebase = FirebaseManager()
	@State private var showingDeleteAccount = false
	
	var body: some View {
		ZStack {
			AppTheme.background.ignoresSafeArea()
			
			VStack(spacing: 0) {
				// 커스텀 헤더
				customHeader
				
				ScrollView {
					VStack(spacing: AppTheme.largePadding) {
						// 계정 섹션
						accountSection
						
						// 앱 메뉴 섹션
						appMenuSection
						
						// 앱 정보 섹션
						appInfoSection
					}
					.padding(AppTheme.largePadding)
				}
			}
		}
		.alert("계정 탈퇴", isPresented: $showingDeleteAccount) {
			Button("취소", role: .cancel) { }
			Button("탈퇴하기", role: .destructive) {
				// TODO: 계정 탈퇴 로직 구현
			}
		} message: {
			Text("정말 계정을 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")
		}
	}
	
	// MARK: - Custom Header
	private var customHeader: some View {
		HStack {
			Text("설정")
				.font(.system(size: 28, weight: .bold))
				.foregroundColor(AppTheme.primary)
			
			Spacer()
		}
		.padding(.horizontal, 20)
		.padding(.top, 8)
		.padding(.bottom, 12)
		.background(AppTheme.background)
	}
	
	// MARK: - Account Section
	private var accountSection: some View {
		VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
			Text("계정")
				.font(.headline)
				.foregroundColor(AppTheme.secondary)
			
			if let user = firebase.currentUser {
				// 로그인된 상태
				HStack(spacing: AppTheme.mediumPadding) {
					Image(systemName: "person.crop.circle.fill")
						.font(.system(size: 50))
						.foregroundColor(Color(red: 0.26, green: 0.61, blue: 0.96)) // 파란색 포인트
					
					VStack(alignment: .leading, spacing: 4) {
						Text(user.email ?? "사용자")
							.font(.headline)
							.foregroundColor(AppTheme.primary)
						
						Text("로그인됨")
							.font(.caption)
							.foregroundColor(AppTheme.secondary)
					}
					
					Spacer()
					
					Button {
						firebase.signOut()
					} label: {
						Text("로그아웃")
							.font(.subheadline)
							.foregroundColor(.white)
							.padding(.horizontal, 16)
							.padding(.vertical, 8)
							.background(
								RoundedRectangle(cornerRadius: AppTheme.smallCornerRadius)
									.fill(Color(red: 0.26, green: 0.61, blue: 0.96))
							)
					}
				}
				.padding(AppTheme.mediumPadding)
				.background(AppTheme.cardBackground)
				.cornerRadius(AppTheme.cardCornerRadius)
				.shadow(color: AppTheme.cardShadow, radius: 8, x: 0, y: 2)
			} else {
				// 로그인 안 된 상태
				VStack(spacing: 12) {
					// Apple 로그인
					SignInWithAppleButton(
						onRequest: { request in
							request.requestedScopes = [.fullName, .email]
						},
						onCompletion: { result in
							switch result {
							case .success(let authResults):
								// Apple 로그인 성공
								print("Apple 로그인 성공: \(authResults)")
								Task {
									// TODO: Apple 로그인 Firebase 연동
								}
							case .failure(let error):
								print("Apple 로그인 실패: \(error)")
							}
						}
					)
					.frame(height: 50)
					.cornerRadius(8)
					.signInWithAppleButtonStyle(.black)
					
					// Google 로그인
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
						ZStack {
							// 배경
							RoundedRectangle(cornerRadius: 8)
								.fill(Color(red: 0.26, green: 0.61, blue: 0.96)) // Google 브랜드 색상 유지
							
							// 가운데 컨텐츠
							HStack(spacing: 12) {
								// Google 로고
								Text("G")
									.font(.system(size: 20, weight: .bold))
									.foregroundColor(.white)
									.frame(width: 24, height: 24)
									.background(Color.blue)
									.cornerRadius(4)
								
								Text("Google로 로그인")
									.font(.system(size: 16, weight: .medium))
									.foregroundColor(.white)
							}
						}
						.frame(height: 50)
					}
				}
			}
		}
	}
	
	// MARK: - App Menu Section
	private var appMenuSection: some View {
		VStack(spacing: 0) {
			// 앱 사용법
			MenuRow(
				icon: "book.fill",
				iconColor: Color(red: 0.26, green: 0.61, blue: 0.96),
				title: "앱 사용법",
				action: {
					// TODO: 앱 사용법 화면으로 이동
				}
			)
			
			Divider().padding(.leading, AppTheme.mediumPadding)
			
			// 공지사항
			MenuRow(
				icon: "megaphone.fill",
				iconColor: .orange,
				title: "공지사항",
				action: {
					// TODO: 공지사항 화면으로 이동
				}
			)
			
			Divider().padding(.leading, AppTheme.mediumPadding)
			
			// 개인정보 처리방침
			MenuRow(
				icon: "hand.raised.fill",
				iconColor: .green,
				title: "개인정보 처리방침",
				action: {
					// TODO: 개인정보 처리방침 화면으로 이동
				}
			)
			
			Divider().padding(.leading, AppTheme.mediumPadding)
			
			// 계정 탈퇴
			MenuRow(
				icon: "trash.fill",
				iconColor: .red,
				title: "계정 탈퇴",
				action: {
					showingDeleteAccount = true
				}
			)
		}
		.background(AppTheme.cardBackground)
		.cornerRadius(AppTheme.cardCornerRadius)
		.shadow(color: AppTheme.cardShadow, radius: 8, x: 0, y: 2)
	}
	
	// MARK: - App Info Section
	private var appInfoSection: some View {
		VStack(spacing: 0) {
			InfoRow(
				icon: "info.circle.fill",
				iconColor: AppTheme.secondary,
				title: "현재 버전",
				value: "1.0.0"
			)
			
			Divider().padding(.leading, AppTheme.mediumPadding)
			
			InfoRow(
				icon: "building.2.fill",
				iconColor: AppTheme.secondary,
				title: "제작사",
				value: "GIROK Labs."
			)
		}
		.background(AppTheme.cardBackground)
		.cornerRadius(AppTheme.cardCornerRadius)
		.shadow(color: AppTheme.cardShadow, radius: 8, x: 0, y: 2)
	}
}

// MARK: - Menu Row
struct MenuRow: View {
	let icon: String
	let iconColor: Color
	let title: String
	let action: () -> Void
	
	var body: some View {
		Button(action: action) {
			HStack(spacing: AppTheme.mediumPadding) {
				// 아이콘
				Image(systemName: icon)
					.font(.system(size: 20))
					.foregroundColor(iconColor)
					.frame(width: 24)
				
				// 제목
				Text(title)
					.font(.subheadline)
					.foregroundColor(AppTheme.primary)
				
				Spacer()
				
				// 화살표
				Image(systemName: "chevron.right")
					.font(.caption)
					.foregroundColor(AppTheme.secondary)
			}
			.padding(AppTheme.mediumPadding)
		}
		.buttonStyle(ScaleButtonStyle())
	}
}

// MARK: - Info Row
struct InfoRow: View {
	let icon: String
	let iconColor: Color
	let title: String
	let value: String
	
	var body: some View {
		HStack(spacing: AppTheme.mediumPadding) {
			// 아이콘
			Image(systemName: icon)
				.font(.system(size: 20))
				.foregroundColor(iconColor)
				.frame(width: 24)
			
			// 제목
			Text(title)
				.font(.subheadline)
				.foregroundColor(AppTheme.secondary)
			
			Spacer()
			
			// 값
			Text(value)
				.font(.subheadline)
				.foregroundColor(AppTheme.primary)
		}
		.padding(AppTheme.mediumPadding)
	}
}
