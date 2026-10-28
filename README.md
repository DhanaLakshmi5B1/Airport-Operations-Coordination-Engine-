# Infosys Internship 7.0 — Milestone 1

## Airport Operations Coordination Engine

**Intern Name:** KANDEPU DHANA LAKSHMI

**Internship:** Infosys Internship 7.0  

**Project:** Airport Operations Coordination Engine  

**Domain:** Airport Operations Coordination and AI-Assisted Automation  

**GitHub Repository:** [Airport Operations Coordination Engine](https://github.com/DhanaLakshmi5B1/Airport-Operations-Coordination-Engine-)

## Objective

The objective of this project is to develop a web-based Airport Operations Coordination Engine to support airport operations through a frontend interface, backend services, workflow coordination, and rule-based decision support.

## Description

The project combines a React-based frontend with a Python backend to organize airport operational information and coordination workflows. It includes modules related to flights, weather information, AI-assisted planning, permissions, audit logging, and operational rules.

## Features and Modules

- **Operations Dashboard:** Interface for viewing airport operational information.
- **Flight Management:** Frontend module for flight-related information.
- **Weather Information:** Weather-related operational interface and rules.
- **AI-Assisted Planning:** Backend planning-agent and workflow modules.
- **Rule Engine:** Operational rules, including weather and gate-management logic.
- **Authentication and Permissions:** Backend modules for access control.
- **Audit Logging:** Modules for recording and checking audit events.

## Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Python
- **Frontend Build Tool:** Vite
- **Dependency Management:** npm and Python pip

## Project Structure

```text
Airport-Operations-Coordination-Engine/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── rule_engine/
│   │   └── schemas/
│   ├── screenshots/
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── README.md
├── .gitignore
└── README.md
```

## How to Run the Frontend

**Requirements:** Node.js and npm.

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed in the terminal.

To create a production build:

```bash
npm run build
```

## Backend Setup

**Requirements:** Python and the services required by the backend configuration.

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Refer to `backend/README.md` for the backend configuration and startup instructions. Database settings and external API credentials may need to be configured locally.

## Screenshots and Testing

Backend screenshots are available in the `backend/screenshots/` directory. Backend test files are included in the `backend/` directory.

## Milestone 1 Summary

Milestone 1 includes the project structure with separate frontend and backend folders, a React frontend that successfully builds for production, and backend modules for airport workflows and operational rules.

## Author

**Kandepu Dhana Lakshmi**

GitHub: [DhanaLakshmi5B1](https://github.com/DhanaLakshmi5B1)

## Internship

Infosys Internship 7.0
