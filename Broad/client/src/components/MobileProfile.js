import { useTheme } from "@emotion/react";
import {
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import { AiFillEdit, AiFillGithub, AiFillLinkedin } from "react-icons/ai";
import { MdCancel } from "react-icons/md";
import { isLoggedIn } from "../helpers/authHelper";
import ContentUpdateEditor from "./ContentUpdateEditor";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";

const MobileProfile = (props) => {
  const [user, setUser] = useState(null);
  const currentUser = isLoggedIn();
  const theme = useTheme();
  const iconColor = theme.palette.primary.main;

  const isOwnProfile = currentUser && user && user._id === currentUser.userId;

  useEffect(() => {
    if (props.profile) {
      setUser(props.profile.user);
    }
  }, [props.profile]);

  const { followerCount = 0, followingCount = 0, isFollowing } =
    props.profile || {};

  return (
    <Card sx={{ display: { sm: "block", md: "none" }, mb: 2 }}>
      {user ? (
        <Stack spacing={2}>
          <HorizontalStack spacing={2} justifyContent="space-between">
            <HorizontalStack>
              <UserAvatar width={50} height={50} username={user.username} />
              <Stack>
                <Typography variant="h6" textOverflow="ellipses">
                  {user.username}
                </Typography>
                {user.department && (
                  <Chip
                    label={user.department}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ alignSelf: "flex-start" }}
                  />
                )}
              </Stack>
            </HorizontalStack>

            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <HorizontalStack spacing={2}>
                <Stack alignItems="center">
                  <Typography variant="caption">Posts</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <b>{props.profile.posts.count}</b>
                  </Typography>
                </Stack>
                <Stack alignItems="center">
                  <Typography variant="caption">Likes</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <b>{props.profile.posts.likeCount}</b>
                  </Typography>
                </Stack>
                <Stack alignItems="center">
                  <Typography variant="caption">Followers</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <b>{followerCount}</b>
                  </Typography>
                </Stack>
              </HorizontalStack>
            </Box>
          </HorizontalStack>

          <Divider />

          <Box>
            {isOwnProfile && (
              <IconButton onClick={props.handleEditing} sx={{ mr: 1 }}>
                {props.editing ? (
                  <MdCancel color={iconColor} />
                ) : (
                  <AiFillEdit color={iconColor} />
                )}
              </IconButton>
            )}

            {user.biography ? (
              <Typography variant="body2" color="text.secondary">
                {user.biography}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                <i>No bio yet</i>
              </Typography>
            )}

            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={0.5} mt={1}>
                {user.skills.map((skill, i) => (
                  <Chip key={i} label={skill} size="small" variant="outlined" />
                ))}
              </Stack>
            )}

            {/* Social links */}
            {(user.socialLinks?.linkedin || user.socialLinks?.github) && (
              <HorizontalStack mt={1}>
                {user.socialLinks.linkedin && (
                  <Tooltip title="LinkedIn">
                    <IconButton
                      component={Link}
                      href={user.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener"
                      size="small"
                    >
                      <AiFillLinkedin size={20} color="#0077B5" />
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
                      <AiFillGithub size={20} />
                    </IconButton>
                  </Tooltip>
                )}
              </HorizontalStack>
            )}

            {/* Action buttons */}
            {!isOwnProfile && currentUser && (
              <HorizontalStack mt={1}>
                <Button
                  variant={isFollowing ? "outlined" : "contained"}
                  size="small"
                  onClick={props.handleFollow}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={props.handleMessage}
                >
                  Message
                </Button>
              </HorizontalStack>
            )}

            {props.editing && (
              <Box mt={1}>
                <ContentUpdateEditor
                  handleSubmit={props.handleSubmit}
                  originalContent={user.biography}
                  validate={props.validate}
                />
              </Box>
            )}
          </Box>
        </Stack>
      ) : (
        <>Loading...</>
      )}
    </Card>
  );
};

export default MobileProfile;
