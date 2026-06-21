import {
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";
import { signup } from "../../api/users";
import Copyright from "../Copyright";
import ErrorAlert from "../ErrorAlert";
import { isLength, isEmail, contains } from "validator";

const DEPARTMENTS = [
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "CHEM",
  "BIOTECH",
  "AIDS",
  "AIML",
  "CSD",
  "MCA",
  "MBA"
];

const COLLEGES = [
  "CBIT",
  "MGIT",
  "Vasavi",
  "VNRVJIET",
  "Other"
];

const SignupView = () => {
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});
  const [verificationMethod, setVerificationMethod] = useState("email");
  const [idProofFile, setIdProofFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    roll_no: "",
    ph_no: "",
    department: "",
    college: "CBIT",
    collegeEmail: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length !== 0) return;

    if (verificationMethod === "card" && !idProofFile) {
      setServerError("Please upload your college ID card file.");
      return;
    }

    if (verificationMethod === "email" && !formData.collegeEmail) {
      setServerError("Please enter your college email address.");
      return;
    }

    setServerError("");
    setSuccessMessage("");

    const submissionData = new FormData();
    submissionData.append("username", formData.username);
    submissionData.append("email", formData.email);
    submissionData.append("password", formData.password);
    submissionData.append("roll_no", formData.roll_no);
    submissionData.append("ph_no", formData.ph_no);
    submissionData.append("department", formData.department);
    submissionData.append("college", formData.college);

    if (verificationMethod === "email") {
      submissionData.append("collegeEmail", formData.collegeEmail);
    } else {
      submissionData.append("idProof", idProofFile);
    }

    const data = await signup(submissionData);

    if (data.error) {
      setServerError(data.error);
    } else {
      setSuccessMessage(data.message || "Registration successful! Please wait for admin verification approval before logging in.");
      // Clear form on success
      setFormData({
        username: "",
        email: "",
        password: "",
        roll_no: "",
        ph_no: "",
        department: "",
        college: "CBIT",
        collegeEmail: "",
      });
      setIdProofFile(null);
    }
  };

  const validate = () => {
    const errors = {};

    if (!isLength(formData.username, { min: 6, max: 30 })) {
      errors.username = "Must be between 6 and 30 characters long";
    }

    if (contains(formData.username, " ")) {
      errors.username = "Must contain only valid characters";
    }

    if (!isLength(formData.password, { min: 8 })) {
      errors.password = "Must be at least 8 characters long";
    }

    if (!isEmail(formData.email)) {
      errors.email = "Must be a valid email address";
    }

    setErrors(errors);

    return errors;
  };

  return (
    <Container maxWidth={"xs"} sx={{ mt: { xs: 2, md: 6 } }}>
      <Stack alignItems="center">
        <Typography variant="h2" color="text.secondary" sx={{ mb: 6 }}>
          <Link to="/" color="inherit" underline="none">
            CBIT Broadcast
          </Link>
        </Typography>
        <Typography variant="h5" gutterBottom>
          Sign Up
        </Typography>
        <Typography color="text.secondary">
          Already have an account? <Link to="/login">Login</Link>
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            autoFocus
            required
            id="username"
            name="username"
            onChange={handleChange}
            error={errors.username !== undefined}
            helperText={errors.username}
          />
          <TextField
            label="Email Address"
            fullWidth
            margin="normal"
            autoComplete="email"
            required
            id="email"
            name="email"
            onChange={handleChange}
            error={errors.email !== undefined}
            helperText={errors.email}
          />
          <TextField
            label="Password"
            fullWidth
            required
            margin="normal"
            autoComplete="password"
            id="password"
            name="password"
            type="password"
            onChange={handleChange}
            error={errors.password !== undefined}
            helperText={errors.password}
          />
          <TextField
            label="Roll_no"
            fullWidth
            margin="normal"
            autoFocus
            required
            id="roll_no"
            name="roll_no"
            onChange={handleChange}
            error={errors.roll_no !== undefined}
            helperText={errors.roll_no}
          />
          <TextField
            label="Ph_number"
            fullWidth
            margin="normal"
            autoFocus
            required
            id="ph_no"
            name="ph_no"
            onChange={handleChange}
            error={errors.ph_no !== undefined}
            helperText={errors.ph_no}
          />
          <FormControl fullWidth margin="normal" required error={errors.department !== undefined}>
            <InputLabel id="department-label">Department</InputLabel>
            <Select
              labelId="department-label"
              label="Department"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
            >
              {DEPARTMENTS.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="college-label">College</InputLabel>
            <Select
              labelId="college-label"
              label="College"
              id="college"
              name="college"
              value={formData.college}
              onChange={handleChange}
            >
              {COLLEGES.map((col) => (
                <MenuItem key={col} value={col}>
                  {col}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="ver-method-label">Verification Method</InputLabel>
            <Select
              labelId="ver-method-label"
              label="Verification Method"
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value)}
            >
              <MenuItem value="email">College Email Address</MenuItem>
              <MenuItem value="card">Upload College ID Card</MenuItem>
            </Select>
          </FormControl>

          {verificationMethod === "email" ? (
            <TextField
              label="College Email Address"
              fullWidth
              margin="normal"
              required
              id="collegeEmail"
              name="collegeEmail"
              value={formData.collegeEmail}
              onChange={handleChange}
              helperText="Enter your official college email address"
            />
          ) : (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Button variant="outlined" component="label" fullWidth>
                Upload College ID Card Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setIdProofFile(e.target.files[0])}
                />
              </Button>
              {idProofFile && (
                <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
                  Selected ID card: {idProofFile.name}
                </Typography>
              )}
            </Box>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ my: 2 }}>
              {successMessage}
            </Alert>
          )}
          <ErrorAlert error={serverError} />
          {!successMessage && (
            <Button type="submit" fullWidth variant="contained" sx={{ my: 2 }}>
              Sign Up
            </Button>
          )}
        </Box>
        <Box sx={{ mt: 3 }}>
          <Copyright />
        </Box>
      </Stack>
    </Container>
  );
};

export default SignupView;
