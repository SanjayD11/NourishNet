NourishNet

NourishNet is a modern web application that helps communities reduce food waste by connecting people who have excess food with those who need it. Users can share food items, request food, and manage requests in a seamless, intuitive interface.

Project Overview

Live Demo / URL: https://nourish-net-sepia.vercel.app/  

Tech Stack: Vite, TypeScript, React, Tailwind CSS, shadcn-ui, Supabase (for backend and authentication)

NourishNet allows users to:

Share Food – Post available food items with details such as best-before date, quantity, and location.

Request Food – Browse available food posts and submit requests.

Manage Requests – Track incoming and outgoing requests, accept or decline requests, mark collected items, and provide ratings/feedback.

Notifications – Get notified about new requests or status updates in real-time.

Features

User Authentication: Secure signup and login using email/password via Supabase.

Real-Time Updates: Requests and posts update automatically without refreshing the page.

Request Status Management: Statuses include Pending, Accepted, Declined, Completed, Collected, Expired, and Cancelled.

Communication Tools: Users can call or WhatsApp each other directly from the app.

Rating & Feedback System: Requesters can rate food providers after collection to encourage trust and quality.

Responsive Design: Fully mobile-friendly and desktop-compatible using Tailwind CSS.

Getting Started (Local Development)

Follow these steps to run the project locally:

Clone the repository:

git clone <YOUR_GITHUB_REPO_URL>


Navigate to the project folder:

cd NourishNet


Install dependencies:

npm install


Start the development server:

npm run dev


Open your browser and visit the URL displayed in the terminal (usually http://localhost:5173).

Folder Structure

A quick overview of key folders:

src/
├─ components/        # Reusable UI components
├─ hooks/             # Custom React hooks (requests, auth, toast notifications)
├─ integrations/      # Supabase client setup
├─ pages/             # React pages/routes
├─ styles/            # Tailwind CSS and global styles
└─ utils/             # Helper functions

Environment Variables

Create a .env file in the root of the project with the following variables:

VITE_SUPABASE_URL=<YOUR_SUPABASE_URL>
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>


These are required to connect the frontend to your Supabase backend.

Deployment

You can deploy the project on any static hosting platform that supports Vite, such as Vercel, Netlify, or Render.

For example, to deploy on Vercel:

Push your changes to GitHub.

Log in to Vercel
 and import your GitHub repository.

Vercel will automatically detect the Vite project and deploy it.

Contributing

We welcome contributions to make NourishNet better!

Fork the repository.

Create a feature branch: git checkout -b feature/your-feature-name

Commit your changes: git commit -m "Add some feature"

Push to your branch: git push origin feature/your-feature-name

Open a Pull Request.

Contact

For questions, feedback, or collaboration:

Email : sanjayraju5164@gmail.com

GitHub : https://github.com/SanjayD11 
