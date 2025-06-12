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
    public class GameController : ControllerBase
    {
        private readonly GameDbContext _context;

        public GameController(GameDbContext context)
        {
            _context = context;
        }

        [HttpPost("score")]
        public async Task<ActionResult> SubmitScore(ScoreSubmission submission)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(username))
                return Unauthorized();

            var score = new Score
            {
                UserID = int.Parse(userIdClaim),
                Username = username,
                Points = submission.Points
            };

            _context.Scores.Add(score);
            await _context.SaveChangesAsync();
            return Ok("Score submitted successfully");
        }

        [HttpGet("leaderboard")]
        [AllowAnonymous]
        public async Task<ActionResult<List<LeaderboardEntry>>> GetLeaderboard()
        {
            var topScores = await _context.Scores
                .OrderByDescending(s => s.Points)
                .Take(10)
                .Select(s => new LeaderboardEntry
                {
                    ScoreId = s.ScoreID,
                    Username = s.Username,
                    Points = s.Points,
                    AchievedDate = s.AchievedDate
                })
                .ToListAsync();

            return Ok(topScores);
        }
        [HttpDelete("score/{scoreId}")]
        public async Task<ActionResult> DeleteScore(int scoreId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized();
            }

            var userId = int.Parse(userIdClaim);
            var score = await _context.Scores.FirstOrDefaultAsync(s => s.ScoreID == scoreId);

            if (score == null)
            {
                return NotFound("Score not found");
            }

            // Users can only delete their own scores
            if (score.UserID != userId)
            {
                return Forbid("You can only delete your own scores");
            }

            _context.Scores.Remove(score);
            await _context.SaveChangesAsync();

            return Ok("Score deleted successfully");
        }
    }
}