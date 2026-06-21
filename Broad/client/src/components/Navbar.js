import { useTheme } from "@emotion/react";
import {
  Badge,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Stack,
  TextField,
  Typography,
  Button,
  Tooltip,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useRef, useState } from "react";
import "react-icons/ai";
import "react-icons/ri";
import {
  AiFillFileText,
  AiFillRobot,
  AiFillHome,
  AiFillMessage,
  AiOutlineSearch,
  AiFillBell,
} from "react-icons/ai";
import { MdPeople } from "react-icons/md";
import { BsBoxSeam, BsCalendarEvent } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, logoutUser } from "../helpers/authHelper";
import { getNotifications, markNotificationsRead } from "../api/notifications";
import { getUnreadMessagesCount } from "../api/messages";
import { socket } from "../helpers/socketHelper";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";

import Moment from "react-moment";

const getNotificationMessage = (notification) => {
  const sender = notification.sender?.username || "Someone";
  switch (notification.type) {
    case "like":
      return `${sender} liked your post`;
    case "comment":
      return `${sender} commented on your post`;
    case "follow":
      return `${sender} started following you`;
    default:
      return "You have a new notification";
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const user = isLoggedIn();
  const theme = useTheme();
  const username = user && isLoggedIn().username;
  const [search, setSearch] = useState("");
  const [searchIcon, setSearchIcon] = useState(false);
  const [width, setWindowWidth] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const notificationsRef = useRef([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  });

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadMessages();

      const handleMessagesRead = () => {
        fetchUnreadMessages();
      };
      window.addEventListener("messages-read", handleMessagesRead);
      return () => {
        window.removeEventListener("messages-read", handleMessagesRead);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUnreadMessages = async () => {
    const data = await getUnreadMessagesCount(user);
    if (data && data.count !== undefined) {
      setUnreadMsgCount(data.count);
    }
  };

  useEffect(() => {
    if (user) {
      socket.on("receive-notification", (notification) => {
        setNotifications([notification, ...notificationsRef.current]);
        setUnreadCount((prev) => prev + 1);
      });
    }
    return () => {
      socket.off("receive-notification");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    const data = await getNotifications(user);
    if (data && !data.error) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    }
  };

  const handleOpenNotifications = (e) => {
    setAnchorEl(e.currentTarget);
    setUnreadCount(0);
    if (user) {
      markNotificationsRead(user);
    }
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  const mobile = width < 500;
  const navbarWidth = width < 600;

  const updateDimensions = () => {
    const width = window.innerWidth;
    setWindowWidth(width);
  };

  const handleLogout = async (e) => {
    logoutUser();
    navigate("/login");
  };

  const handleChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/search?" + new URLSearchParams({ search }));
  };

  const handleSearchIcon = (e) => {
    setSearchIcon(!searchIcon);
  };

  const notifOpen = Boolean(anchorEl);

  return (
    <Stack mb={2}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          pt: 2,
          pb: 0,
        }}
        spacing={!mobile ? 2 : 0}
      >
        <HorizontalStack>
          <AiFillRobot
            size={33}
            color={theme.palette.primary.main}
            onClick={() => navigate("/")}
          />
          <Typography
            sx={{ display: mobile ? "none" : "block" }}
            variant={navbarWidth ? "h6" : "h4"}
            mr={1}
            color={theme.palette.primary.main}
          >
            {/* <Link to="/" color="inherit"> */}
              CBIT Broadcast
            {/* </Link> */}
          </Typography>
        </HorizontalStack>

        {!navbarWidth && (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              size="small"
              label="Search for posts..."
              sx={{ flexGrow: 1, maxWidth: 300 }}
              onChange={handleChange}
              value={search}
            />
          </Box>
        )}

        <HorizontalStack>
          {mobile && (
            <IconButton onClick={handleSearchIcon}>
              <AiOutlineSearch />
            </IconButton>
          )}

          <Tooltip title="Home">
            <IconButton component={Link} to={"/"}>
              <AiFillHome />
            </IconButton>
          </Tooltip>
          {user ? (
            <>
              <Tooltip title="Study Resources">
                <IconButton component={Link} to={"/resources"}>
                  <AiFillFileText />
                </IconButton>
              </Tooltip>
              <Tooltip title="Lost & Found Board">
                <IconButton component={Link} to={"/lost-found"}>
                  <BsBoxSeam />
                </IconButton>
              </Tooltip>
              <Tooltip title="Events Calendar">
                <IconButton component={Link} to={"/events"}>
                  <BsCalendarEvent />
                </IconButton>
              </Tooltip>
              <Tooltip title="Messenger">
                <IconButton component={Link} to={"/messenger"}>
                  <Badge badgeContent={unreadMsgCount} color="error">
                    <AiFillMessage />
                  </Badge>
                </IconButton>
              </Tooltip>

              {user && user.isAdmin && (
                <Button component={Link} to="/admin" variant="text" color="inherit">
                  Admin
                </Button>
              )}
              <Tooltip title="User Directory">
                <IconButton component={Link} to={"/directory"}>
                  <MdPeople />
                </IconButton>
              </Tooltip>

              <IconButton onClick={handleOpenNotifications}>
                <Badge badgeContent={unreadCount} color="error">
                  <AiFillBell />
                </Badge>
              </IconButton>

              <Popover
                open={notifOpen}
                anchorEl={anchorEl}
                onClose={handleCloseNotifications}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box sx={{ width: 320, maxHeight: 400, overflowY: "auto" }}>
                  <Typography variant="subtitle1" sx={{ px: 2, pt: 1.5, fontWeight: "bold" }}>
                    Notifications
                  </Typography>
                  <Divider />
                  {notifications.length === 0 ? (
                    <Typography
                      color="text.secondary"
                      variant="body2"
                      sx={{ p: 2 }}
                    >
                      No notifications yet
                    </Typography>
                  ) : (
                    <List dense disablePadding>
                      {notifications.map((n, i) => (
                        <React.Fragment key={i}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{
                              backgroundColor: n.isRead ? "transparent" : "action.hover",
                            }}
                          >
                            <ListItemText
                              primary={getNotificationMessage(n)}
                              secondary={
                                <Moment fromNow>{n.createdAt}</Moment>
                              }
                            />
                          </ListItem>
                          {i < notifications.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Box>
              </Popover>

              <IconButton component={Link}  to={"/users/" + username}>
                <UserAvatar width={30} height={30} username={user.username} />
              </IconButton>
              <Button onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="text" sx={{ minWidth: 80 }} href="/signup">
                Sign Up
              </Button>
              <Button variant="text" sx={{ minWidth: 65 }} href="/login">
                Login
              </Button>
            </>
          )}
        </HorizontalStack>
      </Stack>
      {navbarWidth && searchIcon && (
        <Box component="form" onSubmit={handleSubmit} mt={2}>
          <TextField
            size="small"
            label="Search for posts..."
            fullWidth
            onChange={handleChange}
            value={search}
          />
        </Box>
      )}
    </Stack>
  );
};

export default Navbar;
