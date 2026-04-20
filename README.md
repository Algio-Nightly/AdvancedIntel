# 🧠 Advanced Intel: Synapse Research Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployed on Firebase](https://img.shields.io/badge/Deployed%20on-Firebase-orange.svg)](https://advanced-intel-d9709.web.app/)

> **Project Live Preview:** [VIEW DEPLOYED APP](https://advanced-intel-d9709.web.app/)

---

##  Overview

**Advanced Intel** is a high-fidelity, cognitive research platform designed to bridge the gap between academic data ingestion and creative synthesis. Built with a "Nodes-as-Containers" philosophy, the platform allows researchers to build expansive cognitive maps, mirror research notes across different contexts, and leverage integrated AI to distill complex findings into actionable intelligence.

This repository contains the complete frontend architecture, state management logic, and specialized widget engine that powers the Synapse experience.

---

## Key Features

###  Cognitive Research Canvas
- **ReactFlow Integration:** A non-linear graph interface for organizing research containers (Nodes).
- **Infinite Workspace:** Scale your research from a single concept to a multi-threaded library.
- **Dynamic Contextualization:** Drag and drop dependencies to link documents to specific research nodes.

###  Selective Dependency Mirroring
- **Dependency Mirror Widget:** A specialized tool that allows real-time, read-only syncing of notes from parent nodes or library documents.
- **Selective Sourcing:** Choose a source (PDF or Node) and select specific markdown slabs to mirror into your current workspace.
- **Real-time Synchronization:** Updates to source documents propagate instantly to all mirrored instances.

###  Integrated AI Assistant (Gemini 1.5/3.1)
- **Context-Aware Analysis:** The AI assistant reads your selected dependencies and research notes to provide grounded insights.
- **Direct Deployment:** Convert AI generations into new research widgets with a single click (**SAVE AS NEW NOTE**).
- **Streaming Response:** High-performance streaming UI for real-time cognitive assistance.

###  Research Library & PDF Engine
- **Local Archive:** High-speed PDF ingestion with local caching via IndexedDB.
- **Slab-based Note Taking:** Break down document analysis into modular markdown "slabs" for easier reference.
- **Full-Spectrum Search:** Filter your entire cognitive database in real-time.

---

## Technical Stack

- **Framework:** React 18 + Vite
- **Styling:** Vanilla CSS (Modular) + TailwindCSS (for utility layouts)
- **Graph Engine:** ReactFlow
- **AI Integration:** Google Gemini API
- **Persistence:** 
  - **Firestore:** Real-time metadata and graph state.
  - **IndexedDB:** Local storage for large PDF binary blobs.
- **Icons:** Lucide React
- **Animations:** Framer Motion / Custom CSS Transitions

---

## Architecture Overview

### 1. State Management (Context API)
The application utilizes a decentralized context architecture to manage complex research state:
- **`NodeContext.jsx`:** Manages the graph state, container metadata, and widget configurations.
- **`AIContext.jsx`:** Handles the orchestration of AI requests, streaming state, and model selection.
- **`LibraryContext.jsx`:** Controls document ingestion, PDF metadata, and note slab persistence.

### 2. The Widget Engine (`WidgetEngine.jsx`)
A modular deployment system that handles the lifecycle of different research tools:
- **Markdown Notes:** Standard documentation tools.
- **PDF Viewer:** In-canvas document reading.
- **Dependency Mirror:** Selective real-time referencing.
- **Utility Suite:** Counters, Timers, Task Lists, and YouTube references.

### 3. Persistence Layer (`storage.js`)
To ensure high performance with large documents, the platform uses a hybrid storage strategy:
- Metadata is synced to Firebase for cross-device access.
- Binary PDF data is cached locally in IndexedDB to avoid repeated network overhead and bandwidth costs.

---

## Component & Function Reference

### `ProjectWorkspace.jsx`
The primary layout controller for the graph view.
- `onConnect`: Handles edge creation between research containers.
- `handleDeleteNode`: Safely purges a container and its associated widgets.
- `handleNodeControl`: Manages the sidebar telemetry and control panels.

### `WidgetEngine.jsx`
The core rendering logic for the widget system.
- `DependencyNotesWidget`: Logic for source selection and mirroring.
- `handleDeployWidget`: Factory function for initializing new tools.
- `WidgetEnlargedModal`: Immersive full-screen mode with AI panel integration.

### `ai.js` (Services)
- `generateStream`: Orchestrates the Gemini streaming API calls.
- `fetchContextualData`: Gathers selected dependencies into a prompt-ready format.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase Account
- Google AI (Gemini) API Key

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/advanced-intel.git
    cd advanced-intel
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    VITE_FIREBASE_API_KEY=your_firebase_key
    ...
    ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```

### Deployment

1.  **Build the Project:**
    ```bash
    npm run build
    ```

2.  **Deploy to Firebase:**
    ```bash
    firebase deploy --only hosting
    ```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

*Built for the future of collective intelligence.*
