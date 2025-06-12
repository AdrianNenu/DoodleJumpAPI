using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using DoodleJumpAPI.Data;
using DoodleJumpAPI.Models;

namespace DoodleJumpAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AchievementsController : ControllerBase
    {
        private readonly GameDbContext _context;

        public AchievementsController(GameDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<AchievementDto>>> GetUserAchievements()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            var userId = int.Parse(userIdClaim);
            var achievements = await _context.Achievements.ToListAsync();
            var userAchievements = await _context.UserAchievements
                .Where(ua => ua.UserID == userId)
                .ToListAsync();

            var result = achievements.Select(a => new AchievementDto
            {
                AchievementID = a.AchievementID,
                Name = a.Name,
                Description = a.Description,
                RequiredScore = a.RequiredScore,
                Icon = a.Icon,
                IsUnlocked = userAchievements.Any(ua => ua.AchievementID == a.AchievementID),
                UnlockedDate = userAchievements.FirstOrDefault(ua => ua.AchievementID == a.AchievementID)?.UnlockedDate
            }).OrderBy(a => a.RequiredScore).ToList();

            return Ok(result);
        }

        [HttpPost("check/{score}")]
        public async Task<ActionResult<List<UserAchievementDto>>> CheckAndUnlockAchievements(int score)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            var userId = int.Parse(userIdClaim);
            var eligibleAchievements = await _context.Achievements
                .Where(a => a.RequiredScore <= score)
                .ToListAsync();

            var unlockedAchievementIds = await _context.UserAchievements
                .Where(ua => ua.UserID == userId)
                .Select(ua => ua.AchievementID)
                .ToListAsync();

            var newAchievements = eligibleAchievements
                .Where(a => !unlockedAchievementIds.Contains(a.AchievementID))
                .ToList();

            var newUserAchievements = new List<UserAchievementDto>();
            foreach (var achievement in newAchievements)
            {
                var userAchievement = new UserAchievement
                {
                    UserID = userId,
                    AchievementID = achievement.AchievementID
                };

                _context.UserAchievements.Add(userAchievement);
                newUserAchievements.Add(new UserAchievementDto
                {
                    AchievementName = achievement.Name,
                    Description = achievement.Description,
                    Icon = achievement.Icon,
                    UnlockedDate = userAchievement.UnlockedDate
                });
            }

            await _context.SaveChangesAsync();
            return Ok(newUserAchievements);
        }
    }
}