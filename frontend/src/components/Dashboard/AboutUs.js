import React from "react";
import { motion } from "framer-motion";
import { useState } from "react";
import { FaInstagram, FaYoutube, FaWhatsapp, FaEnvelope, FaLinkedin, FaGithub } from "react-icons/fa";
import "./AboutUs.css";

const teamMembers = [
  { name: "Anand More", role: "FrontEnd, Backend, Database, Machine-learning Developer", desc: "Expert in AI and patient analytics. With years of experience in AI-driven patient engagement.", img: "https://via.placeholder.com/100" },
  { name: "Sayyoni Parate", role: "FrontEnd, Backend, Database, Machine-learning Developer", desc: "Specialist in mental health engagements. Her research in emotional well-being has transformed patient care.", img: "https://via.placeholder.com/100" },
  { name: "Sujal Shahare", role: "Backend and Machine-Learning Developer", desc: "Pioneer in AI-driven patient solutions. His algorithms provide personalized patient care solutions.", img: "https://via.placeholder.com/100" },
  { name: "Prathmesh Vharkal", role: "UI Developer", desc: "Connecting patients with top professionals. She specializes in medical consultancy and advisory.", img: "https://via.placeholder.com/100" },
  { name: "Shreyas Sadavarte", role: "Frontend & UI Developer ", desc: "Researcher in brain health and AI tools. His groundbreaking research in neuroscience aids patients worldwide.", img: "https://via.placeholder.com/100" }
];

export default function AboutUs() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="about-container">
      <motion.div 
        className="about-title"
        whileHover={{ scale: 1.1 }}
      >
        ABOUT US
      </motion.div>
      <div className="divider"></div>
      
      <motion.div
        className="description-box"
        whileHover={{ scale: 1.02 }}
      >
        <h2>Connecting Patients with Experts</h2>
        <p>
          Our platform enables seamless engagement between patients and top professionals, including professors, doctors, and researchers. Book appointments, schedule consultations, and access expert guidance effortlessly. 
          We ensure high-quality interactions to enhance patient outcomes. Our system integrates AI-driven recommendations to match patients with the best professionals based on their needs. 
          With a user-friendly interface, patients can navigate through expert profiles, read verified reviews, and choose the right specialist with ease. 
          Our platform also provides personalized reminders and follow-up options to ensure continuity of care. 
          By leveraging advanced data analytics, we aim to improve healthcare efficiency and accessibility for all users. 
          Security and privacy are our top priorities, ensuring that patient data remains confidential and protected. 
          Our goal is to revolutionize patient engagement by making expert consultations more accessible, efficient, and meaningful. 
          Join us in shaping the future of healthcare by connecting with top experts worldwide.
        </p>
      </motion.div>

      <div className="contributors-heading">
        <h2>Our Contributors</h2>
        <div className="heading-divider"></div>
      </div>
      
      <div className="team-section">
        {teamMembers.slice(0, 2).map((member, index) => (
          <ProfileCard key={index} member={member} hovered={hovered} setHovered={setHovered} />
        ))}
        <div className="center-card">
          <ProfileCard member={teamMembers[2]} hovered={hovered} setHovered={setHovered} />
        </div>
        {teamMembers.slice(3, 5).map((member, index) => (
          <ProfileCard key={index + 3} member={member} hovered={hovered} setHovered={setHovered} />
        ))}
      </div>

      <div className="about-footer">
        <div className="social-icons ">
          <FaEnvelope className="icon" />
          <FaInstagram className="icon" />
          <FaYoutube className="icon" />
          <FaWhatsapp className="icon" />
          <FaLinkedin className="icon" />
          <FaGithub className="icon" />
        </div>
        <p className="copyright">&copy; 2025 Patient Engagement Platform. All Rights Reserved.</p>
      </div>
    </div>
  );
}

function ProfileCard({ member, hovered, setHovered }) {
  return (
    <motion.div
      className="profile-card"
      whileHover={{ scale: 1.03 }}
      onMouseEnter={() => setHovered(member.name)}
      onMouseLeave={() => setHovered(null)}
    >
      <img src={member.img} alt={member.name} className="profile-img" />
      <h3 className="profile-name">{member.name}</h3>
      <p className="profile-role">{member.role}</p>
      {hovered === member.name && (
        <motion.p
          className="profile-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {member.desc}
        </motion.p>
      )}
    </motion.div>
  );
}