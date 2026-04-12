
export interface Interview {
  id: number;
  title: string;
  description: string;
  location: string;
  department: string;
  contractType: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  scheduledAt: string;
  maxCandidates: number;
  requiredSkills: string;
  experienceYears: number;
  createdAt: string;
}

export interface Application {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cin: string;
  coverLetter: string;
  cvPath: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'INTERVIEW_SCHEDULED';
  atsScore: number;
  atsFeedback: string;
  appliedAt: string;
  interview?: Interview;
}

export interface ApplicationRequest {
  interviewId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cin: string;
  coverLetter: string;
}

export interface InterviewRequest {
  title: string;
  description: string;
  location: string;
  department: string;
  contractType: string;
  scheduledAt: string;
  maxCandidates: number;
  requiredSkills: string;
  experienceYears: number;
}