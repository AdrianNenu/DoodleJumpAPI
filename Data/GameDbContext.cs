using Microsoft.EntityFrameworkCore;
using DoodleJumpAPI.Models;

namespace DoodleJumpAPI.Data
{
    public class GameDbContext : DbContext
    {
        public GameDbContext(DbContextOptions<GameDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Score> Scores { get; set; }
        public DbSet<Achievement> Achievements { get; set; }
        public DbSet<UserAchievement> UserAchievements { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserID);
                entity.Property(e => e.Username).HasMaxLength(50).IsRequired();
                entity.HasIndex(e => e.Username).IsUnique();
                entity.Property(e => e.Password).HasMaxLength(255).IsRequired();
            });

            modelBuilder.Entity<Score>(entity =>
            {
                entity.HasKey(e => e.ScoreID);
                entity.Property(e => e.Username).HasMaxLength(50);
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserID);
                entity.HasIndex(e => e.Points).IsDescending();
            });

            modelBuilder.Entity<Achievement>(entity =>
            {
                entity.HasKey(e => e.AchievementID);
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
                entity.Property(e => e.Icon).HasMaxLength(50).IsRequired();
            });

            modelBuilder.Entity<UserAchievement>(entity =>
            {
                entity.HasKey(e => e.UserAchievementID);
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserID);
                entity.HasOne(e => e.Achievement)
                      .WithMany()
                      .HasForeignKey(e => e.AchievementID);
                entity.HasIndex(e => new { e.UserID, e.AchievementID }).IsUnique();
            });
        }
    }
}