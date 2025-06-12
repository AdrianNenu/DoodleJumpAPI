using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DoodleJumpAPI.Data;
using DoodleJumpAPI.Models;

namespace DoodleJumpAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly GameDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(GameDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<ActionResult<string>> Register(RegisterRequest request)
        {
            try
            {
                if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                    return BadRequest("Username already exists");

                var user = new User
                {
                    Username = request.Username,
                    Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    IsAdmin = request.IsAdmin
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                return Ok("User registered successfully");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Registration failed: " + ex.Message);
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

                if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                    return BadRequest("Invalid credentials");

                var token = GenerateJwtToken(user);
                return Ok(new LoginResponse { Token = token, Username = user.Username, IsAdmin = user.IsAdmin });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Login failed: " + ex.Message);
            }
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<UserProfileResponse>> GetProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized("User ID not found in token");

                if (!int.TryParse(userIdClaim, out int userId))
                    return BadRequest("Invalid user ID format");

                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return NotFound("User not found");

                // Get user statistics
                var totalScores = await _context.Scores.CountAsync(s => s.UserID == userId);
                var bestScore = await _context.Scores
                    .Where(s => s.UserID == userId)
                    .MaxAsync(s => (int?)s.Points) ?? 0;
                var unlockedAchievements = await _context.UserAchievements.CountAsync(ua => ua.UserID == userId);

                return Ok(new UserProfileResponse
                {
                    Username = user.Username,
                    IsAdmin = user.IsAdmin,
                    CreatedDate = user.CreatedDate,
                    TotalScores = totalScores,
                    BestScore = bestScore,
                    UnlockedAchievements = unlockedAchievements
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Failed to load profile: " + ex.Message);
            }
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult> UpdateProfile(UpdateProfileRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized("User ID not found in token");

                if (!int.TryParse(userIdClaim, out int userId))
                    return BadRequest("Invalid user ID format");

                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return NotFound("User not found");

                // Check if new username is already taken by another user
                if (!string.IsNullOrEmpty(request.Username) && request.Username != user.Username)
                {
                    if (await _context.Users.AnyAsync(u => u.Username == request.Username && u.UserID != userId))
                        return BadRequest("Username already exists");

                    user.Username = request.Username;
                }

                // Update password if provided
                if (!string.IsNullOrEmpty(request.NewPassword))
                {
                    if (string.IsNullOrEmpty(request.CurrentPassword) ||
                        !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
                        return BadRequest("Current password is incorrect");

                    user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                }

                await _context.SaveChangesAsync();
                return Ok("Profile updated successfully");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Failed to update profile: " + ex.Message);
            }
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? ""));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("IsAdmin", user.IsAdmin.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}