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
    public class AdminController : ControllerBase
    {
        private readonly GameDbContext _context;

        public AdminController(GameDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            return User.FindFirst("IsAdmin")?.Value == "True";
        }

        // CREATE Achievement (Admin only)
        [HttpPost("achievements")]
        public async Task<ActionResult> CreateAchievement(CreateAchievementRequest request)
        {
            if (!IsAdmin())
                return Forbid("Admin access required");

            var achievement = new Achievement
            {
                Name = request.Name,
                Description = request.Description,
                RequiredScore = request.RequiredScore,
                Icon = request.Icon
            };

            _context.Achievements.Add(achievement);
            await _context.SaveChangesAsync();
            return Ok("Achievement created successfully");
        }

        // UPDATE Achievement (Admin only)
        [HttpPut("achievements/{achievementId}")]
        public async Task<ActionResult> UpdateAchievement(int achievementId, UpdateAchievementRequest request)
        {
            if (!IsAdmin())
                return Forbid("Admin access required");

            var achievement = await _context.Achievements.FindAsync(achievementId);
            if (achievement == null)
                return NotFound("Achievement not found");

            if (!string.IsNullOrEmpty(request.Name))
                achievement.Name = request.Name;
            if (!string.IsNullOrEmpty(request.Description))
                achievement.Description = request.Description;
            if (request.RequiredScore.HasValue)
                achievement.RequiredScore = request.RequiredScore.Value;
            if (!string.IsNullOrEmpty(request.Icon))
                achievement.Icon = request.Icon;

            await _context.SaveChangesAsync();
            return Ok("Achievement updated successfully");
        }

        // DELETE Achievement (Admin only)
        [HttpDelete("achievements/{achievementId}")]
        public async Task<ActionResult> DeleteAchievement(int achievementId)
        {
            if (!IsAdmin())
                return Forbid("Admin access required");

            var achievement = await _context.Achievements.FindAsync(achievementId);
            if (achievement == null)
                return NotFound("Achievement not found");

            // Remove all user achievements for this achievement first
            var userAchievements = await _context.UserAchievements
                .Where(ua => ua.AchievementID == achievementId)
                .ToListAsync();
            _context.UserAchievements.RemoveRange(userAchievements);

            _context.Achievements.Remove(achievement);
            await _context.SaveChangesAsync();
            return Ok("Achievement deleted successfully");
        }

        // READ All Users (Admin only)
        [HttpGet("users")]
        public async Task<ActionResult<List<AdminUserResponse>>> GetAllUsers()
        {
            if (!IsAdmin())
                return Forbid("Admin access required");

            try
            {
                var users = await _context.Users
                    .Select(u => new AdminUserResponse
                    {
                        UserID = u.UserID,
                        Username = u.Username,
                        IsAdmin = u.IsAdmin,
                        CreatedDate = u.CreatedDate,
                        TotalScores = _context.Scores.Count(s => s.UserID == u.UserID),
                        BestScore = _context.Scores.Where(s => s.UserID == u.UserID).Max(s => (int?)s.Points) ?? 0
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error retrieving users: " + ex.Message);
            }
        }

        // UPDATE User (Admin only)
        [HttpPut("users/{userId}")]
        public async Task<ActionResult> UpdateUser(int userId, AdminUpdateUserRequest request)
        {
            if (!IsAdmin())
                return Forbid("Admin access required");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            if (request.IsAdmin.HasValue)
                user.IsAdmin = request.IsAdmin.Value;

            if (!string.IsNullOrEmpty(request.Username))
            {
                if (await _context.Users.AnyAsync(u => u.Username == request.Username && u.UserID != userId))
                    return BadRequest("Username already exists");
                user.Username = request.Username;
            }

            await _context.SaveChangesAsync();
            return Ok("User updated successfully");
        }

        // DELETE User (Admin only)
        [HttpDelete("users/{userId}")]
        public async Task<ActionResult> DeleteUser(int userId)
        {
            if (!IsAdmin())
                return Forbid("Admin access required");

            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserIdClaim == userId.ToString())
                return BadRequest("Cannot delete your own account");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            // Remove all related data
            var userScores = await _context.Scores.Where(s => s.UserID == userId).ToListAsync();
            var userAchievements = await _context.UserAchievements.Where(ua => ua.UserID == userId).ToListAsync();

            _context.Scores.RemoveRange(userScores);
            _context.UserAchievements.RemoveRange(userAchievements);
            _context.Users.Remove(user);

            await _context.SaveChangesAsync();
            return Ok("User and all related data deleted successfully");
        }

        // DELETE Score (Admin can delete any score)
        [HttpDelete("scores/{scoreId}")]
        public async Task<ActionResult> DeleteAnyScore(int scoreId)
        {
            if (!IsAdmin())
                return Forbid("Admin access required");

            var score = await _context.Scores.FindAsync(scoreId);
            if (score == null)
                return NotFound("Score not found");

            _context.Scores.Remove(score);
            await _context.SaveChangesAsync();
            return Ok("Score deleted successfully");
        }
    }
}