import SwiftUI

// MARK: - 앱 테마 (블랙 포인트 + 그레이 톤)
struct AppTheme {
    // MARK: - Colors (Black Accent + Gray Tone)
    
    // 블랙 계열 (강조색)
    static let accent = Color(red: 0.12, green: 0.12, blue: 0.14)       // 블랙 #1E1E24
    static let accentDark = Color(red: 0.08, green: 0.08, blue: 0.10)   // 진한 블랙
    static let accentLight = Color(red: 0.30, green: 0.30, blue: 0.32)  // 연한 블랙
    static let accentPale = Color(red: 0.88, green: 0.88, blue: 0.90)   // 매우 연한 블랙
    
    // 그레이 계열
    static let primary = Color(red: 0.20, green: 0.20, blue: 0.22)      // 다크 그레이 (메인 텍스트)
    static let secondary = Color(red: 0.50, green: 0.50, blue: 0.52)    // 미디엄 그레이 (서브 텍스트)
    static let tertiary = Color(red: 0.70, green: 0.70, blue: 0.72)     // 라이트 그레이 (비활성)
    
    // 배경색
    static let background = Color(red: 0.98, green: 0.97, blue: 0.95)   // 크림 베이지 배경
    static let cardBackground = Color(red: 1.0, green: 1.0, blue: 1.0)  // 화이트 카드
    static let surfaceBackground = Color(red: 0.96, green: 0.96, blue: 0.94) // 서피스 배경
    
    // MARK: - Gradients
    static let accentGradient = LinearGradient(
        colors: [accent, accentDark],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let softAccentGradient = LinearGradient(
        colors: [accentLight, accent],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let backgroundGradient = LinearGradient(
        colors: [background, Color.white],
        startPoint: .top,
        endPoint: .bottom
    )
    
    static let cardGradient = LinearGradient(
        colors: [cardBackground, surfaceBackground.opacity(0.5)],
        startPoint: .top,
        endPoint: .bottom
    )
    
    // MARK: - Shadows
    static let cardShadow = Color.black.opacity(0.06)
    static let accentShadow = accent.opacity(0.3)
    static let buttonShadow = accent.opacity(0.25)
    
    // MARK: - Corner Radius
    static let cardCornerRadius: CGFloat = 16
    static let cornerRadius: CGFloat = 12
    static let smallCornerRadius: CGFloat = 8
    
    // MARK: - Padding
    static let largePadding: CGFloat = 20
    static let mediumPadding: CGFloat = 16
    static let smallPadding: CGFloat = 12
    static let tinyPadding: CGFloat = 8
}

// MARK: - 애니메이션 헬퍼
struct AnimationHelper {
    static let quick = Animation.easeInOut(duration: 0.15)
    static let smooth = Animation.easeInOut(duration: 0.25)
    static let bouncy = Animation.spring(response: 0.3, dampingFraction: 0.65)
}

// MARK: - 버튼 스타일
struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(AnimationHelper.quick, value: configuration.isPressed)
    }
}

// MARK: - 그라데이션 버튼
struct GradientButton: View {
    let title: String
    let icon: String?
    let action: () -> Void
    var isEnabled: Bool = true
    
    init(title: String, icon: String? = nil, isEnabled: Bool = true, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.isEnabled = isEnabled
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold))
                }
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
            }
            .foregroundColor(isEnabled ? AppTheme.primary : AppTheme.tertiary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadius)
                    .fill(isEnabled ? AppTheme.accentGradient : LinearGradient(colors: [AppTheme.surfaceBackground], startPoint: .leading, endPoint: .trailing))
            )
            .shadow(color: isEnabled ? AppTheme.accentShadow : AppTheme.cardShadow, radius: 8, x: 0, y: 4)
        }
        .disabled(!isEnabled)
        .buttonStyle(ScaleButtonStyle())
    }
}

// MARK: - 텍스트 필드 스타일
struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .font(.system(size: 16))
            .padding(AppTheme.mediumPadding)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadius)
                    .fill(Color(.systemGray6))
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadius)
                    .stroke(AppTheme.secondary.opacity(0.3), lineWidth: 1)
            )
    }
}

// MARK: - 카드 스타일
struct CardBackground: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(AppTheme.cardBackground)
            .cornerRadius(AppTheme.cardCornerRadius)
            .shadow(color: AppTheme.cardShadow, radius: 8, x: 0, y: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        self.modifier(CardBackground())
    }
}

