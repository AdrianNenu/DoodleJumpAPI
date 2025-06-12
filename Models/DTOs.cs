namespace DoodleJumpAPI.Models
{
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool IsAdmin { get; set; } = false;
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public bool IsAdmin { get; set; }
    }

    public class LeaderboardEntry
    {
        public int ScoreId { get; set; }
        public string Username { get; set; } = string.Empty;
        public int Points { get; set; }
        public DateTime AchievedDate { get; set; }
    }

    public class ScoreSubmission
    {
        public int Points { get; set; }
    }

    public class AchievementDto
    {
        public int AchievementID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int RequiredScore { get; set; }
        public string Icon { get; set; } = string.Empty;
        public bool IsUnlocked { get; set; }
        public DateTime? UnlockedDate { get; set; }
    }

    public class UserAchievementDto
    {
        public string AchievementName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public DateTime UnlockedDate { get; set; }
    }

    // Profile DTOs
    public class UpdateProfileRequest
    {
        public string? Username { get; set; }
        public string? CurrentPassword { get; set; }
        public string? NewPassword { get; set; }
    }

    public class UserProfileResponse
    {
        public string Username { get; set; } = string.Empty;
        public bool IsAdmin { get; set; }
        public DateTime CreatedDate { get; set; }
        public int TotalScores { get; set; }
        public int BestScore { get; set; }
        public int UnlockedAchievements { get; set; }
    }

    public class UpdateScoreRequest
    {
        public int Points { get; set; }
    }

    // Admin DTOs
    public class CreateAchievementRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int RequiredScore { get; set; }
        public string Icon { get; set; } = "trophy";
    }

    public class UpdateAchievementRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int? RequiredScore { get; set; }
        public string? Icon { get; set; }
    }

    public class AdminUserResponse
    {
        public int UserID { get; set; }
        public string Username { get; set; } = string.Empty;
        public bool IsAdmin { get; set; }
        public DateTime CreatedDate { get; set; }
        public int TotalScores { get; set; }
        public int BestScore { get; set; }
    }

    public class AdminUpdateUserRequest
    {
        public string? Username { get; set; }
        public bool? IsAdmin { get; set; }
    }
}