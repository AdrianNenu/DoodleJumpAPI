namespace DoodleJumpAPI.Models
{
    public class Score
    {
        public int ScoreID { get; set; }
        public int UserID { get; set; }
        public string Username { get; set; } = string.Empty;
        public int Points { get; set; }
        public DateTime AchievedDate { get; set; } = DateTime.Now;

        public User? User { get; set; }
    }
}