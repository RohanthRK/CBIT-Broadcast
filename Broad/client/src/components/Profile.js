import { useTheme } from "@emotion/react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { AiFillEdit, AiFillGithub, AiFillLinkedin } from "react-icons/ai";
import { MdCancel, MdSchool, MdWork, MdAdd, MdDelete } from "react-icons/md";
import { isLoggedIn } from "../helpers/authHelper";
import { updateUser } from "../api/users";
import ContentUpdateEditor from "./ContentUpdateEditor";
import Loading from "./Loading";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";

const Profile = (props) => {
  const [user, setUser] = useState(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [detailForm, setDetailForm] = useState({
    skills: "",
    linkedin: "",
    github: "",
    year: "",
  });
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: "", description: "", link: "" });

  const currentUser = isLoggedIn();
  const theme = useTheme();
  const iconColor = theme.palette.primary.main;

  const isOwnProfile = currentUser && user && user._id === currentUser.userId;

  useEffect(() => {
    if (props.profile) {
      const u = props.profile.user;
      setUser(u);
      setProjects(u.projects || []);
      setDetailForm({
        skills: (u.skills || []).join(", "),
        linkedin: u.socialLinks?.linkedin || "",
        github: u.socialLinks?.github || "",
        year: u.year || "",
      });
    }
  }, [props.profile]);

  const handleDetailChange = (e) => {
    setDetailForm({ ...detailForm, [e.target.name]: e.target.value });
  };

  const handleProjectChange = (idx, field, value) => {
    setProjects(
      projects.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const handleAddProject = () => {
    if (!newProject.name) return;
    setProjects([...projects, { ...newProject }]);
    setNewProject({ name: "", description: "", link: "" });
  };

  const handleRemoveProject = (idx) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  const handleDetailSubmit = async () => {
    const skills = detailForm.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      skills,
      year: detailForm.year,
      socialLinks: {
        linkedin: detailForm.linkedin,
        github: detailForm.github,
      },
      projects,
    };
    await updateUser(currentUser, payload);
    if (props.handleProfileUpdate) {
      props.handleProfileUpdate({
        skills,
        year: detailForm.year,
        socialLinks: { linkedin: detailForm.linkedin, github: detailForm.github },
        projects,
      });
    }
    setDetailEditing(false);
  };

  if (!props.profile) {
    return (
      <Card>
        <Loading label="Loading profile" />
      </Card>
    );
  }

  const { followerCount = 0, followingCount = 0, isFollowing } = props.profile;

  return (
    <Card>
      {user ? (
        <Stack alignItems="center" spacing={2}>
          {/* Avatar */}
          <Box my={1}>
            <UserAvatar width={150} height={150} username={user.username} />
          </Box>

          {/* Name + Department */}
          <Typography variant="h5" fontWeight="bold">
            {user.username}
          </Typography>

          {user.department && (
            <Chip
              icon={<MdSchool />}
              label={user.department}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}

          {user.year && (
            <Typography variant="body2" color="text.secondary">
              📅 {user.year} Year
            </Typography>
          )}

          {/* Bio */}
          {props.editing ? (
            <Box width="100%">
              <ContentUpdateEditor
                handleSubmit={props.handleSubmit}
                originalContent={user.biography}
                validate={props.validate}
              />
            </Box>
          ) : user.biography ? (
            <Typography textAlign="center" variant="body2" color="text.secondary">
              {user.biography}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              <i>No bio yet</i>
            </Typography>
          )}

          {/* Stats row */}
          <HorizontalStack spacing={3} justifyContent="center">
            <Stack alignItems="center">
              <Typography variant="subtitle2" fontWeight="bold">
                {props.profile.posts.count}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Posts
              </Typography>
            </Stack>
            <Stack alignItems="center">
              <Typography variant="subtitle2" fontWeight="bold">
                {props.profile.posts.likeCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Likes
              </Typography>
            </Stack>
            <Stack alignItems="center">
              <Typography variant="subtitle2" fontWeight="bold">
                {followerCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Followers
              </Typography>
            </Stack>
            <Stack alignItems="center">
              <Typography variant="subtitle2" fontWeight="bold">
                {followingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Following
              </Typography>
            </Stack>
          </HorizontalStack>

          {/* Action buttons */}
          {isOwnProfile ? (
            <HorizontalStack>
              <Button
                startIcon={props.editing ? <MdCancel color={iconColor} /> : <AiFillEdit color={iconColor} />}
                onClick={props.handleEditing}
                size="small"
              >
                {props.editing ? "Cancel" : "Edit Bio"}
              </Button>
              <Button
                startIcon={detailEditing ? <MdCancel color={iconColor} /> : <AiFillEdit color={iconColor} />}
                onClick={() => setDetailEditing(!detailEditing)}
                size="small"
              >
                {detailEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </HorizontalStack>
          ) : (
            <HorizontalStack>
              {currentUser && (
                <Button
                  variant={isFollowing ? "outlined" : "contained"}
                  size="small"
                  onClick={props.handleFollow}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
              {currentUser && (
                <Button variant="outlined" size="small" onClick={props.handleMessage}>
                  Message
                </Button>
              )}
            </HorizontalStack>
          )}

          {/* Social Links */}
          {(user.socialLinks?.linkedin || user.socialLinks?.github) && (
            <>
              <Divider flexItem />
              <HorizontalStack>
                {user.socialLinks.linkedin && (
                  <Tooltip title="LinkedIn">
                    <IconButton
                      component={Link}
                      href={user.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener"
                      size="small"
                    >
                      <AiFillLinkedin size={22} color="#0077B5" />
                    </IconButton>
                  </Tooltip>
                )}
                {user.socialLinks.github && (
                  <Tooltip title="GitHub">
                    <IconButton
                      component={Link}
                      href={user.socialLinks.github}
                      target="_blank"
                      rel="noopener"
                      size="small"
                    >
                      <AiFillGithub size={22} />
                    </IconButton>
                  </Tooltip>
                )}
              </HorizontalStack>
            </>
          )}

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <>
              <Divider flexItem />
              <Box width="100%">
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  🛠 Skills
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {user.skills.map((skill, i) => (
                    <Chip key={i} label={skill} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {/* Projects */}
          {user.projects && user.projects.length > 0 && (
            <>
              <Divider flexItem />
              <Box width="100%">
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  🚀 Projects
                </Typography>
                <Stack spacing={1}>
                  {user.projects.map((proj, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        border: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {proj.link ? (
                          <Link
                            href={proj.link}
                            target="_blank"
                            rel="noopener"
                            underline="hover"
                          >
                            {proj.name}
                          </Link>
                        ) : (
                          proj.name
                        )}
                      </Typography>
                      {proj.description && (
                        <Typography variant="caption" color="text.secondary">
                          {proj.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {/* Detail Edit Form */}
          {detailEditing && isOwnProfile && (
            <>
              <Divider flexItem />
              <Box width="100%">
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Edit Profile Details
                </Typography>
                <Stack spacing={1.5}>
                  <Select
                    size="small"
                    name="year"
                    value={detailForm.year}
                    onChange={handleDetailChange}
                    displayEmpty
                    fullWidth
                  >
                    <MenuItem value="">Year of Study</MenuItem>
                    <MenuItem value="1st">1st Year</MenuItem>
                    <MenuItem value="2nd">2nd Year</MenuItem>
                    <MenuItem value="3rd">3rd Year</MenuItem>
                    <MenuItem value="4th">4th Year</MenuItem>
                  </Select>
                  <TextField
                    size="small"
                    label="Skills (comma-separated)"
                    name="skills"
                    value={detailForm.skills}
                    onChange={handleDetailChange}
                    fullWidth
                    placeholder="React, Node.js, Python"
                  />
                  <TextField
                    size="small"
                    label="LinkedIn URL"
                    name="linkedin"
                    value={detailForm.linkedin}
                    onChange={handleDetailChange}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="GitHub URL"
                    name="github"
                    value={detailForm.github}
                    onChange={handleDetailChange}
                    fullWidth
                  />

                  {/* Projects editor */}
                  <Typography variant="subtitle2" fontWeight="bold">
                    Projects
                  </Typography>
                  {projects.map((proj, idx) => (
                    <Box key={idx} sx={{ border: 1, borderColor: "divider", p: 1, borderRadius: 1 }}>
                      <Stack spacing={0.5}>
                        <TextField
                          size="small"
                          label="Project Name"
                          value={proj.name}
                          onChange={(e) => handleProjectChange(idx, "name", e.target.value)}
                          fullWidth
                        />
                        <TextField
                          size="small"
                          label="Description"
                          value={proj.description}
                          onChange={(e) => handleProjectChange(idx, "description", e.target.value)}
                          fullWidth
                          multiline
                          rows={2}
                        />
                        <TextField
                          size="small"
                          label="Link (optional)"
                          value={proj.link}
                          onChange={(e) => handleProjectChange(idx, "link", e.target.value)}
                          fullWidth
                        />
                        <Button
                          size="small"
                          color="error"
                          startIcon={<MdDelete />}
                          onClick={() => handleRemoveProject(idx)}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Box>
                  ))}

                  {/* Add new project */}
                  <Box sx={{ border: 1, borderColor: "divider", p: 1, borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Add New Project
                    </Typography>
                    <Stack spacing={0.5} mt={0.5}>
                      <TextField
                        size="small"
                        label="Project Name"
                        value={newProject.name}
                        onChange={(e) =>
                          setNewProject({ ...newProject, name: e.target.value })
                        }
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Description"
                        value={newProject.description}
                        onChange={(e) =>
                          setNewProject({ ...newProject, description: e.target.value })
                        }
                        fullWidth
                        multiline
                        rows={2}
                      />
                      <TextField
                        size="small"
                        label="Link (optional)"
                        value={newProject.link}
                        onChange={(e) =>
                          setNewProject({ ...newProject, link: e.target.value })
                        }
                        fullWidth
                      />
                      <Button
                        size="small"
                        startIcon={<MdAdd />}
                        onClick={handleAddProject}
                        disabled={!newProject.name}
                      >
                        Add Project
                      </Button>
                    </Stack>
                  </Box>

                  <Button variant="contained" size="small" onClick={handleDetailSubmit}>
                    Save Changes
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      ) : (
        <Loading label="Loading profile" />
      )}
    </Card>
  );
};

export default Profile;
