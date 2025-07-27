# Waste Management Platform

A full-stack waste management platform built with FastAPI (Python), Next.js (React), and MySQL.  
Includes authentication, order management, and a modern frontend.

## Project Structure

```
waste-management/
├── backend/
│   ├── auth/      # FastAPI Auth microservice
│   └── order/     # FastAPI Order microservice
├── frontend/      # Next.js React frontend
├── docker-compose.yml
```

## Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- (Optional) Python 3.11+ and Node.js for local development

## Quick Start (Recommended: Docker Compose)

1. **Clone the repository:**

   ```sh
   git clone https://github.com/Siddhant-vardhansingh/waste-mgmt.git
   cd waste-mgmt
   ```

2. **Run all services:**

   ```sh
   docker-compose up --build
   ```

   - MySQL runs on port `3306`
   - Auth service runs on port `8001`
   - Order service runs on port `8002`
   - Frontend runs on port `3000`

3. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Auth API: [http://localhost:8001/docs](http://localhost:8001/docs)
   - Order API: [http://localhost:8002/docs](http://localhost:8002/docs)

## Local Development (without Docker)

### Backend

1. Create a Python virtual environment and install dependencies:

   ```sh
   cd backend/auth
   python -m venv env
   source env/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8001
   ```

   Repeat for `backend/order` (change port to `8002`).

2. Make sure MySQL is running and accessible.

### Frontend

1. Install dependencies and run:
   ```sh
   cd frontend
   npm install
   npm run dev
   ```

## Environment Variables

- See `docker-compose.yml` for MySQL credentials and service ports.
- Backend services use `DATABASE_URL` for DB connection.

## API Endpoints

- **Auth Service:** `/user/login`, `/user/signup`, `/user/me`, etc.
- **Order Service:** `/order` (create order), `/items` (get scrap items)

## License

MIT

---

**To contribute:**  
Fork the repo, create a branch, and submit a pull request.
