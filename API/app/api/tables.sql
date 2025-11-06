-- Doctor Table
CREATE TABLE Doctor (
  Code TEXT PRIMARY KEY,
  FirstName TEXT NOT NULL,
  LastName TEXT NOT NULL,
  PhoneNumber TEXT,
  Email TEXT
);

-- Student Table
CREATE TABLE Student (
  Code TEXT PRIMARY KEY,
  DoctorCode TEXT NOT NULL,
  FirstName TEXT NOT NULL,
  LastName TEXT NOT NULL,
  DateOfBirth DATE,
  DateOfRegistration DATE,
  PhoneNumber TEXT,
  Gender TEXT,
  Age INTEGER,
  FOREIGN KEY (DoctorCode) REFERENCES Doctor(Code)
);

-- Parent Table
CREATE TABLE Parent (
  Code TEXT PRIMARY KEY,
  StudentCode TEXT NOT NULL,
  FirstName TEXT NOT NULL,
  LastName TEXT NOT NULL,
  PhoneNumber TEXT,
  FOREIGN KEY (StudentCode) REFERENCES Student(Code)
);

-- Attendance Table
CREATE TABLE Attendance (
  Code TEXT PRIMARY KEY,
  StudentCode TEXT NOT NULL,
  AttendanceDate DATE,
  FOREIGN KEY (StudentCode) REFERENCES Student(Code)
);

-- Chapters Table
CREATE TABLE Chapters (
  Code TEXT PRIMARY KEY,
  Name TEXT NOT NULL,
  NumberOfVerses INTEGER
);

-- CompletedChapter Table
CREATE TABLE CompletedChapter (
  Code TEXT PRIMARY KEY,
  StudentCode TEXT NOT NULL,
  ChapterCode TEXT NOT NULL,
  CompletionDate DATE,
  Evaluation TEXT,
  Progress TEXT,
  Feedback TEXT,
  FOREIGN KEY (StudentCode) REFERENCES Student(Code),
  FOREIGN KEY (ChapterCode) REFERENCES Chapters(Code)
);

-- CompletedEighth Table
CREATE TABLE CompletedEighth (
  Code TEXT PRIMARY KEY,
  StudentCode TEXT NOT NULL,
  QuarterCode TEXT,
  CompletionDate DATE,
  EighthCode TEXT,
  Evaluation TEXT,
  Feedback TEXT,
  FOREIGN KEY (StudentCode) REFERENCES Student(Code)
);


-- Chapters Table
CREATE TABLE Quarter (
  Code TEXT PRIMARY KEY,
  Name TEXT NOT NULL,
);

-- CompletedQuarter Table
CREATE TABLE CompletedQuarter (
  Code TEXT PRIMARY KEY,
  StudentCode TEXT NOT NULL,
  QuarterCode TEXT,
  CompletionDate DATE,
  Evaluation TEXT,
  Feedback TEXT,
  progress TEXT,
  FOREIGN KEY (StudentCode) REFERENCES Student(Code),
  FOREIGN KEY (QuarterCode) REFERENCES Quarter(Code)
);

-- Payments Table
CREATE TABLE Payments (
  Code TEXT PRIMARY KEY,
  StudentCode TEXT NOT NULL,
  Month TEXT,
  FOREIGN KEY (StudentCode) REFERENCES Student(Code)
);