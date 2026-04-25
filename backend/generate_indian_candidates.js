import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidates = [];
let idCounter = 1;

function getId() {
  return 'ind_' + String(idCounter++).padStart(3, '0');
}

// Helper to generate salaries in INR (e.g., 500000 for 5 LPA)
function getSalary(lpa) {
  return lpa * 100000;
}

// --- CATEGORY 1: Junior Java Developers (Freshers) ---
const juniorJava = [
  "Rahul Sharma", "Sneha Patel", "Amit Singh", "Priya Gupta", "Vikram Reddy", 
  "Anjali Nair", "Rohan Iyer", "Neha Joshi", "Karthik Verma", "Pooja Chauhan"
];

const juniorSkillsVariations = [
  ["Core Java", "Spring Boot", "MySQL", "Git", "HTML", "CSS", "JavaScript", "REST APIs", "Postman", "Linux"], // Perfect match
  ["Core Java", "Spring Boot", "PostgreSQL", "Git", "JavaScript", "REST APIs", "JUnit"], // Missing some frontend, has testing
  ["Java", "Spring Framework", "Oracle", "Git", "HTML", "CSS", "JSP"], // Slightly older tech stack
  ["Core Java", "Hibernate", "MySQL", "Git", "REST APIs", "Linux", "Docker"], // Has Docker, missing Spring Boot
  ["Core Java", "Data Structures", "Algorithms", "SQL", "Git", "Problem Solving"] // More theoretical/generic
];

const juniorLocations = ["Bangalore, India", "Pune, India", "Hyderabad, India", "Chennai, India", "Mumbai, India"];

juniorJava.forEach((name, i) => {
  candidates.push({
    id: getId(),
    name: name,
    currentRole: "Junior Java Developer",
    yearsExperience: i % 3 === 0 ? 0 : (i % 3 === 1 ? 1 : 2), // 0, 1, or 2 years
    skills: juniorSkillsVariations[i % juniorSkillsVariations.length],
    location: juniorLocations[i % juniorLocations.length],
    remoteOk: i % 2 === 0,
    currentSalary: getSalary(3.5 + (i * 0.3)), // 3.5 to 6.2 LPA
    noticePeriodWeeks: i % 3 === 0 ? 0 : (i % 3 === 1 ? 2 : 4),
    bio: `Passionate backend developer with ${i % 3 === 0 ? 'strong academic projects' : 'early industry experience'} using Java ecosystems. Looking to build scalable enterprise solutions.`,
    githubUrl: `https://github.com/${name.replace(' ', '').toLowerCase()}`,
    linkedinUrl: `https://linkedin.com/in/${name.replace(' ', '').toLowerCase()}`,
    availability: i % 3 === 0 ? "immediately" : (i % 3 === 1 ? "2 weeks" : "4 weeks")
  });
});

// --- CATEGORY 2: Senior Backend Engineers (Java) ---
const seniorJava = [
  "Aditya Rao", "Shruti Das", "Manish Yadav", "Divya Deshmukh", "Saurabh Kumar", 
  "Aishwarya Singh", "Varun Patel", "Kriti Sharma", "Deepak Gupta", "Meera Reddy"
];

seniorJava.forEach((name, i) => {
  candidates.push({
    id: getId(),
    name: name,
    currentRole: "Senior Backend Engineer",
    yearsExperience: 5 + (i % 4),
    skills: ["Java", "Spring Boot", "Microservices", "Kafka", "PostgreSQL", "AWS", "Docker", "Kubernetes", "Redis", "System Design"],
    location: i % 2 === 0 ? "Bangalore, India" : "Hyderabad, India",
    remoteOk: true,
    currentSalary: getSalary(18 + i), // 18 to 27 LPA
    noticePeriodWeeks: 8, // Typical 2 months notice in India
    bio: `Senior backend engineer with expertise in highly scalable microservices architecture using Spring Boot and Kafka. Experience processing millions of transactions per day.`,
    githubUrl: `https://github.com/${name.replace(' ', '').toLowerCase()}`,
    linkedinUrl: `https://linkedin.com/in/${name.replace(' ', '').toLowerCase()}`,
    availability: "8 weeks"
  });
});

// --- CATEGORY 3: Full Stack MERN Developers (Mid/Senior) ---
const mernDevs = [
  "Arjun Menon", "Rhea Kapoor", "Siddharth Jain", "Swati Mishra", "Ravi Teja",
  "Nisha Pillai", "Gaurav Malhotra", "Aarti Desai", "Harsh Joshi", "Sneha Rao",
  "Pranav Kumar", "Sonalika Sharma", "Avinash Singh", "Neha Gupta", "Rajesh Verma"
];

mernDevs.forEach((name, i) => {
  candidates.push({
    id: getId(),
    name: name,
    currentRole: i < 5 ? "Full-Stack Engineer" : "Senior Full-Stack Engineer",
    yearsExperience: 3 + (i % 5),
    skills: ["React", "Node.js", "Express", "MongoDB", "TypeScript", "Tailwind CSS", "Redux", "Docker", "AWS", "Next.js"],
    location: i % 3 === 0 ? "Remote, India" : (i % 2 === 0 ? "Mumbai, India" : "Bangalore, India"),
    remoteOk: true,
    currentSalary: getSalary(12 + i), // 12 to 26 LPA
    noticePeriodWeeks: i % 2 === 0 ? 4 : 8,
    bio: `MERN stack expert building high-performance web applications. Strong focus on frontend UI/UX with React and scalable backend APIs with Node.js.`,
    githubUrl: `https://github.com/${name.replace(' ', '').toLowerCase()}`,
    linkedinUrl: `https://linkedin.com/in/${name.replace(' ', '').toLowerCase()}`,
    availability: i % 2 === 0 ? "4 weeks" : "8 weeks"
  });
});

// --- CATEGORY 4: Data Scientists & ML Engineers ---
const mlDevs = [
  "Yash Agarwal", "Kavita Rathi", "Prateek Bansal", "Nidhi Agarwal", "Ankur Tiwari",
  "Tanvi Shah", "Rishabh Joshi", "Saurav Desai", "Smriti Joshi", "Aditi Rao"
];

mlDevs.forEach((name, i) => {
  candidates.push({
    id: getId(),
    name: name,
    currentRole: i < 5 ? "Data Scientist" : "Machine Learning Engineer",
    yearsExperience: 4 + (i % 3),
    skills: ["Python", "TensorFlow", "PyTorch", "SQL", "Pandas", "Scikit-Learn", "NLP", "AWS SageMaker", "Computer Vision", "Docker"],
    location: i % 2 === 0 ? "Pune, India" : "Gurgaon, India",
    remoteOk: true,
    currentSalary: getSalary(16 + (i * 1.5)), 
    noticePeriodWeeks: 8,
    bio: `Data professional specializing in predictive modeling and NLP. Passionate about bringing AI models into production environments.`,
    githubUrl: `https://github.com/${name.replace(' ', '').toLowerCase()}`,
    linkedinUrl: `https://linkedin.com/in/${name.replace(' ', '').toLowerCase()}`,
    availability: "8 weeks"
  });
});

// --- CATEGORY 5: DevOps & Cloud Engineers ---
const devopsDevs = [
  "Sandeep Kumar", "Bhavesh Sharma", "Ajay Verma", "Ashish Gupta", "Priya Koli",
  "Manoj Singh", "Pankaj Desai", "Naveen Reddy", "Vikram Kaushal", "Ayush Khurrana",
  "Raj Kumar", "Tara Pannu", "Bhumika Pednekar", "Radhika Sharma", "Kalyani Rao"
];

devopsDevs.forEach((name, i) => {
  candidates.push({
    id: getId(),
    name: name,
    currentRole: "DevOps Engineer",
    yearsExperience: 3 + (i % 6),
    skills: ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "Jenkins", "Linux", "Bash", "Python", "Prometheus"],
    location: "Chennai, India",
    remoteOk: true,
    currentSalary: getSalary(10 + (i * 1.2)),
    noticePeriodWeeks: 4,
    bio: `Cloud infrastructure expert focusing on automation, CI/CD pipelines, and Kubernetes cluster management. Certified AWS Solutions Architect.`,
    githubUrl: `https://github.com/${name.replace(' ', '').toLowerCase()}`,
    linkedinUrl: `https://linkedin.com/in/${name.replace(' ', '').toLowerCase()}`,
    availability: "4 weeks"
  });
});

// Save to JSON file
const filePath = path.join(__dirname, 'data', 'candidates.json');
fs.writeFileSync(filePath, JSON.stringify(candidates, null, 2));

console.log(`Successfully generated ${candidates.length} Indian candidate profiles and saved to ${filePath}`);
