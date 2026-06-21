import {
  Card,
  Chip,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";
import { AiFillCheckCircle, AiFillEdit, AiFillMessage, AiOutlineFlag } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { deletePost, likePost, unlikePost, updatePost, votePoll } from "../api/posts";
import { createReport } from "../api/admin";
import { BASE_URL } from "../config";
import { bookmarkPost, unbookmarkPost } from "../api/bookmarks";
import { isLoggedIn } from "../helpers/authHelper";
import ContentDetails from "./ContentDetails";

import LikeBox from "./LikeBox";
import PostContentBox from "./PostContentBox";
import HorizontalStack from "./util/HorizontalStack";

import {} from "react-icons/ai";
import ContentUpdateEditor from "./ContentUpdateEditor";
import Markdown from "./Markdown";

import "./postCard.css";
import { MdCancel } from "react-icons/md";
import { BiTrash } from "react-icons/bi";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";

const POST_CATEGORIES = [
  "General",
  "Academics",
  "Events",
  "Placements",
  "Sports",
  "Exam Cell",
  "Clubs",
];

const PostCard = (props) => {
  const { preview, removePost } = props;
  let postData = props.post;
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = isLoggedIn();
  const isAuthor = user && user.username === postData.poster.username;

  const theme = useTheme();
  const iconColor = theme.palette.primary.main;

  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [post, setPost] = useState(postData);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [editCategory, setEditCategory] = useState(post.category || "General");
  const [bookmarked, setBookmarked] = useState(post.bookmarked || false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [voting, setVoting] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handleVote = async (optionIdsToVote = selectedOptions) => {
    if (!user || optionIdsToVote.length === 0) return;
    setVoting(true);
    const res = await votePoll(post._id, optionIdsToVote, user);
    if (res && res.success) {
      const updatedPost = { ...post };
      
      if (updatedPost.poll.votedOptions) {
        updatedPost.poll.votedOptions.forEach(oldId => {
          const opt = updatedPost.poll.options.find(o => o._id === oldId);
          if (opt && opt.votes > 0) opt.votes -= 1;
        });
      }

      optionIdsToVote.forEach(newId => {
        const opt = updatedPost.poll.options.find(o => o._id === newId);
        if (opt) opt.votes += 1;
      });

      updatedPost.poll.votedOptions = optionIdsToVote;
      setPost(updatedPost);
      setSelectedOptions([]);
    }
    setVoting(false);
  };

  const handleOptionToggle = (optionId) => {
    if (post.poll.multipleChoice) {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleChangeVote = (e) => {
    e.stopPropagation();
    const updatedPost = { ...post };
    updatedPost.poll.votedOptions = null;
    setPost(updatedPost);
  };

  const submitReport = async () => {
    if (!reportReason) return;
    await createReport(post._id, reportReason, user);
    setReportOpen(false);
    setReportReason("");
    alert("Post reported successfully.");
  };

  let maxHeight = null;
  if (preview === "primary") {
    maxHeight = 250;
  }

  const handleDeletePost = async (e) => {
    e.stopPropagation();

    if (!confirm) {
      setConfirm(true);
    } else {
      setLoading(true);
      await deletePost(post._id, isLoggedIn());
      setLoading(false);
      if (preview) {
        removePost(post);
      } else {
        navigate("/");
      }
    }
  };

  const handleEditPost = async (e) => {
    e.stopPropagation();

    setEditing(!editing);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const content = e.target.content.value;
    await updatePost(post._id, isLoggedIn(), { content, category: editCategory });
    setPost({ ...post, content, category: editCategory, edited: true });
    setEditing(false);
  };

  const handleLike = async (liked) => {
    if (liked) {
      setLikeCount(likeCount + 1);
      await likePost(post._id, user);
    } else {
      setLikeCount(likeCount - 1);
      await unlikePost(post._id, user);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) return;
    if (bookmarked) {
      setBookmarked(false);
      await unbookmarkPost(post._id, user);
    } else {
      setBookmarked(true);
      await bookmarkPost(post._id, user);
    }
  };

  return (
    <Card sx={{ padding: 0 }} className="post-card">
      <Box className={preview}>
        <HorizontalStack spacing={0} alignItems="initial">
          <Stack
            justifyContent="space-between "
            alignItems="center"
            spacing={1}
            sx={{
              backgroundColor: "grey.100",
              width: "50px",
              padding: theme.spacing(1),
            }}
          >
            <LikeBox
              likeCount={likeCount}
              liked={post.liked}
              onLike={handleLike}
            />
          </Stack>
          <PostContentBox clickable={preview} post={post} editing={editing}>
            <HorizontalStack justifyContent="space-between">
              <ContentDetails
                username={post.poster.username}
                createdAt={post.createdAt}
                edited={post.edited}
                preview={preview === "secondary"}
              />
              <Box>
                {user && preview !== "secondary" && (
                  <HorizontalStack>
                    {!isAuthor && (
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setReportOpen(true); }}>
                        <AiOutlineFlag color={theme.palette.text.secondary} />
                      </IconButton>
                    )}
                    {(isAuthor || user.isAdmin) && (
                      <>
                        <IconButton
                          disabled={loading}
                          size="small"
                          onClick={handleEditPost}
                        >
                          {editing ? (
                            <MdCancel color={iconColor} />
                          ) : (
                            <AiFillEdit color={iconColor} />
                          )}
                        </IconButton>
                        <IconButton
                          disabled={loading}
                          size="small"
                          onClick={handleDeletePost}
                        >
                          {confirm ? (
                            <AiFillCheckCircle color={theme.palette.error.main} />
                          ) : (
                            <BiTrash color={theme.palette.error.main} />
                          )}
                        </IconButton>
                      </>
                    )}
                  </HorizontalStack>
                )}
              </Box>
            </HorizontalStack>

            <Typography
              variant="h5"
              gutterBottom
              sx={{ overflow: "hidden", mt: 1, maxHeight: 125 }}
              className="title"
            >
              {post.title}
            </Typography>

            {preview !== "secondary" &&
              (editing ? (
                <>
                  <HorizontalStack spacing={1} sx={{ mt: 1, mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category:
                    </Typography>
                    <Select
                      size="small"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      sx={{ minWidth: 130 }}
                    >
                      {POST_CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </HorizontalStack>
                  <ContentUpdateEditor
                    handleSubmit={handleSubmit}
                    originalContent={post.content}
                  />
                </>
              ) : (
                <>
                  <Box
                    maxHeight={maxHeight}
                    overflow="hidden"
                    className="content"
                  >
                    <Markdown content={post.content} />
                  </Box>

                  {(() => {
                    const images = post.attachments ? post.attachments.filter(a => a.type === "image") : [];
                    const documents = post.attachments ? post.attachments.filter(a => a.type === "document") : [];

                    // Fallback to legacy single attachments if post.attachments is empty
                    if (images.length === 0 && documents.length === 0 && post.attachmentUrl) {
                      if (post.attachmentType === "image") {
                        images.push({ url: post.attachmentUrl, type: "image" });
                      } else if (post.attachmentType === "document") {
                        documents.push({ url: post.attachmentUrl, type: "document" });
                      }
                    }

                    if (preview === "primary") {
                      // Grid or Carousel layout on the feed
                      return (
                        <Box mt={1} onClick={e => e.stopPropagation()}>
                          {images.length > 0 && (
                            post.attachmentLayout === "carousel" ? (
                              // Carousel Slider Layout
                              <Box sx={{ position: "relative", width: "100%", height: "350px", borderRadius: "8px", overflow: "hidden" }}>
                                <img
                                  src={BASE_URL.slice(0, -1) + (images[carouselIndex] || images[0]).url}
                                  alt="carousel-attachment"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                {images.length > 1 && (
                                  <>
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCarouselIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                                      }}
                                      sx={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "8px",
                                        transform: "translateY(-50%)",
                                        backgroundColor: "rgba(0,0,0,0.5)",
                                        color: "#fff",
                                        "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" }
                                      }}
                                    >
                                      &lt;
                                    </IconButton>
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCarouselIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                                      }}
                                      sx={{
                                        position: "absolute",
                                        top: "50%",
                                        right: "8px",
                                        transform: "translateY(-50%)",
                                        backgroundColor: "rgba(0,0,0,0.5)",
                                        color: "#fff",
                                        "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" }
                                      }}
                                    >
                                      &gt;
                                    </IconButton>
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        bottom: "12px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        display: "flex",
                                        gap: "6px"
                                      }}
                                    >
                                      {images.map((_, idx) => (
                                        <Box
                                          key={idx}
                                          sx={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            backgroundColor: idx === carouselIndex ? "#fff" : "rgba(255,255,255,0.5)",
                                            transition: "all 0.2s"
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </>
                                )}
                              </Box>
                            ) : (
                              // Grid Collage Layout
                              images.length === 1 ? (
                                <img
                                  src={BASE_URL.slice(0, -1) + images[0].url}
                                  alt="attachment-0"
                                  style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "8px" }}
                                />
                              ) : images.length === 2 ? (
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                                  {images.map((img, idx) => (
                                    <img
                                      key={idx}
                                      src={BASE_URL.slice(0, -1) + img.url}
                                      alt={`attachment-${idx}`}
                                      style={{ width: "100%", height: "250px", objectFit: "cover", borderRadius: "8px" }}
                                    />
                                  ))}
                                </Box>
                              ) : images.length === 3 ? (
                                <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr", gap: "6px", height: "300px" }}>
                                  <Box sx={{ gridRow: "span 2", height: "100%" }}>
                                    <img
                                      src={BASE_URL.slice(0, -1) + images[0].url}
                                      alt="attachment-0"
                                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                                    />
                                  </Box>
                                  <Box sx={{ height: "147px" }}>
                                    <img
                                      src={BASE_URL.slice(0, -1) + images[1].url}
                                      alt="attachment-1"
                                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                                    />
                                  </Box>
                                  <Box sx={{ height: "147px" }}>
                                    <img
                                      src={BASE_URL.slice(0, -1) + images[2].url}
                                      alt="attachment-2"
                                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                                    />
                                  </Box>
                                </Box>
                              ) : (
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "6px", height: "300px" }}>
                                  {images.slice(0, 4).map((img, idx) => {
                                    const isLast = idx === 3;
                                    const extraCount = images.length - 4;
                                    return (
                                      <Box key={idx} sx={{ position: "relative", height: "147px" }}>
                                        <img
                                          src={BASE_URL.slice(0, -1) + img.url}
                                          alt={`attachment-${idx}`}
                                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                                        />
                                        {isLast && extraCount > 0 && (
                                          <Box
                                            sx={{
                                              position: "absolute",
                                              top: 0,
                                              left: 0,
                                              width: "100%",
                                              height: "100%",
                                              backgroundColor: "rgba(0,0,0,0.6)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              color: "#fff",
                                              borderRadius: "8px",
                                              fontWeight: "bold",
                                              fontSize: "1.5rem"
                                            }}
                                          >
                                            +{extraCount} more
                                          </Box>
                                        )}
                                      </Box>
                                    );
                                  })}
                                </Box>
                              )
                            )
                          )}
                          
                          {/* Documents list */}
                          {documents.length > 0 && (
                            <Stack spacing={1} mt={1}>
                              {documents.map((doc, idx) => (
                                <Button
                                  key={idx}
                                  variant="outlined"
                                  size="small"
                                  href={BASE_URL.slice(0, -1) + doc.url}
                                  target="_blank"
                                  sx={{ alignSelf: "flex-start" }}
                                >
                                  View Attached Document ({idx + 1})
                                </Button>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      );
                    } else {
                      // Detail single post view or any other view - render list top to bottom
                      return (
                        <Stack spacing={2} mt={1}>
                          {images.map((img, idx) => (
                            <img
                              key={idx}
                              src={BASE_URL.slice(0, -1) + img.url}
                              alt={`attachment-${idx}`}
                              style={{ width: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "8px" }}
                            />
                          ))}
                          {documents.map((doc, idx) => (
                            <Button
                              key={idx}
                              variant="outlined"
                              size="small"
                              href={BASE_URL.slice(0, -1) + doc.url}
                              target="_blank"
                              sx={{ alignSelf: "flex-start" }}
                            >
                              View Attached Document ({idx + 1})
                            </Button>
                          ))}
                        </Stack>
                      );
                    }
                  })()}

                  {post.poll && post.poll.options && post.poll.options.length > 0 && (
                    <Box mt={2} p={2} border={1} borderColor="grey.300" borderRadius={2} onClick={e => e.stopPropagation()}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>{post.poll.question}</Typography>
                      
                      {(() => {
                        const hasVoted = post.poll.votedOptions && post.poll.votedOptions.length > 0;
                        const showResults = post.poll.showPercentages === "always" || 
                                            (post.poll.showPercentages === "voted" && hasVoted);
                        const hideResults = post.poll.showPercentages === "never";

                        return (
                          <>
                            {post.poll.options.map(opt => {
                              const totalVotes = post.poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                              const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                              const isSelected = hasVoted ? post.poll.votedOptions.includes(opt._id) : selectedOptions.includes(opt._id);

                              return (
                                <Box key={opt._id} mb={1}>
                                  {hasVoted ? (
                                    <Box>
                                      <HorizontalStack justifyContent="space-between">
                                        <Typography variant="body2" fontWeight={isSelected ? "bold" : "normal"}>
                                          {opt.text} {isSelected && "(Your Vote)"}
                                        </Typography>
                                        {!hideResults && showResults && (
                                          <Typography variant="body2">{percent}% ({opt.votes})</Typography>
                                        )}
                                      </HorizontalStack>
                                      {!hideResults && showResults && (
                                        <LinearProgress variant="determinate" value={percent} sx={{ height: 10, borderRadius: 5, mt: 0.5 }} />
                                      )}
                                    </Box>
                                  ) : (
                                    post.poll.multipleChoice ? (
                                      <FormControlLabel
                                        control={<Checkbox checked={isSelected} onChange={() => handleOptionToggle(opt._id)} />}
                                        label={opt.text}
                                        sx={{ width: '100%' }}
                                      />
                                    ) : (
                                      <Button variant={isSelected ? "contained" : "outlined"} fullWidth onClick={() => handleOptionToggle(opt._id)} sx={{ justifyContent: "flex-start", textAlign: "left" }}>
                                        {opt.text}
                                      </Button>
                                    )
                                  )}
                                </Box>
                              );
                            })}

                            {!hasVoted && (
                              <Button variant="contained" disabled={selectedOptions.length === 0 || voting} onClick={(e) => { e.stopPropagation(); handleVote(); }} sx={{ mt: 1 }}>
                                Submit Vote
                              </Button>
                            )}

                            {hasVoted && post.poll.allowEditVote && (
                              <Button variant="text" size="small" onClick={handleChangeVote} sx={{ mt: 1 }}>
                                Change Vote
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </Box>
                  )}
                </>
              ))}

            <HorizontalStack sx={{ mt: 1 }} justifyContent="space-between">
              <HorizontalStack>
                <AiFillMessage />
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  {post.commentCount}
                </Typography>
              </HorizontalStack>
              <HorizontalStack>
                {post.category && (
                  <Chip
                    label={post.category}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
                {user && (
                  <Tooltip title={bookmarked ? "Remove bookmark" : "Bookmark"}>
                    <IconButton size="small" onClick={handleBookmark}>
                      {bookmarked ? (
                        <BsBookmarkFill color={iconColor} />
                      ) : (
                        <BsBookmark />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
              </HorizontalStack>
            </HorizontalStack>
          </PostContentBox>
        </HorizontalStack>
      </Box>
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} onClick={(e) => e.stopPropagation()}>
        <DialogTitle>Report Post</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for reporting"
            fullWidth
            variant="outlined"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)}>Cancel</Button>
          <Button onClick={submitReport} color="error" variant="contained">Submit Report</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default PostCard;
