
# AidME – Smart Medical Assistant

## 📘 Overview
AidME is a **full-stack telemedicine platform** designed to bridge the gap between patients and doctors through secure real-time video consultations. 
Built using the **MERN stack (MongoDB, Express, React, Node.js)**, it integrates **WebRTC** and **Socket.io** for low-latency video communication and leverages **Generative AI (LLMs)** to automate prescription generation.

---

## 🎯 Key Features
- **Secure Video Consultations** – Real-time doctor-patient communication using WebRTC and Socket.io.
- **AI-Generated Prescriptions** – Integrated with LLMs via LangChain and Hugging Face to generate instant, accurate prescriptions.
- **Role-Based Authentication** – Secure login and registration system using JWT tokens for doctors and patients.
- **Health Analytics Dashboard** – Real-time monitoring of patient statistics and medical insights.
- **Optimized Database Performance** – MongoDB indexing and aggregation to ensure fast data retrieval and scalability.
- **Responsive UI** – Clean, modern React interface with smooth navigation and accessible design.

---

## 🧠 Tech Stack
| Layer | Technologies Used |
|--------|-------------------|
| **Frontend** | React.js, HTML5, CSS3, JavaScript (ES6+), Axios |
| **Backend** | Node.js, Express.js, RESTful APIs |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt |
| **Real-Time Communication** | WebRTC, Socket.io |
| **AI Integration** | LangChain, Hugging Face Transformers |
| **Deployment (Upcoming)** | Render / AWS EC2 |

---

## ⚙️ System Architecture
1. **Client (React App):**  
   Sends API and socket requests for video connection and user data.

2. **Server (Node + Express):**  
   Handles signaling for WebRTC connections, manages API endpoints, and authenticates requests using JWT.

3. **Database (MongoDB):**  
   Stores user profiles, call logs, and generated prescriptions securely.

4. **AI Engine:**  
   Processes doctor notes or patient symptoms using LLMs to produce prescription drafts in real-time.

---

## 🚀 Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/anandcomp22/Patient-Engagement-.git
cd Patient-Engagement-
```

### 2. Install dependencies
```bash
npm install
cd client && npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory with the following keys:
```
PORT=port_number
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
HUGGINGFACE_API_KEY=your_hf_token
```
*(Optional: Add TURN/STUN credentials for WebRTC reliability)*

### 4. Run the app
```bash
npm run dev | npm start
```
This starts both frontend and backend concurrently.

---

## 🧪 Testing & Optimization
- Implemented unit tests for key backend routes using **Jest**.  
- Used **MongoDB indexes** and **aggregation pipelines** for performance optimization.  
- Load tested the video call feature to ensure stability under multiple users.

---

## 💡 Future Enhancements
- Integration with **Electronic Health Records (EHR)** systems.  
- **Payment Gateway** for online consultations.  
- **Mobile App (React Native)** for patient convenience.  
- Deployment on **AWS or Render** with SSL and domain mapping.

---

## 🧑‍💻 Author
**Anand More**  
📍 Pune, Maharashtra, India  
📧 [moreanand111011@gmail.com](mailto:moreanand111011@gmail.com)  
🔗 [LinkedIn](https://www.linkedin.com/in/anand-more-4b2887256/) | [GitHub](https://github.com/anandcomp22) | [Portfolio](https://crafted-by-anand-dev.onrender.com/)

---

## © Copyright
© 2025 Anand More. All rights reserved.
This repository and its contents—including source code, system architecture, UI/UX design,
AI workflows, and documentation—are the original work of the author.
Unauthorized copying, modification, distribution, or use of this project, in whole or in part,
without explicit permission is prohibited.

📄 Copyright Certificate:
🔗 [View Copyright Certificate](https://drive.google.com/file/d/1Di8eHqfpf-oDosmAvz-UYSmD3gAehY22/view?usp=drive_link)
