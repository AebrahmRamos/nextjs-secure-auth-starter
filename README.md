<div align="center">
  <!-- TODO: Add GitHub badges once repository is public -->
  <!-- [![Contributors][contributors-shield]][contributors-url] -->
  <!-- [![Forks][forks-shield]][forks-url] -->
  <!-- [![Stargazers][stars-shield]][stars-url] -->
  <!-- [![Issues][issues-shield]][issues-url] -->
  [![MIT License][license-shield]][license-url]
  [![LinkedIn][linkedin-shield]][linkedin-url]

  <br />
  <a href="https://github.com/aebrahmramos/nextjs-secure-auth-starter">
    <img src="https://via.placeholder.com/200x200.png?text=Logo" alt="Logo" width="200" height="200">
    <!-- TODO: Replace with actual logo from /public/logo.png -->
  </a>

  <h3 align="center">Next.js Secure Auth Starter</h3>

  <p align="center">
    A security-first Next.js 15 starter template with enterprise-grade authentication
    <br />
    <a href="https://github.com/aebrahmramos/nextjs-secure-auth-starter"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#">View Demo</a>
    ·
    <a href="https://github.com/aebrahmramos/nextjs-secure-auth-starter/issues/new?labels=bug">Report Bug</a>
    ·
    <a href="https://github.com/aebrahmramos/nextjs-secure-auth-starter/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

<!-- TODO: Add screenshot or demo GIF -->
[![Product Name Screen Shot][product-screenshot]](https://example.com)

A comprehensive, **security-first** Next.js 15 starter template designed for building secure web applications from the ground up. Born from a Secure Web Development course case study, this template implements production-ready authentication patterns and security best practices.

### Why This Template?

* **Security by Default**: Built with security as the primary concern, not an afterthought
* **Production-Ready**: Enterprise-grade features including RBAC, password policies, and account protection
* **Modern Stack**: Leverages the latest Next.js 15 App Router with React 19 and TypeScript support
* **Well-Documented**: Comprehensive guides for testing security features like [account lockout](docs/test-lockout.md)
* **Educational**: Perfect for learning secure web development patterns and best practices

This template is ideal for MVPs, case studies, or any production application requiring robust authentication and authorization mechanisms.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

This project leverages modern web technologies and security-focused libraries:

#### Frontend
* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![TailwindCSS][Tailwind]][Tailwind-url]

#### Authentication & Security
* [![NextAuth.js][NextAuth]][NextAuth-url]
* **bcrypt** - Password hashing
* **jsonwebtoken** - JWT token management

#### Database
* [![MongoDB][MongoDB]][MongoDB-url]
* **Mongoose** - ODM for MongoDB

#### UI Components
* **Radix UI** - Headless accessible components
* **Lucide React** - Beautiful icon library
* **shadcn/ui** - Re-usable component patterns

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js** (v18 or higher)
  ```sh
  node --version  # Should be 18.x or higher
  ```
* **npm** (latest version)
  ```sh
  npm install npm@latest -g
  ```
* **MongoDB Atlas Account** (or local MongoDB instance)
  * Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/aebrahmramos/nextjs-secure-auth-starter.git
   cd nextjs-secure-auth-starter
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```sh
   cp .env.example .env.local
   ```

   Open `.env.local` and configure the following:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string

   # Authentication Secrets (generate with: openssl rand -base64 32)
   NEXTAUTH_SECRET=your_nextauth_secret
   JWT_SECRET=your_jwt_secret
   REFRESH_SECRET=your_refresh_secret
   NEXTAUTH_URL=http://localhost:3000

   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

4. **Generate secure secrets**
   ```sh
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32

   # Generate JWT_SECRET
   openssl rand -base64 32

   # Generate REFRESH_SECRET
   openssl rand -base64 32
   ```

5. **Run the development server**
   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Change git remote** (if forking/templating)
   ```sh
   git remote set-url origin https://github.com/your_username/your_repo_name.git
   git remote -v  # Confirm the changes
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

### Key Features

#### 🔐 Authentication
- **Credentials-based login** with username/password
- **OAuth integration** with Google and GitHub
- **JWT-based sessions** with refresh token rotation
- **Account lockout** after 5 failed login attempts (30-minute timeout)

#### 🛡️ Security Features
- **Password hashing** with bcrypt (10 salt rounds)
- **Password complexity enforcement**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- **Password history tracking** (prevents reuse of last 5 passwords)
- **Security questions** for account recovery
- **Session security** with HTTP-only cookies
- **RBAC (Role-Based Access Control)** with predefined roles

## Documentation

- **[RBAC System Guide](docs/rbac-guide.md)**: Learn how to use and extend the permission system
- **[Testing Guide](docs/testing-guide.md)**: Write unit, integration, and e2e tests
- **[Account Lockout Testing](docs/test-lockout.md)**: Test security features

## Permission System

This template includes a complete RBAC system with 45 pre-configured permissions:

**✅ Already Configured:**
- User management (view, create, edit, delete, change roles)
- Forum management (create, edit, delete, lock)
- Thread management (create, edit, delete, lock)
- Reply management (create, edit, delete)
- Moderation tools
- System administration

**You only need to add permissions if you're adding NEW features** (e.g., badges, reports, etc.). See [RBAC Guide](docs/rbac-guide.md#extending-the-system) for details.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm test`: Runs unit and integration tests.
- `npm run test:watch`: Runs tests in watch mode.
- `npm run test:e2e`: Runs end-to-end tests with Playwright.
- `npm run db:seed`: Seeds the database with an initial admin user.

## Quick Start

1. **Install dependencies**: `npm install`
2. **Configure environment**: Copy `.env.example` to `.env.local` and fill in values
3. **Seed database**: `npm run db:seed` (creates admin user)
4. **Run tests**: `npm test` (verify setup)
5. **Start development**: `npm run dev`

### Example: Creating a Protected Route

```javascript
// app/admin/page.js
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### Example: Role-Based Access

```javascript
// middleware.js - Already configured in this template
// Protects /admin (admin-only) and /moderator (moderator+admin)

export const config = {
  matcher: [
    '/admin/:path*',     // Admin only
    '/moderator/:path*', // Moderator and admin
    '/api/:path*',       // Protected API routes
  ],
};
```

_For more examples and detailed guides, please refer to the [Documentation](https://github.com/aebrahmramos/nextjs-secure-auth-starter)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

### Security Enhancements
- [ ] Two-Factor Authentication (2FA/MFA)
- [ ] Email verification for new accounts
- [ ] Password reset via email
- [ ] Rate limiting for API endpoints
- [ ] Enhanced CSRF protection
- [ ] IP-based geolocation tracking
- [ ] Audit logging dashboard

### Features & Functionality
- [ ] Admin dashboard for user management
- [ ] User profile settings page
- [ ] Activity logs viewer
- [ ] Session management dashboard
- [ ] Additional OAuth providers (Discord, Microsoft)
- [ ] API documentation (Swagger/OpenAPI)

### Developer Experience
- [ ] Docker & Docker Compose support
- [ ] Automated testing suite (Unit, Integration, E2E)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Pre-commit hooks with Husky
- [ ] Database migration tools
- [ ] Storybook for component development

See the [open issues](https://github.com/aebrahmramos/nextjs-secure-auth-starter/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Top Contributors

<a href="https://github.com/aebrahmramos/nextjs-secure-auth-starter/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=aebrahmramos/nextjs-secure-auth-starter" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

**Aebrahm Ramos**
- Email: [aebrahmramos.dev@gmail.com](mailto:aebrahmramos.dev@gmail.com)
- LinkedIn: [@aebrahmramos](https://www.linkedin.com/in/aebrahmramos/)
- Instagram: [@AebrahmRamos](https://instagram.com/AebrahmRamos)

**Project Link**: [https://github.com/aebrahmramos/nextjs-secure-auth-starter](https://github.com/aebrahmramos/nextjs-secure-auth-starter)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

This project was developed as part of a Secure Web Development course. Special thanks to my groupmates who contributed to the original case study:

* **[@anaj00](https://github.com/anaj00)** - Jana Marie Bantolino
* **[@ComfyJace](https://github.com/ComfyJace)** - Jason Erwin Clyde Dimalanta

### Helpful Resources
* [Choose an Open Source License](https://choosealicense.com)
* [Next.js Documentation](https://nextjs.org/docs)
* [NextAuth.js Documentation](https://next-auth.js.org/)
* [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
* [OWASP Top 10](https://owasp.org/www-project-top-ten/)
* [Img Shields](https://shields.io)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/aebrahmramos/nextjs-secure-auth-starter.svg?style=for-the-badge
[contributors-url]: https://github.com/aebrahmramos/nextjs-secure-auth-starter/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/aebrahmramos/nextjs-secure-auth-starter.svg?style=for-the-badge
[forks-url]: https://github.com/aebrahmramos/nextjs-secure-auth-starter/network/members
[stars-shield]: https://img.shields.io/github/stars/aebrahmramos/nextjs-secure-auth-starter.svg?style=for-the-badge
[stars-url]: https://github.com/aebrahmramos/nextjs-secure-auth-starter/stargazers
[issues-shield]: https://img.shields.io/github/issues/aebrahmramos/nextjs-secure-auth-starter.svg?style=for-the-badge
[issues-url]: https://github.com/aebrahmramos/nextjs-secure-auth-starter/issues
[license-shield]: https://img.shields.io/github/license/aebrahmramos/nextjs-secure-auth-starter.svg?style=for-the-badge
[license-url]: https://github.com/aebrahmramos/nextjs-secure-auth-starter/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/aebrahmramos/
[product-screenshot]: https://via.placeholder.com/800x400.png?text=Next.js+Secure+Auth+Starter+Screenshot
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Tailwind]: https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[MongoDB]: https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white
[MongoDB-url]: https://www.mongodb.com/
[NextAuth]: https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[NextAuth-url]: https://next-auth.js.org/
