# 🍽️ SmartMenu — AI-Powered QR Menu SaaS

Making Restaurant Menus Smarter, Simpler, and More Accessible.

SmartMenu is a web-based SaaS platform designed to help restaurants create, manage, and share digital menus through QR codes. Restaurant owners can manage their menu from a centralized dashboard, while customers can browse dishes through a mobile-friendly interface.

Built for the HackIndia AI-First Startup Hackathon 2026.

---

# 📌 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [AI Usage](#ai-usage)
- [Security](#security)
- [Getting Started](#getting-started)
- [Project Status](#project-status)
- [Future Scope](#future-scope)
- [Team](#team)
- [Project Documents](#project-documents)
  
---

# 🌟 Overview

SmartMenu helps restaurants move from traditional menus to a convenient digital menu experience.

The platform provides restaurant owners with tools to manage dishes, categories, prices, descriptions, images, and availability. Customers can access the restaurant's menu through a QR code without needing to install an application.

SmartMenu is designed as a SaaS product that can support multiple restaurants rather than serving only one restaurant.

# ❗ Problem Statement

Traditional restaurant menus can present several challenges:

- Updating printed menus can require repeated effort.
- Keeping dish information and prices up to date can be inconvenient.
- Customers need an easy way to discover and explore dishes.
- Restaurant owners need a centralized way to manage digital menu information.

# 💡 Our Solution

SmartMenu provides a centralized digital menu management platform.

Restaurant owners manage their menus through a web dashboard and provide customers with QR-code access to a mobile-friendly menu.

The platform combines menu management, customer browsing, and menu engagement insights in one solution.

## Live Application URL

https://smartmenu-webapp.ai.studio/


# ✨ Key Features

## 🏪 Restaurant Dashboard

Manage restaurant information and access menu management tools from one place.

## 📝 Digital Menu Management

Create and organize categories and dishes. Update dish names, descriptions, prices, images, and availability.

## 📱 QR-Code Menu Access

Generate a QR code that customers can scan to access the restaurant's digital menu.

## 🔎 Customer Menu Experience

Browse menu categories, explore dishes, search for items, and use available dietary filters.

## 🥗 Dish Information

Display dish images, prices, descriptions, and supported dietary information.

## 📊 Menu Engagement Analytics

Record supported menu interactions and display engagement information to help restaurant owners understand how customers explore the menu.

## 💡 AI Menu Insights

The current insights engine uses rule-based analysis of available menu engagement data. It does not require a live generative AI model to produce these insights.

## ☁️ Cloud-Backed Data

Supabase provides authentication, database functionality, and storage for supported application features.

---

# 🔄 How It Works

1. Restaurant Setup: The restaurant owner signs in and manages the restaurant's information.
2. Menu Management: The owner adds and organizes menu categories and dishes.
3. QR Code Generation: SmartMenu provides a QR code for the restaurant's digital menu.
4. Customer Access: Customers scan the QR code and open the menu on their devices.
5. Menu Exploration: Customers browse dishes, search for items, and use available filters.
6. Engagement Insights: Supported menu interactions can be used to display menu engagement information.

---

# 🛠️ Technology Stack

- Frontend: Web application interface
- Backend Services: Supabase
- Authentication: Supabase Auth
- Database: Supabase database
- Image Storage: Supabase Storage
- Security: Row Level Security (RLS) and database access policies
- Development Assistance: AI-assisted coding and productivity tools

Refer to the project source files and configuration for the exact libraries and versions used.

---

# 🤖 AI Usage

AI-assisted development tools were used to support parts of the development process, including code generation, implementation guidance, debugging, and refinement.

The team reviewed and tested the generated code while integrating it into the application.

Important distinction: SmartMenu's current menu insights feature uses rule-based analysis. AI assistance during development does not mean that the deployed application uses a live generative AI model for every feature.

A separate AI usage report documents the development workflow and the role of AI tools.

---

# 🔐 Security

SmartMenu uses Supabase authentication and database access policies to help protect application data.

Security considerations include:

- Authentication for supported owner functionality.
- Row Level Security policies for database access.
- Access restrictions for restaurant management operations.
- Controlled access to stored dish images.

Configuration warning: Never commit passwords, Supabase service-role keys, private API keys, access tokens, or other secrets to the repository.

Use environment variables for configuration and follow the instructions in the project's environment example file, if provided.

---

# 📄 Project Documents

The following documents are available in the [docs/](docs/) folder:

- [AI Usage Report](docs/AI-Usage-Report.pdf) — Documents the AI tools used during development, their applications, and our development workflow.
- [SmartMenu Pitch Deck](docs/SmartMenu-Pitch-Deck.pdf) — Presents the problem, solution, key features, technology, business model, and future scope of SmartMenu.

---

# 🚀 Getting Started

Prerequisites

Before running the application locally, make sure you have:

- Node.js and npm installed, if required by the project.
- The complete SmartMenu source code.
- Access to the configured Supabase project.
- The required environment variables.

Installation

1. Clone this repository:
   
   `git clone YOUR_REPOSITORY_URL`

2. Enter the project directory:
   
   `cd YOUR_PROJECT_FOLDER`

3. Install dependencies:
   
   `npm install`

4. Configure the required environment variables using the project's environment example file, if available.

5. Start the development server:
   
   `npm run dev`

6. Open the local address shown in your terminal.

Note: These are standard steps for a Node.js/npm-based application. Confirm the actual scripts and configuration in [package.json] before running the project. The application may require additional setup depending on its final source code.

---

# 📍 Project Status

SmartMenu has a working web application with restaurant menu management, QR-code access, customer-facing menu browsing, and supported menu engagement insights.

The project is being developed as a SaaS solution for restaurants.

Features described under Future Scope are proposed improvements and should not be considered implemented functionality.

---

# 🔮 Future Scope

Potential future improvements include:

- Enhanced AI-assisted menu creation.
- More advanced menu analytics.
- Additional menu customization options.
- Optional table-specific QR codes.
- Online ordering and payment integrations.
- Additional restaurant management capabilities.

These are future possibilities and are not claims of existing functionality.

---

# 👥 Team

Project: SmartMenu
Event: HackIndia AI-First Startup Hackathon 2026
Project Category: AI-First Startup / SaaS

Built collaboratively by the team **404 Founders**.

---

# 📄 License

See the [LICENSE](LICENSE) file for the project's licensing terms.
