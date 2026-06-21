import {
  Button,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/posts";
import ErrorAlert from "./ErrorAlert";
import { isLoggedIn } from "../helpers/authHelper";
import HorizontalStack from "./util/HorizontalStack";
import UserAvatar from "./UserAvatar";

const POST_CATEGORIES = [
  "General",
  "Academics",
  "Events",
  "Placements",
  "Sports",
  "Exam Cell",
  "Clubs",
];

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

const PostEditor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    targetDepartment: "All",
  });

  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [allowEditVote, setAllowEditVote] = useState(false);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [showPercentages, setShowPercentages] = useState("voted");
  const [attachments, setAttachments] = useState([]);
  const [attachmentLayout, setAttachmentLayout] = useState("grid");

  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});
  const user = isLoggedIn();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    const errors = validate();
    setErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const submissionData = new FormData();
    submissionData.append("title", formData.title);
    submissionData.append("content", formData.content);
    submissionData.append("category", formData.category);
    submissionData.append("targetDepartment", formData.targetDepartment);

    if (pollEnabled) {
      const validOptions = pollOptions.filter(opt => opt.trim() !== "");
      if (validOptions.length >= 2) {
        submissionData.append("poll", JSON.stringify({
          question: pollQuestion || formData.title,
          options: validOptions.map(opt => ({ text: opt })),
          allowEditVote,
          multipleChoice,
          showPercentages
        }));
      }
    }

    if (attachments && attachments.length > 0) {
      attachments.forEach((file) => {
        submissionData.append("attachments", file);
      });
    }
    submissionData.append("attachmentLayout", attachmentLayout);

    const data = await createPost(submissionData, isLoggedIn());
    setLoading(false);
    if (data && data.error) {
      setServerError(data.error);
    } else {
      navigate("/posts/" + data._id);
    }
  };

  const validate = () => {
    const errors = {};

    return errors;
  };

  return (
    <Card>
      <Stack spacing={1}>
        {user && (
          <HorizontalStack spacing={2}>
            <UserAvatar width={50} height={50} username={user.username} />
            <Typography variant="h5">
              What would you like to post today {user.username}?
            </Typography>
          </HorizontalStack>
        )}


        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            required
            name="title"
            margin="normal"
            onChange={handleChange}
            error={errors.title !== undefined}
            helperText={errors.title}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {POST_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="department-label">Target Audience</InputLabel>
            <Select
              labelId="department-label"
              label="Target Audience"
              name="targetDepartment"
              value={formData.targetDepartment}
              onChange={handleChange}
            >
              <MenuItem value="All">All Departments</MenuItem>
              {DEPARTMENTS.map(dept => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Content"
            multiline
            rows={10}
            name="content"
            margin="normal"
            onChange={handleChange}
            error={errors.content !== undefined}
            helperText={errors.content}
            required
          />

          <Box sx={{ mt: 2, mb: 1 }}>
            <Button variant="outlined" component="label">
              Upload Attachments (Images/PDFs)
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => setAttachments([...attachments, ...Array.from(e.target.files)])}
              />
            </Button>
            {attachments.length > 0 && (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {attachments.map((file, i) => (
                  <HorizontalStack key={i} justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      {file.name}
                    </Typography>
                    <Button size="small" color="error" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                      Remove
                    </Button>
                  </HorizontalStack>
                ))}
                {attachments.filter(file => file.type.startsWith("image/")).length > 1 && (
                  <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                    <InputLabel id="attachment-layout-label">Photo Grid/Layout Style</InputLabel>
                    <Select
                      labelId="attachment-layout-label"
                      label="Photo Grid/Layout Style"
                      value={attachmentLayout}
                      onChange={(e) => setAttachmentLayout(e.target.value)}
                    >
                      <MenuItem value="grid">Grid Collage</MenuItem>
                      <MenuItem value="carousel">Carousel Slider</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Stack>
            )}
          </Box>

          <Box sx={{ mt: 2, mb: 1 }}>
            <Button variant="outlined" onClick={() => setPollEnabled(!pollEnabled)}>
              {pollEnabled ? "Remove Poll" : "Add Poll"}
            </Button>
            {pollEnabled && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Poll Question (optional, defaults to title)"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />
                {pollOptions.map((opt, i) => (
                  <HorizontalStack key={i} spacing={1} alignItems="center">
                    <TextField
                      fullWidth
                      label={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          const newOpts = pollOptions.filter((_, idx) => idx !== i);
                          setPollOptions(newOpts);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </HorizontalStack>
                ))}
                {pollOptions.length < 5 && (
                  <Button
                    variant="text"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                  >
                    Add Option
                  </Button>
                )}

                <HorizontalStack spacing={2} sx={{ flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={<Checkbox checked={allowEditVote} onChange={(e) => setAllowEditVote(e.target.checked)} />}
                    label="Allow changing votes"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={multipleChoice} onChange={(e) => setMultipleChoice(e.target.checked)} />}
                    label="Allow multiple choices"
                  />
                </HorizontalStack>

                <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                  <InputLabel>Show Results</InputLabel>
                  <Select
                    value={showPercentages}
                    label="Show Results"
                    onChange={(e) => setShowPercentages(e.target.value)}
                  >
                    <MenuItem value="voted">After Voting</MenuItem>
                    <MenuItem value="never">Never Show</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            )}
          </Box>

          <ErrorAlert error={serverError} />
          <Button
            variant="outlined"
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              mt: 2,
            }}
          >
            {loading ? <>Submitting</> : <>Submit</>}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
};

export default PostEditor;
