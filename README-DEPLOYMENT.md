# ShopElite E-Commerce Deployment Guide

## Development Setup

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
SESSION_SECRET=your-secure-secret-key-for-dev
PORT=3005
```

### Admin Login Credentials

For development mode, you can log in with the following admin credentials:
- Username: `admin`
- Email: `admin@shopelite.com`
- Password: `admin123`

### Starting the Development Server

```bash
npm run dev
```

## Production Deployment

When deploying to production with thousands of users, follow these additional steps:

### Environment Configuration for Production

```
NODE_ENV=production
SESSION_SECRET=your-very-secure-random-production-key
PORT=3005
DATABASE_URL=your-database-connection-string
```

### Database Setup

For production, you should use a proper database instead of the in-memory storage:

1. Uncomment the database imports in `server/storage.ts`
2. Configure your database connection string in the `.env` file
3. Run database migrations to create the necessary tables
4. Implement a proper session store (Redis or database-backed)

### Session Management

For production with high traffic:
1. Replace the in-memory session store with a distributed solution like Redis
2. Configure proper session expiration and cleanup
3. Implement horizontal scaling with load balancing

### Security Considerations

1. Always use HTTPS in production
2. Set secure and SameSite cookie options
3. Implement rate limiting to prevent abuse
4. Set up monitoring and logging
5. Create a proper admin user management system

## Troubleshooting

### Common Issues

1. **Cannot log in as admin**: 
   - Ensure `NODE_ENV` is set to `development` or not set at all
   - Check server logs for admin user initialization
   - Verify you're using the exact credentials listed above

2. **Session termination**: 
   - In development, server restarts will clear all sessions
   - Implement persistent session storage for production

3. **Database connection errors**:
   - Ensure your database is running and accessible
   - Check database connection string format
   - Verify firewall settings allow connections

### Scaling for Thousands of Users

For a system that needs to handle thousands of users:
1. Use a scalable database (PostgreSQL, MySQL)
2. Implement connection pooling
3. Cache frequently accessed data
4. Use a distributed session store
5. Consider horizontal scaling with multiple application servers 