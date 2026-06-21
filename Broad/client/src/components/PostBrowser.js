import {
  Button,
  Card,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getPosts, getUserLikedPosts } from "../api/posts";
import { getBookmarkedPosts } from "../api/bookmarks";
import { isLoggedIn } from "../helpers/authHelper";
import CreatePost from "./CreatePost";
import Loading from "./Loading";
import PostCard from "./PostCard";
import SortBySelect from "./SortBySelect";
import HorizontalStack from "./util/HorizontalStack";

const POST_CATEGORIES = [
  "All",
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



const PostBrowser = (props) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [end, setEnd] = useState(false);
  const [sortBy, setSortBy] = useState("-createdAt");
  const [count, setCount] = useState(0);
  const [category, setCategory] = useState("All");
  const [feedScope, setFeedScope] = useState("All");
  const user = isLoggedIn();

  const [search] = useSearchParams();
  const [effect, setEffect] = useState(false);

  const searchExists =
    search && search.get("search") && search.get("search").length > 0;

  const fetchPosts = async () => {
    setLoading(true);
    const newPage = page + 1;
    setPage(newPage);

    let query = {
      page: newPage,
      sortBy,
    };

    let data;

    if (props.contentType === "posts") {
      if (props.profileUser) query.author = props.profileUser.username;
      if (searchExists) query.search = search.get("search");
      if (category && category !== "All") query.category = category;
      if (feedScope && feedScope !== "All") query.feedScope = feedScope;

      data = await getPosts(user && user.token, query);
    } else if (props.contentType === "liked") {
      data = await getUserLikedPosts(
        props.profileUser._id,
        user && user.token,
        query
      );
    } else if (props.contentType === "saved") {
      data = await getBookmarkedPosts(user && user.token, query);
    }

    if (!data || !data.data) {
      setLoading(false);
      return;
    }

    if (data.data.length < 10) {
      setEnd(true);
    }

    setLoading(false);
    if (!data.error) {
      setPosts([...posts, ...data.data]);
      setCount(data.count);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [sortBy, category, feedScope, effect]);

  useEffect(() => {
    setPosts([]);
    setPage(0);
    setEnd(false);
    setEffect(!effect);
  }, [search]);

  const handleSortBy = (e) => {
    const newSortName = e.target.value;
    let newSortBy;

    Object.keys(sorts).forEach((sortName) => {
      if (sorts[sortName] === newSortName) newSortBy = sortName;
    });

    setPosts([]);
    setPage(0);
    setEnd(false);
    setSortBy(newSortBy);
  };

  const handleCategory = (e) => {
    setPosts([]);
    setPage(0);
    setEnd(false);
    setCategory(e.target.value);
  };

  const removePost = (removedPost) => {
    setPosts(posts.filter((post) => post._id !== removedPost._id));
  };

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const contentTypeSorts = {
    posts: {
      "-createdAt": "Latest",
      "-likeCount": "Likes",
      "-commentCount": "Comments",
      createdAt: "Earliest",
    },
    liked: {
      "-createdAt": "Latest",
      createdAt: "Earliest",
    },
    saved: {
      "-createdAt": "Latest",
      createdAt: "Earliest",
    },
  };

  const sorts = contentTypeSorts[props.contentType];

  return (
    <>
      <Stack spacing={2}>
        <Card>
          <HorizontalStack justifyContent="space-between">
            {props.createPost && <CreatePost />}
            <HorizontalStack spacing={2}>
              {props.contentType === "posts" && (
                <HorizontalStack spacing={1}>
                  <Select
                    size="small"
                    value={feedScope}
                    onChange={(e) => {
                      setPosts([]);
                      setPage(0);
                      setEnd(false);
                      setFeedScope(e.target.value);
                    }}
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="All">All Departments</MenuItem>
                    {DEPARTMENTS.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography color="text.secondary" variant="subtitle2">
                    Category:
                  </Typography>
                  <Select
                    size="small"
                    value={category}
                    onChange={handleCategory}
                    sx={{ minWidth: 130 }}
                  >
                    {POST_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </HorizontalStack>
              )}
              <SortBySelect
                onSortBy={handleSortBy}
                sortBy={sortBy}
                sorts={sorts}
              />
            </HorizontalStack>
          </HorizontalStack>
        </Card>

        {searchExists && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Showing results for "{search.get("search")}"
            </Typography>
            <Typography color="text.secondary" variant="span">
              {count} results found
            </Typography>
          </Box>
        )}

        {posts.map((post, i) => (
          <PostCard
            preview="primary"
            key={post._id}
            post={post}
            removePost={removePost}
          />
        ))}

        {loading && <Loading />}
        {end ? (
          <Stack py={5} alignItems="center">
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {posts.length > 0 ? (
                <>All posts have been viewed</>
              ) : (
                <>No posts available</>
              )}
            </Typography>
            <Button variant="text" size="small" onClick={handleBackToTop}>
              Back to top
            </Button>
          </Stack>
        ) : (
          !loading &&
          posts &&
          posts.length > 0 && (
            <Stack pt={2} pb={6} alignItems="center" spacing={2}>
              <Button onClick={fetchPosts} variant="contained">
                Load more
              </Button>
              <Button variant="text" size="small" onClick={handleBackToTop}>
                Back to top
              </Button>
            </Stack>
          )
        )}
      </Stack>
    </>
  );
};

export default PostBrowser;
