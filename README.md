## Development Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Running the App

#### Windows
1. Clone the repository
2. Run `npm install` to install dependencies
3. Make sure you have a `.env` file in the root with:
   ```
   NODE_ENV=development
   DATABASE_URL=sqlite:./data/dev.db
   JWT_SECRET=your-dev-secret-key
   ```
4. Run the app with: `npm run dev:windows`

#### Mac/Linux
1. Clone the repository
2. Run `npm install` to install dependencies
3. Make sure you have a `.env` file in the root
4. Run the app with: `npm run dev`

### Troubleshooting
- If you get an error about DATABASE_URL, make sure your `.env` file exists and has the correct variables
- For Windows users, use the `dev:windows` script which sets the environment variables correctly

## Features
<!-- existing content --> #   e c o m m e r c e  
 