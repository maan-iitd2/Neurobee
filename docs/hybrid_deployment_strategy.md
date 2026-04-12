# Hybrid Local-Cloud Deployment Strategy

This document outlines the deployment strategy to host the NeuroBee web application publicly while keeping the heavy Gemma AI model running exclusively on our local machine. 

This approach saves cloud compute costs while making the platform fully accessible to external users.

## Architecture Overview

**1. Frontend (The Web App)**
- **Hosting:** Vercel (Recommended over GitHub Pages because Next.js has native, zero-config support on Vercel, including Server-Side Rendering and API routes).
- **Role:** Serves the frontend UI to users instantly anywhere in the world.

**2. Backend (The AI Model)**
- **Runtime:** Local machine running Gemma 4 (via Ollama, LM Studio, etc.).
- **Exposure Tunnel:** Cloudflare Tunnels (Secure, free, background service, fixed domain).
- **Role:** Handles heavy inference tasks when the Frontend requests it.

---

## Implementation Roadmap

### Phase 1: Local Model Setup & API
1. **Run the Model:** Ensure Gemma 4 is running locally on a specific port (e.g., `11434` for Ollama or `8000` for a custom Python API).
2. **Configure CORS:** The local model's API server *must* have Cross-Origin Resource Sharing (CORS) configured to accept web requests coming from our future Vercel domain.

### Phase 2: Exposing the Local AI (Cloudflare Tunnels)
1. **Install `cloudflared`:** Install the Cloudflare Tunnel daemon on the local Windows machine.
2. **Authenticate & Create Tunnel:** 
   - Run `cloudflared tunnel login`.
   - Run `cloudflared tunnel create neurobee-model`.
3. **Configure Routing:** Create a `config.yml` that routes incoming traffic to the local port (e.g., `http://localhost:11434`).
4. **Start the Tunnel:** Run it as a background service so it stays alive whenever the PC is on. Cloudflare will give us a permanent custom URL for our local backend.

### Phase 3: Frontend Deployment (Vercel)
1. **Prepare Environment Variables:** Update the Next.js `NEXT_PUBLIC_MODEL_API_URL` to point to the new Cloudflare Tunnel URL instead of `localhost`.
2. **Push to GitHub:** Ensure all code is pushed to the main repository.
3. **Deploy to Vercel:** Import the GitHub repository into Vercel. Vercel will automatically build and deploy it.

---

## Important Constraints to Remember
* **Uptime Dependency:** The AI functionality is strictly dependent on the local PC being powered on, connected to the internet, and not asleep.
* **Concurrency Limitations:** If multiple users hit the AI simultaneously, consumer-grade hardware will process their requests sequentially. Users in the "queue" will experience degraded response speeds.
* **Bandwidth:** The speed at which tokens stream back to external users will be limited by the local home network's upload capacity.
