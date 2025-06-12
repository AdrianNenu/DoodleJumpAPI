using DoodleJumpAPI.Data;
using DoodleJumpAPI.Models;

namespace DoodleJumpAPI.Data
{
    public static class DbInitializer
    {
        public static void Initialize(GameDbContext context)
        {
            if (!context.Users.Any())
            {
                var users = new User[]
                {
                    new User { Username = "admin", Password = BCrypt.Net.BCrypt.HashPassword("admin123"), IsAdmin = true },
                    new User { Username = "student", Password = BCrypt.Net.BCrypt.HashPassword("student123"), IsAdmin = false }
                };
                context.Users.AddRange(users);
                context.SaveChanges();
            }

            if (!context.Achievements.Any())
            {
                var achievements = new Achievement[]
                {
                    new Achievement { Name = "First Jump", Description = "Complete your first jump in the game", RequiredScore = 100, Icon = "first-jump" },
                    new Achievement { Name = "High Flyer", Description = "Reach a score of 500 points", RequiredScore = 500, Icon = "high-flyer" },
                    new Achievement { Name = "Sky Master", Description = "Achieve 1000 points or more", RequiredScore = 1000, Icon = "sky-master" },
                    new Achievement { Name = "Cloud Walker", Description = "Score 2500 points to walk among clouds", RequiredScore = 2500, Icon = "cloud-walker" },
                    new Achievement { Name = "Space Explorer", Description = "Reach the incredible height of 5000 points", RequiredScore = 5000, Icon = "space-explorer" },
                    new Achievement { Name = "Legend", Description = "Become a legend with 10000 points", RequiredScore = 10000, Icon = "legend" }
                };
                context.Achievements.AddRange(achievements);
                context.SaveChanges();
            }
        }
    }
}