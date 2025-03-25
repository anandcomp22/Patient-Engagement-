import React from "react";
import { motion } from "framer-motion";
import { useState } from "react";
import { FaInstagram, FaYoutube, FaWhatsapp, FaEnvelope, FaLinkedin, FaGithub } from "react-icons/fa";

const teamMembers = [
  { name: "Dr. John Doe", role: "Professor", desc: "Expert in AI and patient analytics. With years of experience in AI-driven patient engagement, he has helped thousands in need.", img: "https://via.placeholder.com/100" },
  { name: "Dr. Jane Smith", role: "Psychologist", desc: "Specialist in mental health engagements. Her research in emotional well-being has transformed patient care.", img: "https://via.placeholder.com/100" },
  { name: "Prof. Alan Turing", role: "Data Scientist", desc: "Pioneer in AI-driven patient solutions. His algorithms provide personalized patient care solutions.", img: "https://via.placeholder.com/100" },
  { name: "Dr. Lisa Ray", role: "Medical Consultant", desc: "Connecting patients with top professionals. She specializes in medical consultancy and advisory.", img: "https://via.placeholder.com/100" },
  { name: "Dr. Mark Lee", role: "Neurologist", desc: "Researcher in brain health and AI tools. His groundbreaking research in neuroscience aids patients worldwide.", img: "https://via.placeholder.com/100" }
];

export default function AboutUs() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="relative flex flex-col items-center bg-white min-h-screen py-10 text-black px-4">
      <motion.div 
        className="bg-[#344ddb] px-12 py-4 rounded-xl shadow-lg text-white text-5xl font-bold"
        whileHover={{ scale: 1.1 }}
      >
        ABOUT US
      </motion.div>
      <div className="w-full border-b border-gray-300 mt-4"></div>
      
      {/* Description Box */}
      <motion.div
        className="bg-gray-200 text-black p-10 rounded-2xl shadow-lg w-[98%] max-w-6xl mt-8 text-center border border-gray-300"
        whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(0,0,0,0.3)" }}
      >
        <h2 className="text-3xl font-bold">Connecting Patients with Experts</h2>
        <p className="mt-4 text-lg">
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
      <div className="w-full border-b border-gray-300 mt-10"></div>
      
      {/* Team Section */}
      <div className="grid grid-cols-2 gap-12 mt-12 max-w-6xl mx-auto">
        {teamMembers.slice(0, 2).map((member, index) => (
          <ProfileCard key={index} member={member} hovered={hovered} setHovered={setHovered} />
        ))}
        <div className="col-span-2 flex justify-center">
          <ProfileCard member={teamMembers[2]} hovered={hovered} setHovered={setHovered} />
        </div>
        {teamMembers.slice(3, 5).map((member, index) => (
          <ProfileCard key={index + 3} member={member} hovered={hovered} setHovered={setHovered} />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-[#344ddb] text-white w-full py-6 mt-16 flex flex-col items-center">
        <div className="flex gap-6 text-2xl">
          <FaEnvelope className="cursor-pointer hover:text-blue-400" />
          <FaInstagram className="cursor-pointer hover:text-red-500" />
          <FaYoutube className="cursor-pointer hover:text-red-600" />
          <FaWhatsapp className="cursor-pointer hover:text-green-500" />
          <FaLinkedin className="cursor-pointer hover:text-blue-500" />
          <FaGithub className="cursor-pointer hover:text-gray-500" />
        </div>
        <p className="mt-3 text-sm">&copy; 2025 Patient Engagement Platform. All Rights Reserved.</p>
      </div>
    </div>
  );
}

function ProfileCard({ member, hovered, setHovered }) {
  return (
    <motion.div
      className="relative bg-white text-black p-8 rounded-lg shadow-md w-[500px] h-[350px] cursor-pointer overflow-hidden flex flex-col items-center justify-center text-center border border-gray-300"
      whileHover={{ width: "550px", height: "400px" }}
      onMouseEnter={() => setHovered(member.name)}
      onMouseLeave={() => setHovered(null)}
    >
      <img src={member.img} alt={member.name} className="w-28 h-28 rounded-full mb-4" />
      <h3 className="font-semibold text-gray-800 text-2xl w-full text-center">{member.name}</h3>
      <p className="text-lg text-gray-600">{member.role}</p>
      {hovered === member.name && (
        <motion.p
          className="text-md text-gray-700 mt-3 px-6"
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
