# Doodle Jump Game

A web-based Doodle Jump clone built with ASP.NET Core and HTML5 Canvas. Features user authentication, achievements, and global leaderboards.

## Features

- HTML5 Canvas game with physics simulation
- User registration and authentication 
- Achievement system with automatic unlocking
- Global leaderboard (top 10 scores)
- Admin panel for user/score management
- Responsive design for all devices

## Tech Stack

**Backend**
- ASP.NET Core 6.0 Web API
- Entity Framework Core
- SQL Server
- JWT authentication

**Frontend** 
- HTML5 Canvas
- Vanilla JavaScript (ES6+)
- CSS3 with responsive design

## Setup

1. Clone the repo and restore packages
2. Update the connection string in `appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=DoodleJumpGame;Integrated Security=True"
   }
   ```
3. Run migrations: `dotnet ef database update`
4. Start the backend: `dotnet run`
5. Start the frontend: open a new Developer PowerShell terminal (for VisualStudio)
                       run `cd frontend`
                       and `python -m http:server 8000`

## Game Controls

- **Arrow Keys** or **WASD** to move left/right
- Player automatically jumps when landing on platforms
- Score increases based on height reached

## API Endpoints

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile

POST /api/game/score
GET  /api/game/leaderboard

GET  /api/achievements
POST /api/achievements/check/{score}
```

## Database Schema

- **Users**: Basic user info with admin flag
- **Scores**: Game scores linked to users
- **Achievements**: Unlockable milestones
- **UserAchievements**: Junction table for unlocked achievements

## Achievements  (some of them :D )
| Name | Description | Score Required |
|------|-------------|----------------|
| First Jump | Complete your first jump | 100 |
| Thousand Club | Join the elite | 1000 |
| Sky Walker | Reach new heights | 2500 |
| Cloud Surfer | Among the clouds | 5000 |

## Security

- Passwords hashed with BCrypt
- JWT tokens for authentication
- Role-based authorization for admin features
- Input validation on all endpoints
