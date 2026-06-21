import {
  Card,
  Chip,
  Container,
  Grid,
  MenuItem,
  Select,
  Stack,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Box,
  IconButton,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { AiFillFileText, AiOutlineArrowUp } from "react-icons/ai";
import { MdDownload, MdDelete, MdUploadFile } from "react-icons/md";
import { getResources, createResource, upvoteResource, updateResource, deleteResource } from "../../api/resources";
import { isLoggedIn } from "../../helpers/authHelper";
import { BASE_URL } from "../../config";
import Footer from "../Footer";
import GridLayout from "../GridLayout";
import Loading from "../Loading";
import Navbar from "../Navbar";
import UserAvatar from "../UserAvatar";
import HorizontalStack from "../util/HorizontalStack";

const DEPARTMENTS = ["All", "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "BIOTECH", "AIDS", "CSD", "MCA"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const ResourceCard = ({ resource, onUpvote, onDelete, onEdit }) => {
  const user = isLoggedIn();
  const isUploader = user && user.userId === resource.uploader?._id;
  const isAdmin = user && user.isAdmin;
  const isUpvoted = user && resource.upvotes.includes(user.userId);

  const formattedDate = new Date(resource.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleDownload = () => {
    const fullUrl = resource.fileUrl.startsWith("http") ? resource.fileUrl : BASE_URL + resource.fileUrl.replace(/^\//, "");
    window.open(fullUrl, "_blank");
  };

  return (
    <Card sx={{ p: 2, transition: "box-shadow 0.2s", "&:hover": { boxShadow: 3 } }}>
      <Stack spacing={1.5}>
        <HorizontalStack justifyContent="space-between">
          <HorizontalStack spacing={1}>
            <UserAvatar width={28} height={28} username={resource.uploader?.username} />
            <Stack>
              <Typography variant="subtitle2" fontWeight="bold">
                {resource.uploader?.username || "Unknown Faculty/Student"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
            </Stack>
          </HorizontalStack>
          <Stack direction="row" gap={0.5}>
            <Chip label={resource.department} color="primary" size="small" variant="outlined" />
            <Chip label={resource.year} color="secondary" size="small" variant="outlined" />
          </Stack>
        </HorizontalStack>

        <Box sx={{ py: 0.5 }}>
          <Typography variant="h6" fontWeight="bold">
            {resource.title}
          </Typography>
          <Typography variant="subtitle2" color="primary" fontWeight="medium" sx={{ mb: 1 }}>
            Subject: {resource.subject}
          </Typography>
          {resource.description && (
            <Typography variant="body2" color="text.secondary">
              {resource.description}
            </Typography>
          )}
        </Box>

        <HorizontalStack justifyContent="space-between" sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}>
          <HorizontalStack spacing={1}>
            <Button
              variant={isUpvoted ? "contained" : "outlined"}
              size="small"
              color="primary"
              startIcon={<AiOutlineArrowUp />}
              onClick={() => onUpvote(resource._id)}
            >
              Helpful ({resource.upvotes.length})
            </Button>
            <Button
              variant="contained"
              size="small"
              color="secondary"
              startIcon={<MdDownload />}
              onClick={handleDownload}
            >
              View / Download
            </Button>
          </HorizontalStack>

          {(isUploader || isAdmin) && (
            <HorizontalStack spacing={0.5}>
              {isUploader && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onEdit(resource)}
                >
                  Edit
                </Button>
              )}
              <IconButton size="small" color="error" onClick={() => onDelete(resource._id)}>
                <MdDelete />
              </IconButton>
            </HorizontalStack>
          )}
        </HorizontalStack>
      </Stack>
    </Card>
  );
};

const ResourcesView = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [year, setYear] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [resourceDept, setResourceDept] = useState("CSE");
  const [resourceYear, setResourceYear] = useState("1st Year");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const user = isLoggedIn();

  const fetchResources = async () => {
    setLoading(true);
    const query = {};
    if (search) query.search = search;
    if (department && department !== "All") query.department = department;
    if (year) query.year = year;

    const data = await getResources(user && user.token, query);
    setLoading(false);
    if (data && !data.error) {
      setResources(data);
    }
  };

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, year]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleUpvote = async (resourceId) => {
    const data = await upvoteResource(resourceId, user);
    if (data && !data.error) {
      setResources(resources.map((res) => (res._id === resourceId ? data : res)));
    }
  };

  const handleDelete = async (resourceId) => {
    if (window.confirm("Are you sure you want to delete this resource file?")) {
      const data = await deleteResource(resourceId, user);
      if (data && !data.error) {
        setResources(resources.filter((res) => res._id !== resourceId));
      }
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setTitle(resource.title);
    setDescription(resource.description || "");
    setSubject(resource.subject);
    setResourceDept(resource.department);
    setResourceYear(resource.year);
    setFile(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingResource(null);
    setTitle("");
    setDescription("");
    setSubject("");
    setResourceDept("CSE");
    setResourceYear("1st Year");
    setFile(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !subject || !resourceDept || !resourceYear) {
      setError("Please fill out all required fields.");
      return;
    }

    if (!file && !editingResource) {
      setError("Please select a resource file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("subject", subject);
    formData.append("department", resourceDept);
    formData.append("year", resourceYear);
    if (file) {
      formData.append("file", file);
    }

    let data;
    if (editingResource) {
      data = await updateResource(editingResource._id, formData, user);
    } else {
      data = await createResource(formData, user);
    }

    if (data && data.error) {
      setError(data.error);
    } else if (data) {
      if (editingResource) {
        setResources(resources.map((res) => (res._id === editingResource._id ? data : res)));
      } else {
        setResources([data, ...resources]);
      }
      setDialogOpen(false);
      setEditingResource(null);
      setTitle("");
      setDescription("");
      setSubject("");
      setResourceDept("CSE");
      setResourceYear("1st Year");
      setFile(null);
    }
  };

  return (
    <Container>
      <Navbar />

      <GridLayout
        left={
          <Stack spacing={3}>
            {/* Header banner */}
            <Card sx={{ p: 2 }}>
              <HorizontalStack justifyContent="space-between">
                <HorizontalStack spacing={1}>
                  <AiFillFileText size={24} />
                  <Typography variant="h5" fontWeight="bold">
                    Notes & Study Resources
                  </Typography>
                </HorizontalStack>
                <Button
                  variant="contained"
                  startIcon={<MdUploadFile />}
                  onClick={() => setDialogOpen(true)}
                >
                  Upload File
                </Button>
              </HorizontalStack>
            </Card>

            {/* Filter controls */}
            <Card sx={{ p: 2 }}>
              <Box component="form" onSubmit={handleSearchSubmit}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search subject, titles, desc..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Department</InputLabel>
                      <Select
                        label="Department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      >
                        {DEPARTMENTS.map((dept) => (
                          <MenuItem key={dept} value={dept}>
                            {dept}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Year</InputLabel>
                      <Select
                        label="Year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                      >
                        <MenuItem value="">All Years</MenuItem>
                        {YEARS.map((yr) => (
                          <MenuItem key={yr} value={yr}>
                            {yr}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button variant="outlined" fullWidth type="submit">
                      Filter
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Card>

            {/* Resources list */}
            {loading ? (
              <Loading />
            ) : resources.length === 0 ? (
              <Card sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  No materials posted yet. Be the first to share notes!
                </Typography>
              </Card>
            ) : (
              <Stack spacing={2}>
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource._id}
                    resource={resource}
                    onUpvote={handleUpvote}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        }
        right={
          <Stack spacing={2}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Resources Hub
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Access and share lecture summaries, previous year semester exam papers, lab reports, syllabus files, and guides.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upvote documents that are helpful to let other class students find reliable files quickly.
              </Typography>
            </Card>
            <Footer />
          </Stack>
        }
      />

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <Box component="form" onSubmit={handleFormSubmit}>
          <DialogTitle fontWeight="bold">{editingResource ? "Edit Note / Study Guide" : "Upload Note or Study Guide"}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              {error && (
                <Typography color="error" variant="body2" align="center">
                  {error}
                </Typography>
              )}
              <TextField
                label="Resource Title"
                placeholder="e.g. DBMS Unit 2 notes, Physics Lab Manual"
                required
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextField
                label="Subject Name"
                placeholder="e.g. Database Management Systems, Physics"
                required
                fullWidth
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <TextField
                label="Brief Description"
                placeholder="e.g. Contains handwritten class notes covering transactions, indexing..."
                multiline
                rows={2}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Department</InputLabel>
                    <Select
                      label="Department"
                      value={resourceDept}
                      onChange={(e) => setResourceDept(e.target.value)}
                    >
                      {DEPARTMENTS.filter((dept) => dept !== "All").map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Year</InputLabel>
                    <Select
                      label="Year"
                      value={resourceYear}
                      onChange={(e) => setResourceYear(e.target.value)}
                    >
                      {YEARS.map((yr) => (
                        <MenuItem key={yr} value={yr}>
                          {yr}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Button variant="outlined" component="label" fullWidth>
                Select File (PDF, DOCX, Images, ZIP)
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.zip,.png,.jpg,.jpeg"
                  hidden
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </Button>
              {file && (
                <Typography variant="caption" color="success.main" textAlign="center">
                  Selected File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" type="submit">
              {editingResource ? "Save Changes" : "Upload"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
};

export default ResourcesView;
