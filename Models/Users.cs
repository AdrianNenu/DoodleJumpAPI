namespace DoodleJumpAPI.Models
{
    public class User
    {
        public int UserID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool IsAdmin { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}