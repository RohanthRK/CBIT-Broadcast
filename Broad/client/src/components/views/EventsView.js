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
import { BsCalendarEvent, BsPlusLg } from "react-icons/bs";
import { MdLocationOn, MdAccessTime, MdDelete, MdPeople } from "react-icons/md";
import { getEvents, createEvent, rsvpEvent, updateEvent, deleteEvent } from "../../api/events";
import { isLoggedIn } from "../../helpers/authHelper";
import { BASE_URL } from "../../config";
import Footer from "../Footer";
import GridLayout from "../GridLayout";
import Loading from "../Loading";
import Navbar from "../Navbar";
import UserAvatar from "../UserAvatar";
import HorizontalStack from "../util/HorizontalStack";

const DEPARTMENTS = ["All", "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "BIOTECH", "AIDS", "CSD", "MCA"];

const formatDateTimeLocal = (dateStr) => {
  const d = new Date(dateStr);
  const pad = (num) => String(num).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const CalendarWidget = ({ events, selectedDate, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const namesOfMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ day: null, dateKey: null });
  }
  for (let d = 1; d <= totalDays; d++) {
    const dObj = new Date(year, month, d);
    cells.push({
      day: d,
      dateObj: dObj,
      dateKey: dObj.toDateString(),
    });
  }

  const hasEventOnDay = (dateObj) => {
    if (!dateObj) return false;
    return events.some((event) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      const dDate = new Date(dateObj);
      dDate.setHours(0, 0, 0, 0);
      const sDate = new Date(start);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(end);
      eDate.setHours(0, 0, 0, 0);
      return dDate >= sDate && dDate <= eDate;
    });
  };

  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <HorizontalStack justifyContent="space-between" alignItems="center">
          <IconButton size="small" onClick={handlePrevMonth}>
            &lt;
          </IconButton>
          <Typography variant="subtitle2" fontWeight="bold">
            {namesOfMonths[month]} {year}
          </Typography>
          <IconButton size="small" onClick={handleNextMonth}>
            &gt;
          </IconButton>
        </HorizontalStack>

        <Grid container spacing={0.5} columns={7}>
          {daysOfWeek.map((day) => (
            <Grid item xs={1} key={day} sx={{ textAlign: "center" }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                {day}
              </Typography>
            </Grid>
          ))}

          {cells.map((cell, idx) => {
            if (!cell.day) {
              return <Grid item xs={1} key={`pad-${idx}`} />;
            }

            const isToday = today.toDateString() === cell.dateKey;
            const isSelected = selectedDate && selectedDate.toDateString() === cell.dateKey;
            const hasEvent = hasEventOnDay(cell.dateObj);

            return (
              <Grid item xs={1} key={cell.dateKey} sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  onClick={() => onSelectDate(cell.dateObj)}
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative",
                    backgroundColor: isSelected
                      ? "primary.main"
                      : isToday
                      ? "action.selected"
                      : "transparent",
                    color: isSelected ? "primary.contrastText" : "text.primary",
                    "&:hover": {
                      backgroundColor: isSelected ? "primary.dark" : "action.hover",
                    },
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: isToday || isSelected ? "bold" : "normal" }}>
                    {cell.day}
                  </Typography>
                  {hasEvent && (
                    <Box
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        backgroundColor: isSelected ? "primary.contrastText" : "primary.main",
                        position: "absolute",
                        bottom: 3,
                      }}
                    />
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </Card>
  );
};

const EventCard = ({ event, onRSVP, onDelete, onEdit }) => {
  const user = isLoggedIn();
  const isCreator = user && user.userId === event.creator?._id;
  const isAdmin = user && user.isAdmin;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRSVPClick = (status) => {
    const nextStatus = event.userRSVPStatus === status ? "" : status;
    onRSVP(event._id, nextStatus);
  };

  return (
    <Card sx={{ p: 2, transition: "box-shadow 0.2s", "&:hover": { boxShadow: 4 } }}>
      <Stack spacing={1.5}>
        <HorizontalStack justifyContent="space-between">
          <HorizontalStack spacing={1}>
            <UserAvatar width={28} height={28} username={event.creator?.username} />
            <Typography variant="subtitle2" fontWeight="bold">
              {event.creator?.username || "Unknown Club/Organizer"}
            </Typography>
          </HorizontalStack>
          <Chip label={event.department} color="secondary" size="small" variant="outlined" />
        </HorizontalStack>

        {event.imageUrl && (
          <Box
            component="img"
            src={event.imageUrl.startsWith("http") ? event.imageUrl : BASE_URL + event.imageUrl.replace(/^\//, "")}
            alt={event.title}
            sx={{
              width: "100%",
              height: 200,
              objectFit: "cover",
              borderRadius: 1,
            }}
          />
        )}

        <Box>
          <Typography variant="h6" fontWeight="bold">
            {event.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-line" }}>
            {event.description}
          </Typography>
        </Box>

        <Stack spacing={0.8} sx={{ py: 1, borderTop: 1, borderColor: "divider" }}>
          <HorizontalStack spacing={0.5}>
            <MdLocationOn color="grey" />
            <Typography variant="caption" color="text.secondary">
              <strong>Venue / Link:</strong> {event.location}
            </Typography>
          </HorizontalStack>

          <HorizontalStack spacing={0.5}>
            <MdAccessTime color="grey" size={14} />
            <Typography variant="caption" color="text.secondary">
              <strong>Starts:</strong> {formatDate(event.startDate)}
            </Typography>
          </HorizontalStack>

          <HorizontalStack spacing={0.5}>
            <MdAccessTime color="grey" size={14} />
            <Typography variant="caption" color="text.secondary">
              <strong>Ends:</strong> {formatDate(event.endDate)}
            </Typography>
          </HorizontalStack>

          <HorizontalStack spacing={0.5}>
            <MdPeople color="grey" size={14} />
            <Typography variant="caption" color="text.secondary">
              <strong>RSVPs:</strong> {event.attendingCount} attending, {event.interestedCount} interested
            </Typography>
          </HorizontalStack>
        </Stack>

        <HorizontalStack justifyContent="space-between" sx={{ pt: 1 }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant={event.userRSVPStatus === "attending" ? "contained" : "outlined"}
              size="small"
              color="success"
              onClick={() => handleRSVPClick("attending")}
            >
              Attending
            </Button>
            <Button
              variant={event.userRSVPStatus === "interested" ? "contained" : "outlined"}
              size="small"
              color="info"
              onClick={() => handleRSVPClick("interested")}
            >
              Interested
            </Button>
          </Stack>

          {(isCreator || isAdmin) && (
            <HorizontalStack spacing={0.5}>
              {isCreator && (
                <Button variant="outlined" size="small" onClick={() => onEdit(event)}>
                  Edit
                </Button>
              )}
              <IconButton size="small" color="error" onClick={() => onDelete(event._id)}>
                <MdDelete />
              </IconButton>
            </HorizontalStack>
          )}
        </HorizontalStack>
      </Stack>
    </Card>
  );
};

const EventsView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState("All");
  const [timeframe, setTimeframe] = useState("upcoming");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventDept, setEventDept] = useState("All");
  const [bannerFile, setBannerFile] = useState(null);
  const [error, setError] = useState("");

  const user = isLoggedIn();

  const fetchEvents = async () => {
    setLoading(true);
    const query = {};
    if (department && department !== "All") query.department = department;
    if (timeframe) query.timeframe = timeframe;

    const data = await getEvents(user && user.token, query);
    setLoading(false);
    if (data && !data.error) {
      setEvents(data);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, timeframe]);

  const handleRSVP = async (eventId, status) => {
    const data = await rsvpEvent(eventId, status, user);
    if (data && !data.error) {
      setEvents(
        events.map((evt) =>
          evt._id === eventId
            ? {
                ...evt,
                attendingCount: data.attendingCount,
                interestedCount: data.interestedCount,
                userRSVPStatus: data.userRSVPStatus,
              }
            : evt
        )
      );
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      const data = await deleteEvent(eventId, user);
      if (data && !data.error) {
        setEvents(events.filter((evt) => evt._id !== eventId));
      }
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setLocation(event.location);
    setStartDate(formatDateTimeLocal(event.startDate));
    setEndDate(formatDateTimeLocal(event.endDate));
    setEventDept(event.department);
    setBannerFile(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setEventDept("All");
    setBannerFile(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !description || !location || !startDate || !endDate) {
      setError("Please fill out all required fields.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("department", eventDept);
    if (bannerFile) {
      formData.append("banner", bannerFile);
    }

    let data;
    if (editingEvent) {
      data = await updateEvent(editingEvent._id, formData, user);
    } else {
      data = await createEvent(formData, user);
    }

    if (data && data.error) {
      setError(data.error);
    } else if (data) {
      if (editingEvent) {
        setEvents(
          events
            .map((evt) => (evt._id === editingEvent._id ? data : evt))
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        );
      } else {
        setEvents([...events, data].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)));
      }
      setDialogOpen(false);
      setEditingEvent(null);
      setTitle("");
      setDescription("");
      setLocation("");
      setStartDate("");
      setEndDate("");
      setEventDept("All");
      setBannerFile(null);
    }
  };

  const handleSelectCalendarDate = (date) => {
    if (selectedCalendarDate && selectedCalendarDate.toDateString() === date.toDateString()) {
      setSelectedCalendarDate(null);
    } else {
      setSelectedCalendarDate(date);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!selectedCalendarDate) return true;
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const dDate = new Date(selectedCalendarDate);
    dDate.setHours(0, 0, 0, 0);
    const sDate = new Date(start);
    sDate.setHours(0, 0, 0, 0);
    const eDate = new Date(end);
    eDate.setHours(0, 0, 0, 0);
    return dDate >= sDate && dDate <= eDate;
  });

  return (
    <Container>
      <Navbar />

      <GridLayout
        left={
          <Stack spacing={3}>
            {/* Header board */}
            <Card sx={{ p: 2 }}>
              <HorizontalStack justifyContent="space-between">
                <HorizontalStack spacing={1}>
                  <BsCalendarEvent size={24} />
                  <Typography variant="h5" fontWeight="bold">
                    Events & RSVP Calendar
                  </Typography>
                </HorizontalStack>
                <Button variant="contained" startIcon={<BsPlusLg />} onClick={() => setDialogOpen(true)}>
                  Create Event
                </Button>
              </HorizontalStack>
            </Card>

            {/* Filters */}
            <Card sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} sm={4}>
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
                <Grid item xs={6} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Timing</InputLabel>
                    <Select
                      label="Timing"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                    >
                      <MenuItem value="upcoming">Upcoming Events</MenuItem>
                      <MenuItem value="past">Past Events</MenuItem>
                      <MenuItem value="">All Events</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                  </Typography>
                </Grid>
              </Grid>
            </Card>

            {/* Events Grid */}
            {loading ? (
              <Loading />
            ) : filteredEvents.length === 0 ? (
              <Card sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  No college events found for the chosen filters.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {filteredEvents.map((evt) => (
                  <Grid item xs={12} sm={6} key={evt._id}>
                    <EventCard event={evt} onRSVP={handleRSVP} onDelete={handleDelete} onEdit={handleEdit} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Stack>
        }
        right={
          <Stack spacing={2}>
            <CalendarWidget
              events={events}
              selectedDate={selectedCalendarDate}
              onSelectDate={handleSelectCalendarDate}
            />

            {selectedCalendarDate && (
              <Card sx={{ p: 1.5, bgcolor: "action.hover" }}>
                <HorizontalStack justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight="bold">
                    Filtering: {selectedCalendarDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Typography>
                  <Button size="small" variant="text" onClick={() => setSelectedCalendarDate(null)}>
                    Clear Filter
                  </Button>
                </HorizontalStack>
              </Card>
            )}

            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Events & RSVP
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Keep track of tech fests, placement drives, club activities, guest lectures, sports fests, and workshops around CBIT.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submit an RSVP card so organizers can keep an eye on attendance levels and coordinate venue spaces properly.
              </Typography>
            </Card>
            <Footer />
          </Stack>
        }
      />

      {/* Create / Edit Event Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleFormSubmit}>
          <DialogTitle fontWeight="bold">{editingEvent ? "Edit College Event" : "Create College Event"}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              {error && (
                <Typography color="error" variant="body2" align="center">
                  {error}
                </Typography>
              )}
              <TextField
                label="Event Title"
                placeholder="e.g. Sudhee Tech Fest 2026, Hackathon Kickoff"
                required
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextField
                label="Location / Link"
                placeholder="e.g. Assembly Hall, Seminar Room 3, or online Zoom URL"
                required
                fullWidth
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <TextField
                label="Description"
                placeholder="Details about scheduling, speaker profiles, guidelines, cash prizes, registration steps..."
                required
                multiline
                rows={4}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Start Date & Time"
                    type="datetime-local"
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Date & Time"
                    type="datetime-local"
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Grid>
              </Grid>
              <FormControl fullWidth required>
                <InputLabel>Target Department</InputLabel>
                <Select
                  label="Target Department"
                  value={eventDept}
                  onChange={(e) => setEventDept(e.target.value)}
                >
                  {DEPARTMENTS.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" component="label" fullWidth>
                Upload Event Banner / Poster {editingEvent ? "(Optional)" : ""}
                <input type="file" accept="image/*" hidden onChange={(e) => setBannerFile(e.target.files[0])} />
              </Button>
              {bannerFile && (
                <Typography variant="caption" color="success.main" textAlign="center">
                  Selected File: {bannerFile.name}
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" type="submit">
              {editingEvent ? "Save Changes" : "Publish Event"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
};

export default EventsView;
