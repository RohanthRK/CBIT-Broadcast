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
import { BsBoxSeam, BsPlusLg } from "react-icons/bs";
import { MdLocationOn, MdCalendarToday, MdCall, MdCheck, MdDelete } from "react-icons/md";
import { getLostFoundItems, createLostFoundItem, updateLostFoundItem, deleteLostFoundItem } from "../../api/lostFound";
import { isLoggedIn } from "../../helpers/authHelper";
import { BASE_URL } from "../../config";
import Footer from "../Footer";
import GridLayout from "../GridLayout";
import Loading from "../Loading";
import Navbar from "../Navbar";
import UserAvatar from "../UserAvatar";
import HorizontalStack from "../util/HorizontalStack";

const CATEGORIES = ["Electronics", "Documents", "Keys", "Wallets/Bags", "Clothing", "Other"];

const LostFoundCard = ({ item, onStatusChange, onDelete, onEdit }) => {
  const user = isLoggedIn();
  const isOwner = user && user.userId === item.reporter?._id;
  const isAdmin = user && user.isAdmin;
  const isResolved = item.status === "resolved";

  const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card
      sx={{
        p: 2,
        position: "relative",
        opacity: isResolved ? 0.7 : 1,
        backgroundColor: isResolved ? "action.hover" : "background.paper",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: isResolved ? 1 : 4 },
      }}
    >
      <Stack spacing={1.5}>
        <HorizontalStack justifyContent="space-between">
          <HorizontalStack spacing={1}>
            <UserAvatar width={32} height={32} username={item.reporter?.username} />
            <Typography variant="subtitle2" fontWeight="bold">
              {item.reporter?.username || "Unknown Student"}
            </Typography>
          </HorizontalStack>

          <Stack direction="row" spacing={0.5}>
            <Chip
              label={item.type.toUpperCase()}
              color={item.type === "lost" ? "error" : "success"}
              size="small"
              sx={{ fontWeight: "bold" }}
            />
            {isResolved && (
              <Chip
                label="RESOLVED"
                color="default"
                size="small"
                variant="filled"
                sx={{ fontWeight: "bold", bgcolor: "grey.500", color: "white" }}
              />
            )}
          </Stack>
        </HorizontalStack>

        {item.imageUrl && (
          <Box
            component="img"
            src={item.imageUrl.startsWith("http") ? item.imageUrl : BASE_URL + item.imageUrl.replace(/^\//, "")}
            alt={item.title}
            sx={{
              width: "100%",
              height: 180,
              objectFit: "cover",
              borderRadius: 1,
              mt: 1,
            }}
          />
        )}

        <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
          {item.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
          {item.description}
        </Typography>

        <Stack spacing={0.8} sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}>
          <HorizontalStack spacing={0.5}>
            <MdLocationOn color="grey" />
            <Typography variant="caption" color="text.secondary">
              <strong>Location:</strong> {item.location}
            </Typography>
          </HorizontalStack>

          <HorizontalStack spacing={0.5}>
            <MdCalendarToday color="grey" size={14} />
            <Typography variant="caption" color="text.secondary">
              <strong>Date:</strong> {formattedDate}
            </Typography>
          </HorizontalStack>

          {item.contactInfo && (
            <HorizontalStack spacing={0.5}>
              <MdCall color="grey" size={14} />
              <Typography variant="caption" color="text.secondary">
                <strong>Contact:</strong> {item.contactInfo}
              </Typography>
            </HorizontalStack>
          )}
        </Stack>

        {(isOwner || isAdmin) && (
          <HorizontalStack justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
            {!isResolved && isOwner && (
              <Button
                variant="outlined"
                size="small"
                color="success"
                startIcon={<MdCheck />}
                onClick={() => onStatusChange(item._id, "resolved")}
              >
                Mark Resolved
              </Button>
            )}
            {isResolved && isOwner && (
              <Button
                variant="outlined"
                size="small"
                color="info"
                onClick={() => onStatusChange(item._id, "open")}
              >
                Reopen
              </Button>
            )}
            {isOwner && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onEdit(item)}
              >
                Edit
              </Button>
            )}
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(item._id)}
            >
              <MdDelete />
            </IconButton>
          </HorizontalStack>
        )}
      </Stack>
    </Card>
  );
};

const LostFoundView = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("lost");
  const [itemCategory, setItemCategory] = useState("Other");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");

  const user = isLoggedIn();

  const fetchItems = async () => {
    setLoading(true);
    const query = {};
    if (search) query.search = search;
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;

    const data = await getLostFoundItems(user && user.token, query);
    setLoading(false);
    if (data && !data.error) {
      setItems(data);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, category, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleStatusChange = async (itemId, newStatus) => {
    const data = await updateLostFoundItem(itemId, { status: newStatus }, user);
    if (data && !data.error) {
      setItems(items.map((item) => (item._id === itemId ? data : item)));
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item post?")) {
      const data = await deleteLostFoundItem(itemId, user);
      if (data && !data.error) {
        setItems(items.filter((item) => item._id !== itemId));
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setItemType(item.type);
    setItemCategory(item.category || "Other");
    setLocation(item.location);
    const isoDate = new Date(item.date).toISOString().substring(0, 10);
    setDate(isoDate);
    setContactInfo(item.contactInfo || "");
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setItemType("lost");
    setItemCategory("Other");
    setLocation("");
    setDate("");
    setContactInfo("");
    setImageFile(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !description || !location || !date) {
      setError("Please fill out all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", itemType);
    formData.append("category", itemCategory);
    formData.append("location", location);
    formData.append("date", date);
    formData.append("contactInfo", contactInfo);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    let data;
    if (editingItem) {
      data = await updateLostFoundItem(editingItem._id, formData, user);
    } else {
      data = await createLostFoundItem(formData, user);
    }

    if (data && data.error) {
      setError(data.error);
    } else if (data) {
      if (editingItem) {
        setItems(items.map((item) => (item._id === editingItem._id ? data : item)));
      } else {
        setItems([data, ...items]);
      }
      setDialogOpen(false);
      setEditingItem(null);
      setTitle("");
      setDescription("");
      setItemType("lost");
      setItemCategory("Other");
      setLocation("");
      setDate("");
      setContactInfo("");
      setImageFile(null);
    }
  };

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
                  <BsBoxSeam size={24} />
                  <Typography variant="h5" fontWeight="bold">
                    Lost & Found Board
                  </Typography>
                </HorizontalStack>
                <Button
                  variant="contained"
                  startIcon={<BsPlusLg />}
                  onClick={() => setDialogOpen(true)}
                >
                  Report Item
                </Button>
              </HorizontalStack>
            </Card>

            {/* Filter card */}
            <Card sx={{ p: 2 }}>
              <Box component="form" onSubmit={handleSearchSubmit}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search title, desc, location..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={2.5}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        label="Type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                      >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="lost">Lost</MenuItem>
                        <MenuItem value="found">Found</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={2.5}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select
                        label="Category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {CATEGORIES.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={2.5}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={0.5}>
                    <Button variant="outlined" fullWidth type="submit">
                      Go
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Card>

            {/* Listings Grid */}
            {loading ? (
              <Loading />
            ) : items.length === 0 ? (
              <Card sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  No items listed matching your criteria.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {items.map((item) => (
                  <Grid item xs={12} sm={6} key={item._id}>
                    <LostFoundCard
                      item={item}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Stack>
        }
        right={
          <Stack spacing={2}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                About Lost & Found Board
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lose something in class, canteen, or sports fields? Post it here so your peers can help locate it. 
                If you find a lost item, report it as "Found" and note where it can be collected (like the department office or security desk).
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
          <DialogTitle fontWeight="bold">{editingItem ? "Edit Report" : "Report Lost or Found Item"}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              {error && (
                <Typography color="error" variant="body2" align="center">
                  {error}
                </Typography>
              )}
              <TextField
                label="Item Name / Title"
                placeholder="e.g. Lost Black Leather Wallet"
                required
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextField
                label="Description"
                placeholder="Describe details (brand, color, unique marks, contents)..."
                required
                multiline
                rows={3}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Type</InputLabel>
                    <Select
                      label="Type"
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                    >
                      <MenuItem value="lost">Lost</MenuItem>
                      <MenuItem value="found">Found</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      label="Category"
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                    >
                      {CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <TextField
                label="Location Lost/Found"
                placeholder="e.g. Canteen block, 2nd floor library"
                required
                fullWidth
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <TextField
                label="Date Lost/Found"
                type="date"
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <TextField
                label="Contact / Retrieval Info"
                placeholder="e.g. Call 98765xxxxx or pick up from CSE HOD Room"
                fullWidth
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
              />
              <Button variant="outlined" component="label" fullWidth>
                Upload Item Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </Button>
              {imageFile && (
                <Typography variant="caption" color="success.main" textAlign="center">
                  Selected File: {imageFile.name}
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" type="submit">
              {editingItem ? "Save Changes" : "Submit Report"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
};

export default LostFoundView;
