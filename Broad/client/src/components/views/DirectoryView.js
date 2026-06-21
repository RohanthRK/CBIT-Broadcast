import {
  Card,
  Chip,
  Container,
  Grid,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import { MdPeople, MdSchool } from "react-icons/md";
import { Link } from "react-router-dom";
import { getUsersByDepartment } from "../../api/users";
import { isLoggedIn } from "../../helpers/authHelper";
import Footer from "../Footer";
import GridLayout from "../GridLayout";
import Loading from "../Loading";
import Navbar from "../Navbar";
import UserAvatar from "../UserAvatar";
import HorizontalStack from "../util/HorizontalStack";

const DEPARTMENTS = [
  "All",
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

const UserCard = ({ user }) => {
  return (
    <Card
      component={Link}
      to={"/users/" + user.username}
      sx={{
        textDecoration: "none",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 4 },
        display: "block",
      }}
    >
      <Stack alignItems="center" spacing={1} py={2} px={1}>
        <UserAvatar width={64} height={64} username={user.username} />

        <Typography variant="subtitle1" fontWeight="bold" textAlign="center">
          {user.username}
        </Typography>

        {user.department && (
          <Chip
            icon={<MdSchool />}
            label={user.department}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}

        {user.year && (
          <Typography variant="caption" color="text.secondary">
            {user.year} Year
          </Typography>
        )}

        {user.skills && user.skills.length > 0 && (
          <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={0.5}>
            {user.skills.slice(0, 3).map((skill, i) => (
              <Chip key={i} label={skill} size="small" variant="outlined" />
            ))}
            {user.skills.length > 3 && (
              <Chip
                label={`+${user.skills.length - 3}`}
                size="small"
                variant="outlined"
                color="default"
              />
            )}
          </Stack>
        )}

        {user.projects && user.projects.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            🚀 {user.projects.length} project{user.projects.length !== 1 ? "s" : ""}
          </Typography>
        )}
      </Stack>
    </Card>
  );
};

const DirectoryView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState("All");
  const user = isLoggedIn();

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getUsersByDepartment(department, user && user.token);
    setLoading(false);
    if (data && !data.error) {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [department]);

  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value);
  };

  return (
    <Container>
      <Navbar />

      <GridLayout
        left={
          <Stack spacing={2}>
            {/* Header card */}
            <Card>
              <HorizontalStack justifyContent="space-between">
                <HorizontalStack>
                  <MdPeople size={22} />
                  <Typography variant="h6">Department Directory</Typography>
                </HorizontalStack>
                <HorizontalStack spacing={1}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Department:
                  </Typography>
                  <Select
                    size="small"
                    value={department}
                    onChange={handleDepartmentChange}
                    sx={{ minWidth: 130 }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </HorizontalStack>
              </HorizontalStack>
            </Card>

            {loading ? (
              <Loading />
            ) : users.length === 0 ? (
              <Card>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  textAlign="center"
                  py={4}
                >
                  No students found in {department} department.
                </Typography>
              </Card>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  {users.length} student{users.length !== 1 ? "s" : ""} found
                </Typography>
                <Grid container spacing={2}>
                  {users.map((u) => (
                    <Grid item xs={6} sm={4} key={u._id}>
                      <UserCard user={u} />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Stack>
        }
        right={
          <Stack spacing={2}>
            <Card>
              <Stack spacing={1}>
                <HorizontalStack>
                  <MdSchool size={18} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Departments
                  </Typography>
                </HorizontalStack>
                <Stack spacing={0.5}>
                  {DEPARTMENTS.filter((d) => d !== "All").map((dept) => (
                    <Box
                      key={dept}
                      sx={{
                        cursor: "pointer",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor:
                          department === dept ? "action.selected" : "transparent",
                        "&:hover": { backgroundColor: "action.hover" },
                      }}
                      onClick={() => setDepartment(dept)}
                    >
                      <Typography
                        variant="body2"
                        color={department === dept ? "primary" : "text.primary"}
                        fontWeight={department === dept ? "bold" : "normal"}
                      >
                        {dept}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Card>
            <Footer />
          </Stack>
        }
      />
    </Container>
  );
};

export default DirectoryView;
