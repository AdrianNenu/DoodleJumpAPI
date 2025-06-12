namespace DoodleJumpAPI.Models
{
    public class Achievement
    {
        public int AchievementID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int RequiredScore { get; set; }
        public string Icon { get; set; } = "trophy";
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}