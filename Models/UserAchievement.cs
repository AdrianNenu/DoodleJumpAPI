namespace DoodleJumpAPI.Models
{
    public class UserAchievement
    {
        public int UserAchievementID { get; set; }
        public int UserID { get; set; }
        public int AchievementID { get; set; }
        public DateTime UnlockedDate { get; set; } = DateTime.Now;

        public User? User { get; set; }
        public Achievement? Achievement { get; set; }
    }
}